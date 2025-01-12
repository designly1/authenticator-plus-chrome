/*!
 * Title: AuthenticatorPlus
 * Author: Jay Simons
 * Website: https://1337707.xyz
 * Email: jay@designly.biz
 * (C) 2025
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Displays an overlay on the screen to allow the user to draw a selection box
 * for capturing a specific area, processing it, and sending it to a background script.
 */

import jsQR from 'jsqr';
import { parseOtpAuthUrl, saveAccounts } from './helpers';

export function marquee() {
	// Check for existing overlay first
	if (document.getElementById('marquee-overlay')) {
		throw new Error('Capture overlay already exists');
	}

	const overlay = document.createElement('div');
	overlay.id = 'marquee-overlay';
	Object.assign(overlay.style, {
		position: 'fixed',
		top: 0,
		left: 0,
		width: '100vw',
		height: '100vh',
		cursor: 'crosshair',
		zIndex: 999999,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
	});
	document.body.appendChild(overlay);

	// Create a container for the image/fallback
	const container = document.createElement('div');
	Object.assign(container.style, {
		width: '200px',
		height: '200px',
		display: 'none',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: '10px',
		padding: '20px',
	});
	overlay.appendChild(container);

	const centerContainer = document.createElement('div');
	Object.assign(centerContainer.style, {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		gap: '20px',
		maxWidth: '600px',
	});

	const marqueeGif = new Image();

	// Request the image from the background script
	chrome.runtime.sendMessage({ type: 'GET_MARQUEE_IMAGE' }, response => {
		if (chrome.runtime.lastError) {
			console.error('Failed to get marquee image:', chrome.runtime.lastError);
			return;
		}

		if (response && response.imageData) {
			Object.assign(marqueeGif.style, {
				width: '100%',
			});

			marqueeGif.onload = () => {
				container.innerHTML = '';
				centerContainer.appendChild(marqueeGif);
			};

			marqueeGif.onerror = () => {
				console.error('Failed to load marquee image data');
			};

			marqueeGif.src = response.imageData;
		}
	});

	const instructions = document.createElement('div');
	Object.assign(instructions.style, {
		color: '#2c2c2c',
		fontSize: '32px',
		textAlign: 'center',
		fontWeight: 'bold',
	});
	instructions.textContent = 'Click and drag to select the QR code';
	centerContainer.appendChild(instructions);

	const okButton = document.createElement('button');
	Object.assign(okButton.style, {
		padding: '20px 40px',
		backgroundColor: '#3c0cb5',
		color: '#fff',
		border: 'none',
		borderRadius: '5px',
		cursor: 'pointer',
		fontSize: '24px',
		marginTop: '20px',
	});
	okButton.textContent = 'OK';
	centerContainer.appendChild(okButton);

	overlay.appendChild(centerContainer);

	const selectionBox = document.createElement('div');
	Object.assign(selectionBox.style, {
		position: 'absolute',
		border: '2px dashed #151515',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		pointerEvents: 'none',
		display: 'none',
	});
	overlay.appendChild(selectionBox);

	let startX = 0,
		startY = 0;
	let isDrawing = false;

	function getPos(evt) {
		return { x: evt.clientX, y: evt.clientY };
	}

	function cleanup() {
		if (document.getElementById('marquee-overlay')) {
			document.body.removeChild(overlay);
			document.removeEventListener('keydown', escapeHandler);
		}
	}

	overlay.addEventListener('mousedown', evt => {
		centerContainer.style.display = 'none';
		overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
		evt.preventDefault();
		isDrawing = true;
		const { x, y } = getPos(evt);
		startX = x;
		startY = y;
		Object.assign(selectionBox.style, {
			left: `${x}px`,
			top: `${y}px`,
			width: '0px',
			height: '0px',
			display: 'block',
		});
	});

	function isOtpCode(data) {
		return data.startsWith('otpauth://') || data.startsWith('otpauth-migration://');
	}

	overlay.addEventListener('mousemove', evt => {
		if (!isDrawing) return;
		const { x, y } = getPos(evt);
		const left = Math.min(x, startX);
		const top = Math.min(y, startY);
		const width = Math.abs(x - startX);
		const height = Math.abs(y - startY);
		Object.assign(selectionBox.style, {
			left: `${left}px`,
			top: `${top}px`,
			width: `${width}px`,
			height: `${height}px`,
		});
	});

	overlay.addEventListener('mouseup', evt => {
		if (!isDrawing) return;
		isDrawing = false;
		const { x, y } = getPos(evt);
		const left = Math.min(x, startX);
		const top = Math.min(y, startY);
		const width = Math.abs(x - startX);
		const height = Math.abs(y - startY);

		// Minimum size check
		if (width < 10 || height < 10) {
			selectionBox.style.display = 'none';
			return;
		}

		const payload = { left, top, width, height };
		cleanup();

		chrome.runtime.sendMessage({ type: 'CAPTURE_AREA', payload }, response => {
			if (chrome.runtime.lastError) {
				console.error('Runtime error:', chrome.runtime.lastError);
				return;
			}

			if (response && response.success && response.imageDataUrl) {
				const img = new Image();
				img.src = response.imageDataUrl;

				img.onload = () => {
					const canvas = document.createElement('canvas');
					const ctx = canvas.getContext('2d');
					canvas.width = width;
					canvas.height = height;

					ctx.drawImage(img, left, top, width, height, 0, 0, width, height);
					const imageData = ctx.getImageData(0, 0, width, height);

					// Analyze the QR code using jsQR
					const code = jsQR(imageData.data, width, height);

					if (!code || !isOtpCode(code.data)) {
						alert('No valid QR code found.');
						return;
					}

					parseOtpAuthUrl(code.data)
						.then(accounts => {
							if (accounts.length > 0) {
								saveAccounts(accounts)
									.then(res => {
										if (typeof res === 'string') {
											alert(res);
											return;
										}
										alert('QR code added successfully!');
									})
									.catch(err => {
										alert('Failed to save accounts: ' + err.message);
									});
							} else {
								alert(
									"Failed to parse QR code. Please ensure it's a valid authenticator QR code.",
								);
							}
						})
						.catch(error => {
							alert('Error processing QR code: ' + error.message);
						});
				};

				img.onerror = () => {
					console.error('Failed to load captured image');
					alert('Failed to process the selected area.');
				};
			} else {
				console.error('Invalid capture response:', response);
				alert('Failed to capture the selected area.');
			}
		});
	});

	// Add cancel on escape key
	const escapeHandler = evt => {
		if (evt.key === 'Escape') {
			cleanup();
		}
	};
	document.addEventListener('keydown', escapeHandler);
}
