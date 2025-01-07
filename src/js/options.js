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

import { secureGetAll, secureDelete, setPassword, passwordIsSet } from '@lib/crypto';

const accountsList = document.getElementById('accounts-list');
const clearAccountsBtn = document.getElementById('clear-accounts');
const clearAllDataBtn = document.getElementById('clear-all-data-btn');
const optionsCloseBtn = document.getElementById('options-close-btn');
const accountTemplate = document.getElementById('account-template');
const requestCameraBtn = document.getElementById('req-camera-btn');
const requestCameraContainer = document.getElementById('req-camera');
const reqCameraMessage = document.getElementById('req-camera-message');
const camAccessGranted = document.getElementById('cam-access-granted');
const passwordForm = document.getElementById('password-form');
const passwordInput = document.getElementById('password');
const passwordSubmit = document.getElementById('submit-password');
const passwordIsSetContainer = document.getElementById('password-is-set');
const changePasswordBtn = document.getElementById('change-password-btn');

const defaultReqCameraMessage = reqCameraMessage.textContent;

async function loadAccounts() {
	try {
		const decryptedData = await secureGetAll();

		// Clear and rebuild the accounts list
		accountsList.innerHTML = '';

		for (const [key, account] of Object.entries(decryptedData)) {
			const clone = accountTemplate.content.cloneNode(true);
			const span = clone.querySelector('span');
			const button = clone.querySelector('button.delete-account');

			span.textContent = account.name;
			button.dataset.key = key;
			button.dataset.name = account.name;

			accountsList.appendChild(clone);
		}

		bindDeleteButtons();
	} catch (error) {
		console.error('Failed to load accounts:', error);
		accountsList.innerHTML =
			'<p class="error">Failed to load accounts. Please check your encryption password.</p>';
	}
}

function bindDeleteButtons() {
	document.querySelectorAll('button.delete-account').forEach(btn => {
		btn.addEventListener('click', confirmDeleteAccount);
	});
}

async function confirmDeleteAccount(event) {
	const button = event.target.closest('button.delete-account');
	if (!button) return;

	const key = button.dataset.key;
	const name = button.dataset.name;

	if (confirm(`Are you sure you want to delete ${name}?`)) {
		try {
			await secureDelete(key);
			await loadAccounts();
		} catch (error) {
			console.error('Failed to delete account:', error);
			alert('Failed to delete account. Please try again.');
		}
	}
}

async function confirmDeleteAllAccounts() {
	if (confirm('Are you sure you want to delete all accounts? This action cannot be undone.')) {
		await deleteAllAccounts();
	}
}

async function deleteAllAccounts() {
	try {
		await chrome.storage.sync.clear();
		await loadAccounts();
	} catch (error) {
		console.error('Failed to delete all data:', error);
		alert('Failed to delete all data. Please try again.');
	}
}

const confirmClearAllData = async () => {
	if (confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
		await chrome.storage.sync.clear();
		await chrome.storage.local.clear();
		window.location.reload();
	}
};

const confirmChangePassword = async () => {
	const message =
		'Are you sure you want to change your password? If you do, your current accounts will be unreadable.';
	if (confirm(message)) {
		passwordForm.classList.remove('hidden');
		passwordIsSetContainer.classList.add('hidden');
	}
};

clearAccountsBtn.addEventListener('click', confirmDeleteAllAccounts);

clearAllDataBtn.addEventListener('click', confirmClearAllData);

optionsCloseBtn.addEventListener('click', () => {
	window.close();
});

changePasswordBtn.addEventListener('click', confirmChangePassword);

function resetCameraAccessMessage() {
	reqCameraMessage.textContent = defaultReqCameraMessage;
	reqCameraMessage.classList.remove('error');
	requestCameraContainer.classList.add('hidden');
}

function cameraAccessError(message) {
	reqCameraMessage.textContent = message;
	reqCameraMessage.classList.add('error');
	requestCameraContainer.classList.remove('hidden');
	camAccessGranted.classList.add('hidden');
}

async function checkCameraAccess() {
	resetCameraAccessMessage();

	try {
		// Check if camera permission has been granted
		const permissions = await navigator.permissions.query({ name: 'camera' });

		switch (permissions.state) {
			case 'prompt':
				requestCameraContainer.classList.remove('hidden');
				break;
			case 'denied':
				const message = 'Camera access is denied. Please allow access in your browser settings.';
				cameraAccessError(message);
				break;
			case 'granted':
				requestCameraContainer.classList.add('hidden');
				camAccessGranted.classList.remove('hidden');
				break;
			default:
				cameraAccessError('Unknown camera access state.');
				break;
		}
	} catch (error) {
		console.warn('Permissions API not supported or error occurred:', error);
	}
}

requestCameraBtn.addEventListener('click', async () => {
	try {
		await navigator.mediaDevices.getUserMedia({ video: true });
		requestCameraContainer.classList.add('hidden');
		camAccessGranted.classList.remove('hidden');
	} catch (err) {
		const message = 'Unable to access the camera. Please check your browser settings.';
		reqCameraMessage.textContent = message;
		reqCameraMessage.classList.add('error');
	}
});

passwordSubmit.addEventListener('click', async () => {
	const password = passwordInput.value;

	if (!password) {
		alert('Please enter a password.');
		return;
	}

	try {
		await setPassword(password);
		await loadAccounts();
		passwordInput.value = '';
		passwordIsSetContainer.classList.remove('hidden');
		passwordForm.classList.add('hidden');
	} catch (error) {
		console.error('Failed to set password:', error);
		alert('Failed to set password. Please try again.');
	}
});

// Initial load
loadAccounts();
checkCameraAccess();

// Check if password is already set
passwordIsSet().then(isSet => {
	if (isSet) {
		passwordIsSetContainer.classList.remove('hidden');
		passwordForm.classList.add('hidden');
	} else {
		passwordIsSetContainer.classList.add('hidden');
		passwordForm.classList.remove('hidden');
	}
});
