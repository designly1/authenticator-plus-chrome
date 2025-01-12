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
import base32 from 'hi-base32';
import { secureGetAll, secureStore } from './crypto.js';

/**
 * Decodes a base64 URL-encoded string into a Uint8Array
 * @param {string} encodedData - The base64 URL-encoded string to decode
 * @returns {Uint8Array} The decoded binary data as a Uint8Array
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
			// Get the part between 'totp/' and '?' directly using split
			const label = decodeURIComponent(url.split('otpauth://totp/')[1].split('?')[0]);

			let name;
			let issuer = params.get('issuer') || undefined;

			// Split label into issuer and name parts
			const labelParts = label.split(':');
			if (labelParts.length === 2) {
				const [labelIssuer, labelName] = labelParts;
				name = labelName.trim();
				// If issuer parameter matches label issuer, or if no issuer parameter exists
				if (!issuer || labelIssuer === issuer) {
					issuer = labelIssuer.trim();
				}
			} else {
				// If no colon in label, use entire label as name
				name = label.trim();
			}

			return [{ secret, name, issuer }];
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
		console.error('Error parsing URL:', error);
		return [];
	}
}
/**
 * Generates a random string of alphanumeric characters
 * @param {number} length - The length of the random string to generate
 * @returns {string} The generated random string
 */
export function generateRandomString(length = 4) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

function stripAllNonAlphaNumericChars(str) {
	if (!str) return '';
	return str.replace(/[^a-z0-9]/gi, '');
}

/**
 * Saves new accounts to storage, avoiding duplicates
 * @param {Array<Object>} newAccounts - Array of new accounts to save
 * @returns {Promise<boolean|string>} True if successful, or a string with error message
 */
export async function saveAccounts(newAccounts) {
	const dups = [];
	const existingAccounts = await secureGetAll();

	for (const acct of newAccounts) {
		const issuerPart = stripAllNonAlphaNumericChars(acct.issuer) || generateRandomString();
		const namePart = stripAllNonAlphaNumericChars(acct.name);
		const key = `account_${issuerPart}_${namePart}`;
		if (Object.values(existingAccounts).find(a => a.secret === acct.secret)) {
			dups.push(acct);
		} else {
			try {
				await secureStore(key, acct);
				console.log(`Account ${acct.name} (${issuerPart}) saved successfully.`);
			} catch (error) {
				console.error(`Failed to save account ${acct.name} (${issuerPart}):`, error.message);
			}
		}
	}

	if (dups.length > 0) {
		return `The following accounts already exist:\n${dups
			.map(a => `${a.name} (${a.issuer || 'No Issuer'})`)
			.join('\n')}`;
	}

	return true;
}
