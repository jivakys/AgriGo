// Reset Password functionality
document.addEventListener("DOMContentLoaded", function () {
  const resetPasswordForm = document.getElementById("resetPasswordForm");
  const emailInput = document.getElementById("email");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const toggleNewPasswordBtn = document.getElementById("toggleNewPassword");
  const toggleConfirmPasswordBtn = document.getElementById("toggleConfirmPassword");
  const otpSection = document.getElementById("otpSection");
  const passwordSection = document.getElementById("passwordSection");
  const otpInputs = Array.from(document.querySelectorAll(".otp-input"));
  const verifyOtpBtn = document.getElementById("verifyOtpBtn");
  const resendOtpBtn = document.getElementById("resendOtpBtn");
  const countdownSpan = document.getElementById("countdown");
  const timerText = document.getElementById("timerText");

  // Get email from URL parameters or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email') || localStorage.getItem('resetEmail');

  if (!email) {
    alert('Email not found. Please start the password reset process again.');
    window.location.href = 'forgot-password.html';
    return;
  }

  // Display email
  emailInput.value = email;

  // OTP inputs behavior
  if (otpInputs.length) {
    otpInputs[0].focus();
  }
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '');
      if (this.value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && !this.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
  });

  // Countdown + resend
  let timeLeft = 60;
  let timerId;
  function startCountdown() {
    clearInterval(timerId);
    timeLeft = 60;
    resendOtpBtn.disabled = true;
    timerText.innerHTML = 'Resend code in <span id="countdown">' + timeLeft + '</span> sec';
    timerId = setInterval(() => {
      timeLeft--;
      const span = document.getElementById('countdown');
      if (span) span.textContent = String(Math.max(timeLeft, 0));
      if (timeLeft <= 0) {
        clearInterval(timerId);
        resendOtpBtn.disabled = false;
        timerText.textContent = 'You can now resend code';
      }
    }, 1000);
  }
  startCountdown();

  resendOtpBtn.addEventListener('click', async function() {
    try {
      resendOtpBtn.disabled = true;
      const res = await fetch('http://localhost:3000/auth/user/forget-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', 'OTP resent to your email');
        otpInputs.forEach(i => i.value = '');
        if (otpInputs.length) otpInputs[0].focus();
        startCountdown();
      } else {
        showAlert('danger', data.error || 'Failed to resend OTP');
        resendOtpBtn.disabled = false;
      }
    } catch (err) {
      showAlert('danger', 'Network error while resending OTP');
      resendOtpBtn.disabled = false;
    }
  });

  function getOtpValue() {
    return otpInputs.map(i => i.value).join('');
  }

  verifyOtpBtn.addEventListener('click', async function() {
    const otp = getOtpValue();
    if (otp.length !== 6) {
      showAlert('warning', 'Enter the 6-digit code');
      return;
    }
    try {
      verifyOtpBtn.disabled = true;
      verifyOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Verifying...';
      const response = await fetch('http://localhost:3000/auth/user/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();
      if (response.ok) {
        showAlert('success', 'Code verified. Create your new password.');
        otpSection.classList.add('d-none');
        passwordSection.classList.remove('d-none');
        newPasswordInput.focus();
      } else {
        showAlert('danger', data.error || 'Invalid code');
        otpInputs.forEach(i => i.value = '');
        if (otpInputs.length) otpInputs[0].focus();
      }
    } catch (err) {
      showAlert('danger', 'Verification failed. Try again.');
    } finally {
      verifyOtpBtn.disabled = false;
      verifyOtpBtn.innerHTML = '<i class="fas fa-check me-2"></i>Verify Code';
    }
  });

  // Toggle password visibility for new password
  toggleNewPasswordBtn.addEventListener('click', function() {
    togglePasswordVisibility(newPasswordInput, this);
  });

  // Toggle password visibility for confirm password
  toggleConfirmPasswordBtn.addEventListener('click', function() {
    togglePasswordVisibility(confirmPasswordInput, this);
  });

  // Real-time password validation
  newPasswordInput.addEventListener('input', validatePasswords);
  confirmPasswordInput.addEventListener('input', validatePasswords);

  // Handle form submission
  resetPasswordForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const otp = getOtpValue();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    // Validation
    if (otp.length !== 6) {
      showAlert('warning', 'Please verify your code first');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('warning', 'Password must be at least 6 characters long');
      newPasswordInput.focus();
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('warning', 'Passwords do not match');
      confirmPasswordInput.focus();
      return;
    }

    try {
      // Disable form during request
      const submitBtn = resetPasswordForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';

      const response = await fetch(
        "http://localhost:3000/auth/user/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            email, 
            otp, 
            newPassword 
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Clean up stored email
        localStorage.removeItem('resetEmail');
        
        showAlert('success', 'Password reset successfully! Redirecting to login page...');
        
        // Redirect to login page
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      } else {
        showAlert('danger', data.error || 'Failed to reset password. Please try again.');
        if (data.error && (data.error.includes('Invalid') || data.error.includes('expired'))) {
          passwordSection.classList.add('d-none');
          otpSection.classList.remove('d-none');
          otpInputs.forEach(i => i.value = '');
          if (otpInputs.length) otpInputs[0].focus();
        }
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert('danger', 'An error occurred while resetting your password. Please try again.');
    } finally {
      // Re-enable form
      const submitBtn = resetPasswordForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class=\"fas fa-check me-2\"></i>Create new password';
    }
  });

  // Toggle password visibility
  function togglePasswordVisibility(input, button) {
    const icon = button.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }

  // Validate passwords in real-time
  function validatePasswords() {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Remove existing validation classes
    newPasswordInput.classList.remove('is-valid', 'is-invalid');
    confirmPasswordInput.classList.remove('is-valid', 'is-invalid');
    
    if (newPassword.length >= 6) {
      newPasswordInput.classList.add('is-valid');
    } else if (newPassword.length > 0) {
      newPasswordInput.classList.add('is-invalid');
    }
    
    if (confirmPassword.length > 0) {
      if (newPassword === confirmPassword && newPassword.length >= 6) {
        confirmPasswordInput.classList.add('is-valid');
      } else {
        confirmPasswordInput.classList.add('is-invalid');
      }
    }
  }

  // Show alert messages
  function showAlert(type, message) {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
      existingAlert.remove();
    }

    // Create new alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Insert alert before the form
    resetPasswordForm.parentNode.insertBefore(alertDiv, resetPasswordForm);
  }
});
