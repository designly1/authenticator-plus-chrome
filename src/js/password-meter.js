import { passwordSettings } from '../constants/password';

const pwEndpoint = passwordSettings.endpoint;

// Keep track of the latest request to handle race conditions
let currentRequestId = 0;

// Strength meter update function
function updateStrength(result) {
	const container = document.querySelector('.password-feedback');
	const scoreInput = document.querySelector('#password-score');

	const score = result.score;
	scoreInput.value = score;

	// Update score class while preserving others
	container.classList.forEach(className => {
		if (className.startsWith('score-')) {
			container.classList.remove(className);
		}
	});
	container.classList.add(`score-${score}`);

	// Update strength label
	const words = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
	const strengthText = document.querySelector('#strength-text');
	strengthText.textContent = words[score];

	// Update strength bar
	const strengthBar = document.querySelector('.strength-bar-fill');
	strengthBar.style.width = `${(score / 4) * 100}%`;

	// Update icon
	const icon = document.querySelector('.strength-icon');
	if (score >= 3) {
		icon.innerHTML = `
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        `;
		icon.setAttribute('stroke', '#16a34a');
	} else {
		icon.innerHTML = `
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        `;
		icon.setAttribute('stroke', '#dc2626');
	}

	// Update crack time text
	const crackTimeText = document.querySelector('.crack-time-text');
	crackTimeText.innerHTML = `Your password would take <strong>${result.crack_times_display.online_throttling_100_per_hour}</strong> to crack.`;

	// Update suggestions
	const suggestionsContainer = document.querySelector('.suggestions');
	const suggestions = result.feedback.suggestions || [];
	const warning = result.feedback.warning;

	if (warning || suggestions.length > 0) {
		let html = '<strong>Suggestions:</strong><ul>';
		if (warning) {
			html += `<li>${warning}</li>`;
		}
		suggestions.forEach(suggestion => {
			html += `<li>${suggestion}</li>`;
		});
		html += '</ul>';

		suggestionsContainer.innerHTML = html;
		suggestionsContainer.classList.add('has-suggestions');
	} else {
		suggestionsContainer.classList.remove('has-suggestions');
	}
}

// Loading state management
function setPasswordMeterLoading(isLoading) {
	const container = document.querySelector('.password-feedback');
	if (isLoading) {
		container.classList.add('loading');
	} else {
		container.classList.remove('loading');
	}
}

// Debounced password strength checker
let debounceTimer;
function debouncedCheckPassword(password) {
	clearTimeout(debounceTimer);

	if (!password) {
		updateStrength({
			score: 0,
			crack_times_display: {
				offline_fast_hashing_1e10_per_second: 'instantly',
			},
			feedback: {
				suggestions: ['Enter a password'],
				warning: null,
			},
		});
		return;
	}

	debounceTimer = setTimeout(async () => {
		const requestId = ++currentRequestId;
		setPasswordMeterLoading(true);

		try {
			const response = await fetch(pwEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ password }),
			});

			// If this isn't the latest request, ignore the result
			if (requestId !== currentRequestId) return;

			if (!response.ok) {
				throw new Error('Failed to check password strength');
			}

			const result = await response.json();
			updateStrength(result);
		} catch (error) {
			console.error('Error checking password strength:', error);
			// Show error state in the meter
			updateStrength({
				score: 0,
				crack_times_display: {
					offline_fast_hashing_1e10_per_second: 'Error',
				},
				feedback: {
					suggestions: ['Try again'],
					warning: 'Failed to check password strength',
				},
			});
		} finally {
			if (requestId === currentRequestId) {
				setPasswordMeterLoading(false);
			}
		}
	}, 500);
}

// Initialize everything when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	// Setup password input listener
	const passwordInput = document.querySelector('#password');
	if (passwordInput) {
		passwordInput.addEventListener('input', e => {
			debouncedCheckPassword(e.target.value);
		});

		// Initialize with empty state
		debouncedCheckPassword('');
	}
});
