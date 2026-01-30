// OTP Verification functionality
document.addEventListener("DOMContentLoaded", function () {
  const otpForm = document.getElementById("otpForm");
  const otpInput = document.getElementById("otp");
  const resendBtn = document.getElementById("resendOtp");
  const userEmailSpan = document.getElementById("userEmail");
  const countdownSpan = document.getElementById("countdown");
  const timerText = document.getElementById("timerText");

  let countdownTimer;
  let timeLeft = 300; // 5 minutes in seconds

  // Get email from URL parameters or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email") || localStorage.getItem("otpEmail");

  if (!email) {
    Toast.error("Email not found. Please login again.");
    window.location.href = "login.html";
    return;
  }

  // Display email
  userEmailSpan.textContent = email;

  // Start countdown timer
  startCountdown();

  // Auto-focus on OTP input
  otpInput.focus();

  // Handle OTP input - only allow numbers
  otpInput.addEventListener("input", function (e) {
    this.value = this.value.replace(/[^0-9]/g, "");
  });

  // Handle form submission
  otpForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const otp = otpInput.value.trim();

    if (otp.length !== 6) {
      Toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3000/auth/user/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Store token and user info
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.removeItem("otpEmail"); // Clean up

        // Show success message
        showAlert("success", "OTP verified successfully! Logging you in...");

        // Redirect based on role
        setTimeout(() => {
          if (data.user.role === "admin") {
            window.location.href = "admin-dashboard.html";
          } else if (data.user.role === "farmer") {
            window.location.href = "seller-info.html";
          } else {
            window.location.href = "products.html";
          }
        }, 1500);
      } else {
        showAlert("danger", data.error || "Invalid OTP. Please try again.");
        otpInput.value = "";
        otpInput.focus();
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert(
        "danger",
        "An error occurred during verification. Please try again."
      );
    }
  });

  // Handle resend OTP
  resendBtn.addEventListener("click", async function () {
    if (timeLeft > 0) {
      showAlert(
        "warning",
        `Please wait ${Math.floor(timeLeft / 60)}:${(timeLeft % 60)
          .toString()
          .padStart(2, "0")} before resending.`
      );
      return;
    }

    try {
      const response = await fetch(
        "https://agrigo-backend.onrender.com/auth/user/login-otp",
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
        showAlert("success", "OTP sent successfully! Check your email.");
        otpInput.value = "";
        otpInput.focus();

        // Reset timer
        timeLeft = 300;
        startCountdown();
      } else {
        showAlert(
          "danger",
          data.error || "Failed to resend OTP. Please try again."
        );
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert(
        "danger",
        "An error occurred while resending OTP. Please try again."
      );
    }
  });

  // Countdown timer function
  function startCountdown() {
    countdownTimer = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      countdownSpan.textContent = `${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;

      if (timeLeft <= 0) {
        clearInterval(countdownTimer);
        timerText.innerHTML =
          '<small class="text-success">You can now resend OTP</small>';
        resendBtn.disabled = false;
      } else {
        timeLeft--;
        resendBtn.disabled = true;
      }
    }, 1000);
  }

  // Show alert messages
  function showAlert(type, message) {
    // Remove existing alerts
    const existingAlert = document.querySelector(".alert");
    if (existingAlert) {
      existingAlert.remove();
    }

    // Create new alert
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Insert alert before the form
    otpForm.parentNode.insertBefore(alertDiv, otpForm);
  }

  // Clean up timer when page is unloaded
  window.addEventListener("beforeunload", function () {
    if (countdownTimer) {
      clearInterval(countdownTimer);
    }
  });
});
