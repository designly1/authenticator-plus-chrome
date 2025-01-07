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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	switch (message.type) {
		case 'GET_MARQUEE_IMAGE': {
			const imageUrl = chrome.runtime.getURL('assets/marquee.gif');
			fetch(imageUrl)
				.then(response => {
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					return response.blob();
				})
				.then(blob => {
					const reader = new FileReader();
					reader.onloadend = () => {
						sendResponse({ success: true, imageData: reader.result });
					};
					reader.onerror = () => {
						sendResponse({ success: false, error: 'Failed to read image data' });
					};
					reader.readAsDataURL(blob);
				})
				.catch(error => {
					console.error('Error loading marquee image:', error);
					sendResponse({ success: false, error: error.message });
				});
			return true;
		}

		case 'TRIG_CAPTURE_QR_CODE': {
			console.log('Background script received TRIG_CAPTURE_QR_CODE');
			chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
				if (tabs.length === 0) {
					sendResponse({ success: false, error: 'No active tab found.' });
					return;
				}

				chrome.tabs.sendMessage(tabs[0].id, { type: 'CAPTURE_QR_CODE' }, response => {
					console.log('Content script response:', response);
					if (chrome.runtime.lastError) {
						sendResponse({
							success: false,
							error: chrome.runtime.lastError.message,
						});
					} else {
						sendResponse(response);
					}
				});
			});
			return true;
		}

		case 'CAPTURE_AREA': {
			chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
				if (tabs.length === 0) {
					sendResponse({ success: false, error: 'No active tab found.' });
					return;
				}

				const windowId = tabs[0].windowId;

				try {
					chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, imageDataUrl => {
						if (chrome.runtime.lastError) {
							sendResponse({ success: false, error: chrome.runtime.lastError.message });
						} else {
							sendResponse({ success: true, imageDataUrl });
						}
					});
				} catch (error) {
					sendResponse({ success: false, error: error.message });
				}
			});
			return true;
		}

		default:
			console.warn('Unhandled message type:', message.type);
			sendResponse({ success: false, error: `Unhandled message type: ${message.type}` });
	}
});
