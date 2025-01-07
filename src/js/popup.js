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

import { parseOtpAuthUrl, saveAccounts } from '@lib/helpers.js';
import { secureGetAll } from '@lib/crypto.js';

/** Time constants in milliseconds */
const TOTAL_TIME = 30;
const INTERVAL = 1000;
const EXPIRE_THRESHOLD = 5;

/** DOM element references */
const accountsContainer = document.getElementById('accounts');
const addCameraBtn = document.getElementById('add-camera');
const marqueeBtn = document.getElementById('marquee');
const noAccountsEl = document.getElementById('no-accounts');

/** State variables */
let cachedAccounts = [];
let cameraIsOn = false;

/** HTML5 QR Code scanner instance */
const html5QrCode = new Html5Qrcode('qr-reader');

/**
 * Sets or clears the error message in the UI
 * @param {string} message - The error message to display (empty string to clear)
 */
function setErrorMessage(message) {
	const errorModal = document.getElementById('error-modal');
	const errorDiv = document.getElementById('error-message');
	errorDiv.textContent = message;

	if (message) {
		errorModal.classList.add('show');
	} else {
		errorModal.classList.remove('show');
	}
}

/**
 * Clears any displayed error message
 */
function clearErrorMessage() {
	setErrorMessage('');
}

/**
 * Hides the accounts container
 */
function hideAccountsContainer() {
	accountsContainer.classList.remove('show');
}

/**
 * Shows the accounts container
 */
function showAccountsContainer() {
	accountsContainer.classList.add('show');
}

/**
 * Generates a TOTP code from a secret
 * @param {string} secret - The secret key for TOTP generation
 * @returns {string} The generated TOTP code or error message
 */
function generateTotp(secret) {
	if (!secret || typeof secret !== 'string') return 'Invalid Secret';

	const totp = otplib.authenticator;
	totp.options = { step: 30 };
	return totp.generate(secret);
}

/**
 * Generates an SVG arc path description
 * @param {number} cx - Center X coordinate
 * @param {number} cy - Center Y coordinate
 * @param {number} r - Radius
 * @param {number} startAngle - Starting angle in degrees
 * @param {number} endAngle - Ending angle in degrees
 * @returns {string} SVG path description string
 */
function describeArc(cx, cy, r, startAngle, endAngle) {
	const startRad = (Math.PI / 180) * (startAngle - 90);
	const endRad = (Math.PI / 180) * (endAngle - 90);
	const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

	const startX = cx + r * Math.cos(startRad);
	const startY = cy + r * Math.sin(startRad);
	const endX = cx + r * Math.cos(endRad);
	const endY = cy + r * Math.sin(endRad);

	return `M${cx},${cy} L${startX},${startY} A${r},${r} 0 ${largeArcFlag},1 ${endX},${endY} Z`;
}

/** Map to store account element references and states */
const accountElements = new Map();

/**
 * Creates DOM elements for displaying an account
 * @param {Object} account - The account object
 * @returns {Object} Object containing references to created DOM elements and state
 */
function createAccountElement(account) {
	const template = document.getElementById('account-template');
	const clone = template.content.cloneNode(true);
	const element = document.createElement('div');
	element.appendChild(clone);

	return {
		container: element,
		nameEl: element.querySelector('.account-name'),
		issuerEl: element.querySelector('.account-issuer'),
		totpEl: element.querySelector('.account-totp'),
		pathEl: element.querySelector('.pie-sector'),
		copiedEl: element.querySelector('.account-item-is-copied'),
		currentAngle: 360,
	};
}

/**
 * Animates the progress arc for an account
 * @param {Object} state - The account element state object
 */
function animateArc(state) {
	const cx = 50;
	const cy = 50;
	const r = 45;

	function updatePath() {
		const now = Date.now() / 1000;
		const progress = (now % TOTAL_TIME) / TOTAL_TIME;
		const targetAngle = 360 * (1 - progress);
		const d = describeArc(cx, cy, r, 0, targetAngle);
		state.pathEl.setAttribute('d', d);
		state.animationFrame = requestAnimationFrame(updatePath);
	}

	if (state.animationFrame) {
		cancelAnimationFrame(state.animationFrame);
	}

	state.animationFrame = requestAnimationFrame(updatePath);
}

/**
 * Retrieves all accounts from storage and updates the cached accounts list
 * @returns {Promise<void>} A promise that resolves when the accounts are updated
 * @async
 */
async function syncCachedAccounts() {
	const decryptedAccounts = await secureGetAll();
	cachedAccounts = Object.values(decryptedAccounts) || [];
}

async function refreshAccounts() {
	await syncCachedAccounts();
	updateAccountsList();
}

/**
 * Updates the displayed accounts list from storage
 * @returns {Promise<void>} A promise that resolves when the accounts are updated
 * @async
 */
async function updateAccountsList() {
	if (cachedAccounts.length === 0) {
		await syncCachedAccounts();
	}
	noAccountsEl.classList.toggle('hidden', cachedAccounts.length > 0);

	const currentSecrets = new Set(cachedAccounts.map(a => a.secret));

	for (const [secret, state] of accountElements) {
		if (!currentSecrets.has(secret)) {
			state.container.remove();
			if (state.animationFrame) {
				cancelAnimationFrame(state.animationFrame);
			}
			accountElements.delete(secret);
		}
	}

	for (const account of cachedAccounts) {
		let state = accountElements.get(account.secret);
		if (!state) {
			state = createAccountElement(account);
			accountElements.set(account.secret, state);
			accountsContainer.appendChild(state.container);
			animateArc(state);
		}

		state.nameEl.textContent = account.name;
		state.issuerEl.textContent = account.issuer;
		const totp = generateTotp(account.secret);
		state.totpEl.textContent = totp;

		const parent = state.totpEl.parentElement.parentElement;
		parent.addEventListener('click', () => {
			// Copy TOTP code to clipboard
			navigator.clipboard.writeText(totp).then(
				() => {
					state.copiedEl.classList.remove('hidden');
					setTimeout(() => {
						state.copiedEl.classList.add('hidden');
					}, 500);
				},
				() => {
					setErrorMessage('Failed to copy TOTP code to clipboard');
				},
			);
		});

		const now = Date.now() / 1000;
		const progress = (now % TOTAL_TIME) / TOTAL_TIME;
		if (progress * TOTAL_TIME > TOTAL_TIME - EXPIRE_THRESHOLD) {
			state.totpEl.classList.add('expiring');
		} else {
			state.totpEl.classList.remove('expiring');
		}
	}
}

// Event Listeners
addCameraBtn.addEventListener('click', async () => {
	clearErrorMessage();

	hideAccountsContainer();

	if (cameraIsOn) {
		html5QrCode.stop();
		cameraIsOn = false;
		addCameraBtn.classList.remove('active');
		showAccountsContainer();
		return;
	}

	cameraIsOn = true;
	addCameraBtn.classList.add('active');
	html5QrCode
		.start({ facingMode: 'user' }, { fps: 10, qrbox: { width: 250, height: 250 } }, async decodedText => {
			const accounts = await parseOtpAuthUrl(decodedText);
			if (accounts.length > 0) {
				clearErrorMessage();
				const result = await saveAccounts(accounts);
				if (typeof result === 'string') {
					setErrorMessage(result);
				}
				refreshAccounts();
			}
			html5QrCode.stop();
			showAccountsContainer();
			cameraIsOn = false;
			addCameraBtn.classList.remove('active');
		})
		.catch(e => {
			cameraIsOn = false;
			addCameraBtn.classList.remove('active');
			if (typeof e === 'string' && e.includes('Permission')) {
				setErrorMessage('Permission to access camera is required. Please request permission in options.');
			} else {
				setErrorMessage('Failed to start camera.');
			}
		});
});

marqueeBtn.addEventListener('click', e => {
	e.stopPropagation();
	clearErrorMessage();
	chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
		if (tabs.length === 0) return;

		const activeTab = tabs[0];
		if (activeTab.url.startsWith('chrome://')) {
			setErrorMessage('Cannot capture QR code on chrome:// pages.');
			return;
		}

		chrome.runtime.sendMessage({ type: 'TRIG_CAPTURE_QR_CODE' }, response => {
			if (chrome.runtime.lastError) {
				console.error(chrome.runtime.lastError);
				setErrorMessage('Failed to communicate with background script');
				return;
			}
			window.close();
		});
	});
});

const closeErrorBtn = document.getElementById('close-error');
closeErrorBtn.addEventListener('click', () => {
	clearErrorMessage();
});

const optionsBtn = document.getElementById('options-btn');
optionsBtn.addEventListener('click', () => {
	chrome.runtime.openOptionsPage();
});

// Initialize
updateAccountsList();
setInterval(updateAccountsList, INTERVAL);
clearErrorMessage();
