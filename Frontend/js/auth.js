// Handle role selection in signup form
document.addEventListener("DOMContentLoaded", function () {
  // --- Slideshow Logic ---
  const slides = document.querySelectorAll(".auth-slide");
  const dots = document.querySelectorAll(".dot");
  let currentSlide = 0;

  if (slides.length > 0) {
    function showSlide(index) {
      slides.forEach((slide) => slide.classList.remove("active"));
      dots.forEach((dot) => dot.classList.remove("active"));

      slides[index].classList.add("active");
      dots[index].classList.add("active");
    }

    function nextSlide() {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    }

    // Auto advance every 4 seconds
    setInterval(nextSlide, 4000);

    // Initial dot click support
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        currentSlide = index;
        showSlide(currentSlide);
      });
    });
  }
  // --- Role Selection Logic ---
  const roleSelect = document.getElementById("role");
  const farmerFields = document.getElementById("farmerFields");

  if (roleSelect && farmerFields) {
    roleSelect.addEventListener("change", function () {
      if (this.value === "farmer") {
        farmerFields.classList.remove("d-none");
        document.getElementById("farmName").required = true;
        document.getElementById("farmLocation").required = true;
      } else {
        farmerFields.classList.add("d-none");
        document.getElementById("farmName").required = false;
        document.getElementById("farmLocation").required = false;
      }
    });
  }

  // --- Login Form Logic ---
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    const passwordToggle = document.getElementById("passwordToggle");
    const otpToggle = document.getElementById("otpToggle");
    const passwordFields = document.getElementById("passwordFields");
    const otpFields = document.getElementById("otpFields");
    const loginBtnText = document.getElementById("loginBtnText");
    const passwordInput = document.getElementById("password");

    let isOtpMode = false;

    if (passwordToggle && otpToggle) {
      passwordToggle.addEventListener("click", () => {
        isOtpMode = false;
        passwordToggle.classList.add("active");
        otpToggle.classList.remove("active");
        passwordFields.classList.remove("d-none");
        otpFields.classList.add("d-none");
        passwordInput.required = true;
        loginBtnText.textContent = "Sign in";
      });

      otpToggle.addEventListener("click", () => {
        isOtpMode = true;
        otpToggle.classList.add("active");
        passwordToggle.classList.remove("active");
        passwordFields.classList.add("d-none");
        otpFields.classList.remove("d-none");
        passwordInput.required = false;
        loginBtnText.textContent = "Send OTP Code";
      });
    }

    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("email").value;

      if (isOtpMode) {
        // OTP Login Flow
        try {
          const response = await fetch("http://localhost:3000/auth/user/login-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();
          if (response.ok) {
            localStorage.setItem("otpEmail", email);
            Toast.success("OTP sent! Redirecting...");
            setTimeout(() => {
              window.location.href = `otp-verification.html?email=${encodeURIComponent(email)}`;
            }, 1000);
          } else {
            Toast.error(data.error || "Failed to send OTP");
          }
        } catch (error) {
          Toast.error("An error occurred. Please try again.");
        }
      } else {
        // Password Login Flow
        const password = passwordInput.value;
        if (!password) {
          Toast.error("Please enter your password");
          return;
        }

        try {
          const response = await fetch("http://localhost:3000/auth/user/login-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();
          if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            if (data.user.role === "admin") {
              window.location.href = "admin-dashboard.html";
            } else {
              window.location.href = data.user.role === "farmer" ? "seller-info.html" : "buyer-info.html";
            }
          } else {
            Toast.error(data.error || "Login failed");
          }
        } catch (error) {
          Toast.error("An error occurred. Please try again.");
        }
      }
    });
  }

  // --- Signup Form Logic ---
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (password !== confirmPassword) {
        Toast.info("Passwords do not match!");
        return;
      }

      if (password.length < 6) {
        Toast.info("Password must be at least 6 characters long!");
        return;
      }

      const formData = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        password: password,
        role: document.getElementById("role").value,
      };

      if (formData.role === "farmer") {
        formData.farmInfo = {
          farmName: document.getElementById("farmName").value,
          farmLocation: document.getElementById("farmLocation").value,
        };
      }

      try {
        const response = await fetch("http://localhost:3000/auth/user/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();
        if (response.ok) {
          Toast.success("Registration successful! Please login.");
          window.location.href = "login.html";
        } else {
          Toast.error(data.message || "Registration failed");
        }
      } catch (error) {
        Toast.error("An error occurred during registration.");
      }
    });
  }
});
