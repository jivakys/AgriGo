// Reset Password functionality
document.addEventListener("DOMContentLoaded", function () {
  const resetPasswordForm = document.getElementById("resetPasswordForm");
  const emailInput = document.getElementById("email");
  const otpInput = document.getElementById("otp");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const toggleNewPasswordBtn = document.getElementById("toggleNewPassword");
  const toggleConfirmPasswordBtn = document.getElementById("toggleConfirmPassword");

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

  // Auto-focus on OTP input
  otpInput.focus();

  // Handle OTP input - only allow numbers
  otpInput.addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '');
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

    const otp = otpInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    // Validation
    if (otp.length !== 6) {
      showAlert('warning', 'Please enter a valid 6-digit verification code');
      otpInput.focus();
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
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Resetting...';

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
        
        // Clear OTP input on error
        if (data.error && data.error.includes('Invalid') || data.error.includes('expired')) {
          otpInput.value = '';
          otpInput.focus();
        }
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert('danger', 'An error occurred while resetting your password. Please try again.');
    } finally {
      // Re-enable form
      const submitBtn = resetPasswordForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Reset Password';
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
