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

import { decodeMigrationPayload } from './auth_pb.js';

/**
 * Decodes a base64 URL-encoded string into a Uint8Array
 * @param {string} encodedData - The base64 URL-encoded string to decode
 * @returns {Uint8Array} The decoded binary data as a Uint8Arra
 */
function decodeBase64UrlEncodedData(encodedData) {
	const base64String = decodeURIComponent(encodedData);
	const binaryString = atob(base64String);
	const bytes = new Uint8Array(binaryString.length);

	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	return bytes;
}

/**
 * Parses a migration protobuf payload containing OTP parameters
 * @param {string} encodedData - The encoded protobuf data
 * @returns {Promise<Array<{secret: string, name: string, issuer: string}>>} Array of parsed OTP accounts
 */
async function parseMigrationProtobuf(encodedData) {
	try {
		const decodedBytes = decodeBase64UrlEncodedData(encodedData);
		const message = decodeMigrationPayload(decodedBytes);
		const accounts = (message.otpParameters || []).map(otp => {
			const base32Secret = base32.encode(otp.secret).replace(/=+$/, '');
			return {
				secret: base32Secret,
				name: otp.name,
				issuer: otp.issuer,
			};
		});

		return accounts;
	} catch (error) {
		return [];
	}
}

/**
 * Parses an OTP authentication URL (either direct TOTP or migration URL)
 * @param {string} url - The OTP authentication URL to parse
 * @returns {Promise<Array<{secret: string, name: string, issuer?: string}>>} Array of parsed OTP accounts
 */
export async function parseOtpAuthUrl(url) {
	try {
		if (url.startsWith('otpauth://totp/')) {
			const params = new URL(url).searchParams;
			const secret = params.get('secret');
			const label = decodeURIComponent(url.split('otpauth://totp/')[1].split('?')[0]);
			return [{ secret, name: label }];
		} else if (url.startsWith('otpauth-migration://')) {
			const params = new URL(url).searchParams;
			const data = params.get('data');
			if (!data) return [];

			const accounts = await parseMigrationProtobuf(data);
			return accounts;
		} else {
			return [];
		}
	} catch (error) {
		return [];
	}
}

/**
 * Saves new accounts to storage, avoiding duplicates
 * @param {Array<Object>} newAccounts - Array of new accounts to save
 */
export function saveAccounts(newAccounts) {
	const dups = [];

	chrome.storage.sync.get(['accounts'], result => {
		const existing = result.accounts || [];

		newAccounts.forEach(acct => {
			if (!existing.some(stored => stored.secret === acct.secret)) {
				existing.push(acct);
			} else {
				dups.push(acct);
			}
		});

		chrome.storage.sync.set({ accounts: existing }, () => updateAccountsList());

		if (dups.length > 0) {
			return 'The following accounts already exist:\n' + dups.map(a => a.name).join('\n');
		}

		return true;
	});
}
