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

export async function setPassword(password) {
	if (!password || typeof password !== 'string') {
		throw new Error('Invalid password');
	}
	return new Promise((resolve, reject) => {
		chrome.storage.local.set({ encryptionPassword: password }, () => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message));
			} else {
				resolve();
			}
		});
	});
}

export async function getPassword() {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(['encryptionPassword'], result => {
			const password = result.encryptionPassword;
			resolve(password || null);
		});
	});
}

export async function passwordIsSet() {
	const password = await getPassword();
	return password !== null;
}

async function getPasswordKey() {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(['encryptionPassword'], async result => {
			const password = result.encryptionPassword;
			if (!password) {
				const message =
					'No password found in local storage. Please set your encryption password in options.';
				reject(new Error(message));
				alert(message);
				return;
			}
			const keyMaterial = await crypto.subtle.importKey(
				'raw',
				new TextEncoder().encode(password),
				{ name: 'PBKDF2' },
				false,
				['deriveKey'],
			);
			const salt = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
			const key = await crypto.subtle.deriveKey(
				{
					name: 'PBKDF2',
					salt,
					iterations: 100000,
					hash: 'SHA-256',
				},
				keyMaterial,
				{ name: 'AES-GCM', length: 256 },
				true,
				['encrypt', 'decrypt'],
			);
			resolve(key);
		});
	});
}

async function encryptData(data) {
	const key = await getPasswordKey();
	const iv = crypto.getRandomValues(new Uint8Array(12));
	// Convert data to string if it's an object
	const stringData = typeof data === 'object' ? JSON.stringify(data) : String(data);
	const encodedData = new TextEncoder().encode(stringData);
	const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedData);
	return { encrypted, iv: Array.from(iv) };
}

async function decryptData(encrypted, ivArray) {
	const key = await getPasswordKey();
	const iv = new Uint8Array(ivArray);
	const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
	const decodedString = new TextDecoder().decode(decrypted);
	// Try to parse as JSON if possible
	try {
		return JSON.parse(decodedString);
	} catch (e) {
		// If parsing fails, return the string as-is
		return decodedString;
	}
}

// Helper function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer) {
	const binary = String.fromCharCode(...new Uint8Array(buffer));
	return btoa(binary);
}

// Helper function to convert Base64 string back to ArrayBuffer
function base64ToArrayBuffer(base64) {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

export async function secureStore(key, value) {
	if (!key || value === undefined) {
		throw new Error('Invalid key or value');
	}
	const { encrypted, iv } = await encryptData(value);
	if (!encrypted || !iv) {
		throw new Error('Failed to encrypt data');
	}

	// Convert ArrayBuffer to Base64 string for storage
	const encryptedBase64 = arrayBufferToBase64(encrypted);

	return new Promise((resolve, reject) => {
		const data = { encrypted: encryptedBase64, iv };
		chrome.storage.sync.set({ [key]: data }, () => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message));
			} else {
				resolve();
			}
		});
	});
}

export async function secureGet(key) {
	if (!key) {
		throw new Error('Invalid key');
	}
	return new Promise((resolve, reject) => {
		chrome.storage.sync.get([key], async result => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message));
				return;
			}
			const data = result[key];
			if (!data) {
				resolve(null);
				return;
			}
			try {
				const { encrypted: encryptedBase64, iv } = data;
				if (!encryptedBase64 || !iv) {
					throw new Error('Invalid data format');
				}
				const encrypted = base64ToArrayBuffer(encryptedBase64);
				const value = await decryptData(encrypted, iv);
				resolve(value);
			} catch (error) {
				reject(error);
			}
		});
	});
}

export async function secureGetAll() {
	return new Promise((resolve, reject) => {
		chrome.storage.sync.get(null, async result => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message));
				return;
			}
			const decryptedItems = {};
			for (const [key, data] of Object.entries(result)) {
				if (data && data.encrypted && data.iv) {
					try {
						const encrypted = base64ToArrayBuffer(data.encrypted);
						const value = await decryptData(encrypted, data.iv);
						decryptedItems[key] = value;
					} catch (error) {
						console.error(`Failed to decrypt key "${key}":`, error.message);
						decryptedItems[key] = null;
					}
				} else {
					decryptedItems[key] = data;
				}
			}
			resolve(decryptedItems);
		});
	});
}

export async function secureDelete(key) {
	if (!key) {
		throw new Error('Invalid key');
	}
	return new Promise((resolve, reject) => {
		chrome.storage.sync.remove(key, () => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message));
			} else {
				resolve();
			}
		});
	});
}
