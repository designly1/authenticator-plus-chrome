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

import { secureGetAll, secureDelete, setPassword, passwordIsSet, secureStore } from '@lib/crypto';
import { passwordSettings } from '../constants/password';
import generatePassword from '../lib/generate-password';
import { stripAllNonAlphaNumericChars, generateRandomString } from '../lib/helpers';

const accountsList = document.getElementById('accounts-list');
const clearAccountsBtn = document.getElementById('clear-accounts');
const clearAllDataBtn = document.getElementById('clear-all-data-btn');
const optionsCloseBtn = document.getElementById('options-close-btn');
const accountTemplate = document.getElementById('account-template');
const requestCameraBtn = document.getElementById('req-camera-btn');
const requestCameraContainer = document.getElementById('req-camera');
const reqCameraMessage = document.getElementById('req-camera-message');
const camAccessGranted = document.getElementById('cam-access-granted');
const passwordFormContainer = document.getElementById('password-form-container');
const passwordInput = document.getElementById('password');
const passwordSubmit = document.getElementById('submit-password');
const generatePasswordBtn = document.getElementById('generate-password');
const passwordIsSetContainer = document.getElementById('password-is-set');
const changePasswordBtn = document.getElementById('change-password-btn');
const introContainer = document.getElementById('intro');
const introCloseBtn = document.getElementById('intro-close-btn');
const helpBtn = document.getElementById('help-btn');
const qrCodeModal = document.getElementById('qr-code-modal');
const qrCode = document.getElementById('qr-code');
const closeQrCodeBtn = document.getElementById('close-qr-code-btn');
const restoreBtn = document.getElementById('options-restore-btn');
const backupBtn = document.getElementById('options-backup-btn');
const editBtn = document.getElementById('edit-btn');
const editModal = document.getElementById('edit-modal');
const optionsContainer = document.getElementById('options-container');
const editAccountsList = document.getElementById('edit-accounts-list');
const editAccountTemplate = document.getElementById('edit-account-template');

const defaultReqCameraMessage = reqCameraMessage.textContent;

// Keep track of account order
let accountsOrder = [];

async function loadAccounts() {
	try {
		const decryptedData = await secureGetAll();

		// Get the account order from storage
		const orderData = await chrome.storage.local.get('accountsOrder');
		accountsOrder = orderData.accountsOrder || [];

		// Clear and rebuild the accounts list
		accountsList.innerHTML = '';

		if (Object.keys(decryptedData).length === 0) {
			accountsList.innerHTML = '<p id="accounts-list-none">No accounts added yet.</p>';
			return;
		}

		// Prepare accounts for display
		let accountsToDisplay = [];

		// First add accounts in the saved order
		for (const key of accountsOrder) {
			if (decryptedData[key]) {
				accountsToDisplay.push({
					key,
					account: decryptedData[key],
				});
				delete decryptedData[key];
			}
		}

		// Then add any accounts not in the order (new accounts)
		for (const [key, account] of Object.entries(decryptedData)) {
			accountsToDisplay.push({
				key,
				account,
			});
		}

		// Update the order with the final list of keys
		accountsOrder = accountsToDisplay.map(item => item.key);
		await chrome.storage.local.set({ accountsOrder });

		// Now create the DOM elements
		for (const { key, account } of accountsToDisplay) {
			const clone = accountTemplate.content.cloneNode(true);
			const accountItem = clone.querySelector('.account-item');
			const span = clone.querySelector('span');
			const deleteButton = clone.querySelector('button.delete-account');
			const qrButton = clone.querySelector('button.show-qr');

			span.textContent = `[${account.issuer || 'No issuer'}] ${account.name}`;
			deleteButton.dataset.key = key;
			deleteButton.dataset.name = account.name;
			qrButton.dataset.key = key;
			qrButton.dataset.name = account.name;
			qrButton.dataset.secret = account.secret;
			qrButton.dataset.issuer = account.issuer;

			// Add data attribute for drag and drop
			accountItem.dataset.key = key;

			accountsList.appendChild(clone);
		}

		bindDeleteButtons();
		bindShowQrButtons();
		bindDragAndDrop();
	} catch (error) {
		console.error('Failed to load accounts:', error);
		accountsList.innerHTML =
			'<p class="failed-account-error">Failed to load accounts. Please check your encryption password.</p>';
	}
}

function bindDeleteButtons() {
	document.querySelectorAll('button.delete-account').forEach(btn => {
		btn.addEventListener('click', confirmDeleteAccount);
	});
}

function bindShowQrButtons() {
	document.querySelectorAll('button.show-qr').forEach(btn => {
		btn.addEventListener('click', showQrCode);
	});
}

function backupData() {
	chrome.storage.sync.get(null, items => {
		const data = JSON.stringify(items);
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		const date = new Date()
			.toLocaleString('en-US', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
			})
			.replace(/(\d+)\/(\d+)\/(\d+), /, '$3-$1-$2-');
		const filename = `authenticator-plus-backup-${date}.json`;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		URL.revokeObjectURL(url);
		document.body.removeChild(a);
	});
}

function restoreData() {
	const input = document.createElement('input');
	input.style.display = 'none';
	input.type = 'file';
	input.accept = '.json';
	input.click();
	input.addEventListener('change', async () => {
		const file = input.files[0];
		const reader = new FileReader();
		reader.onload = async () => {
			const data = JSON.parse(reader.result);
			await chrome.storage.sync.clear();
			await chrome.storage.sync.set(data);
			await loadAccounts();
		};
		reader.readAsText(file);
		alert('Data restored successfully.');
	});

	document.body.appendChild(input);
}

backupBtn.addEventListener('click', backupData);
restoreBtn.addEventListener('click', restoreData);

const qr = new QRCode(qrCode);

async function showQrCode(event) {
	const button = event.target.closest('button.show-qr');
	if (!button) return;

	const secret = button.dataset.secret;
	const issuer = button.dataset.issuer;
	const name = button.dataset.name;

	const otpauth = `otpauth://totp/${issuer}:${name}?secret=${secret}&issuer=${issuer}`;

	qr.clear();
	qr.makeCode(otpauth);
	qrCodeModal.classList.remove('hidden');
}

closeQrCodeBtn.addEventListener('click', () => {
	qrCodeModal.classList.add('hidden');
});

// Function to handle drag and drop events
function bindDragAndDrop() {
	const accountItems = accountsList.querySelectorAll('.account-item');

	// No accounts or only one account? No need for dragging
	if (accountItems.length <= 1) return;

	let draggedItem = null;

	// Enable drag on each account item
	accountItems.forEach(item => {
		// Drag start - when user starts dragging an item
		item.addEventListener('dragstart', e => {
			draggedItem = item;
			e.dataTransfer.setData('text/plain', item.dataset.key); // Required for Firefox
			e.dataTransfer.effectAllowed = 'move';

			// Add a delay to apply the dragging class (helps with rendering)
			setTimeout(() => {
				item.classList.add('dragging');
			}, 0);
		});

		// Drag end - when user stops dragging
		item.addEventListener('dragend', () => {
			item.classList.remove('dragging');
			draggedItem = null;

			// Reset all potential drop positions
			document.querySelectorAll('.account-item').forEach(item => {
				item.classList.remove('drag-over-top');
				item.classList.remove('drag-over-bottom');
			});
		});
	});

	// Make the container accept drops
	accountsList.addEventListener('dragover', e => {
		e.preventDefault(); // Allow dropping
		e.dataTransfer.dropEffect = 'move';

		if (!draggedItem) return;

		// Find the item we're dragging over
		const target = e.target.closest('.account-item');
		if (!target || target === draggedItem) return;

		// Determine if we're in the top or bottom half of the target
		const rect = target.getBoundingClientRect();
		const midY = rect.top + rect.height / 2;
		const isAbove = e.clientY < midY;

		// Clear previous visual indicators
		document.querySelectorAll('.account-item').forEach(item => {
			if (item !== target) {
				item.classList.remove('drag-over-top');
				item.classList.remove('drag-over-bottom');
			}
		});

		// Add visual indicator for drop position
		if (isAbove) {
			target.classList.add('drag-over-top');
			target.classList.remove('drag-over-bottom');
		} else {
			target.classList.add('drag-over-bottom');
			target.classList.remove('drag-over-top');
		}
	});

	// Handle the actual drop
	accountsList.addEventListener('drop', e => {
		e.preventDefault();

		// Find the target item we're dropping onto
		const target = e.target.closest('.account-item');
		if (!target || target === draggedItem || !draggedItem) return;

		// Determine where to insert the dragged item
		const rect = target.getBoundingClientRect();
		const midY = rect.top + rect.height / 2;
		const isAbove = e.clientY < midY;

		// Insert the dragged item
		if (isAbove) {
			accountsList.insertBefore(draggedItem, target);
		} else {
			accountsList.insertBefore(draggedItem, target.nextSibling);
		}

		// Remove all visual indicators
		document.querySelectorAll('.account-item').forEach(item => {
			item.classList.remove('drag-over-top');
			item.classList.remove('drag-over-bottom');
		});

		// Save the new order
		updateAccountsOrder();
	});

	// Clear visual indicators when dragging leaves an item
	accountsList.addEventListener('dragleave', e => {
		const target = e.target.closest('.account-item');
		if (target) {
			target.classList.remove('drag-over-top');
			target.classList.remove('drag-over-bottom');
		}
	});
}

// Update the order of accounts in storage
async function updateAccountsOrder() {
	const accountItems = accountsList.querySelectorAll('.account-item');
	accountsOrder = Array.from(accountItems).map(item => item.dataset.key);

	await chrome.storage.local.set({ accountsOrder });
}

// When deleting an account, also remove it from the order
async function confirmDeleteAccount(event) {
	const button = event.target.closest('button.delete-account');
	if (!button) return;

	const key = button.dataset.key;
	const name = button.dataset.name;

	if (confirm(`Are you sure you want to delete ${name}?`)) {
		try {
			await secureDelete(key);

			// Also remove from order
			const index = accountsOrder.indexOf(key);
			if (index !== -1) {
				accountsOrder.splice(index, 1);
				await chrome.storage.local.set({ accountsOrder });
			}

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

// When clearing all accounts, also clear the order
async function deleteAllAccounts() {
	try {
		await chrome.storage.sync.clear();
		accountsOrder = [];
		await chrome.storage.local.set({ accountsOrder });
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
		passwordFormContainer.classList.remove('hidden');
		passwordIsSetContainer.classList.add('hidden');
	}
};

const toggleEditModal = () => {
	editModal.classList.toggle('show');
	optionsContainer.classList.toggle('hidden');

	// If we're showing the modal, populate the accounts
	if (editModal.classList.contains('show')) {
		populateEditForms();
	}
};

// Remove the initial call to toggleEditModal since we don't want to show the modal on page load
// toggleEditModal();

editBtn.addEventListener('click', toggleEditModal);

// Make sure we remove any existing event listener before adding a new one
const cancelEditBtn = document.getElementById('cancel-edit-btn');
cancelEditBtn.removeEventListener('click', toggleEditModal);
cancelEditBtn.addEventListener('click', toggleEditModal);

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
	let passwordScore = 0;

	if (!password) {
		alert('Please enter a password.');
		return;
	}

	const passwordScoreInput = document.getElementById('password-score');
	passwordScore = parseInt(passwordScoreInput.value, 10);

	if (passwordScore < passwordSettings.minScore) {
		alert('Password is too weak. Please try again.');
		return;
	}

	try {
		await setPassword(password);
		await loadAccounts();
		passwordInput.value = '';
		passwordIsSetContainer.classList.remove('hidden');
		passwordFormContainer.classList.add('hidden');
	} catch (error) {
		console.error('Failed to set password:', error);
		alert('Failed to set password. Please try again.');
	}
});

generatePasswordBtn.addEventListener('click', () => {
	const password = generatePassword();
	passwordInput.value = password;
	// set password type to text to show the generated password
	passwordInput.type = 'text';
	// trigger password strength check
	passwordInput.dispatchEvent(new Event('input'));
});

async function checkIntroShown() {
	const val = await chrome.storage.local.get('introShown');
	if (val.introShown) {
		introContainer.classList.add('hidden');
	} else {
		introContainer.classList.remove('hidden');
	}
}

introCloseBtn.addEventListener('click', () => {
	introContainer.classList.add('hidden');
	chrome.storage.local.set({ introShown: true });
});

helpBtn.addEventListener('click', () => {
	introContainer.classList.remove('hidden');
});

// Initial load
checkIntroShown();
loadAccounts();
checkCameraAccess();

// Check if password is already set
passwordIsSet().then(isSet => {
	if (isSet) {
		passwordIsSetContainer.classList.remove('hidden');
		passwordFormContainer.classList.add('hidden');
	} else {
		passwordIsSetContainer.classList.add('hidden');
		passwordFormContainer.classList.remove('hidden');
	}
});

async function populateEditForms() {
	try {
		const decryptedData = await secureGetAll();
		editAccountsList.innerHTML = ''; // Clear existing forms

		// Get accounts in the correct order
		const orderData = await chrome.storage.local.get('accountsOrder');
		const accountsOrder = orderData.accountsOrder || [];

		// Prepare accounts for display
		let accountsToDisplay = [];

		// First add accounts in the saved order
		for (const key of accountsOrder) {
			if (decryptedData[key]) {
				accountsToDisplay.push({
					key,
					account: decryptedData[key],
				});
				delete decryptedData[key];
			}
		}

		// Then add any accounts not in the order
		for (const [key, account] of Object.entries(decryptedData)) {
			accountsToDisplay.push({
				key,
				account,
			});
		}

		// Create edit forms for each account
		for (const { key, account } of accountsToDisplay) {
			const clone = editAccountTemplate.content.cloneNode(true);
			const form = clone.querySelector('form');
			const keyInput = clone.querySelector('.edit-account-key');
			const nameInput = clone.querySelector('.edit-account-name');
			const issuerInput = clone.querySelector('.edit-account-issuer');
			const secretInput = clone.querySelector('.edit-account-secret');

			keyInput.value = key;
			nameInput.value = account.name;
			issuerInput.value = account.issuer || '';
			secretInput.value = account.secret;

			// Add form submit handler
			form.addEventListener('submit', async e => {
				e.preventDefault();

				const updatedAccount = {
					name: nameInput.value.trim(),
					issuer: issuerInput.value.trim(),
					secret: secretInput.value.trim(),
				};

				// Validate required fields
				if (!updatedAccount.name || !updatedAccount.secret) {
					alert('Name and Secret are required fields.');
					return;
				}

				try {
					// Generate new key based on updated issuer and name
					const issuerPart =
						stripAllNonAlphaNumericChars(updatedAccount.issuer) || generateRandomString();
					const namePart = stripAllNonAlphaNumericChars(updatedAccount.name);
					const newKey = `account_${issuerPart}_${namePart}`;

					// If the key has changed, we need to delete the old one and create a new one
					if (newKey !== key) {
						await secureDelete(key);
						// Update the order array
						const index = accountsOrder.indexOf(key);
						if (index !== -1) {
							accountsOrder[index] = newKey;
							await chrome.storage.local.set({ accountsOrder });
						}
					}

					// Save the updated account
					await secureStore(newKey, updatedAccount);
					console.log('Account saved successfully:', updatedAccount);

					// Show success alert
					const successAlert = form.querySelector('.success-alert');
					successAlert.style.display = 'block';

					// Wait for the alert to be shown before refreshing
					setTimeout(async () => {
						successAlert.style.display = 'none';
						// Refresh the accounts list and forms after the alert is hidden
						await loadAccounts();
						await populateEditForms();
					}, 3000);
				} catch (error) {
					console.error('Failed to save account:', error);
					alert('Failed to save account. Please try again.');
				}
			});

			editAccountsList.appendChild(clone);
		}
	} catch (error) {
		console.error('Failed to populate edit forms:', error);
		alert('Failed to load accounts for editing. Please try again.');
	}
}
