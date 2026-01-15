// Forgot Password functionality
document.addEventListener("DOMContentLoaded", function () {
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const emailInput = document.getElementById("email");

  // Auto-focus on email input
  emailInput.focus();

  // Handle form submission
  forgotPasswordForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = emailInput.value.trim();

    if (!email) {
      Toast.error("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.error("Please enter a valid email address");
      return;
    }

    try {
      // Disable form during request
      const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending...';

      const response = await fetch(
        "http://localhost:3000/auth/user/forget-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Store email for reset password page
        localStorage.setItem("resetEmail", email);

        Toast.success("Reset code sent successfully! Redirecting...");

        // Redirect to reset password page
        setTimeout(() => {
          window.location.href = `reset-password.html?email=${encodeURIComponent(email)}`;
        }, 2000);
      } else {
        Toast.error(data.error || "Failed to send reset code. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      Toast.error("An error occurred while sending the reset code. Please try again.");
    } finally {
      // Re-enable form
      const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Send Reset Code';
    }
  });
});
