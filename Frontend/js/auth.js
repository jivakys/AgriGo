// Handle role selection in signup form
document.addEventListener("DOMContentLoaded", function () {
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

  // Handle login form submission
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    // Handle login method toggle
    const passwordLogin = document.getElementById("passwordLogin");
    const otpLogin = document.getElementById("otpLogin");
    const passwordFields = document.getElementById("passwordFields");
    const otpFields = document.getElementById("otpFields");
    const loginBtn = document.getElementById("loginBtn");
    const loginBtnText = document.getElementById("loginBtnText");
    const loginBtnIcon = document.getElementById("loginBtnIcon");

    // Toggle between password and OTP login
    function toggleLoginMethod() {
      if (passwordLogin.checked) {
        passwordFields.classList.remove("d-none");
        otpFields.classList.add("d-none");
        document.getElementById("password").required = true;
        loginBtnText.textContent = "Login";
        loginBtnIcon.innerHTML = '<i class="fas fa-sign-in-alt"></i>';
      } else {
        passwordFields.classList.add("d-none");
        otpFields.classList.remove("d-none");
        document.getElementById("password").required = false;
        loginBtnText.textContent = "Send OTP";
        loginBtnIcon.innerHTML = '<i class="fas fa-envelope"></i>';
      }
    }

    passwordLogin.addEventListener("change", toggleLoginMethod);
    otpLogin.addEventListener("change", toggleLoginMethod);

    // Initialize on page load
    toggleLoginMethod();

    // Handle form submission
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const isPasswordLogin = passwordLogin.checked;

      if (!email) {
        alert("Please enter your email address");
        return;
      }

      try {
        if (isPasswordLogin) {
          // Password login
          const password = document.getElementById("password").value;

          if (!password) {
            alert("Please enter your password");
            return;
          }

          const response = await fetch(
            "http://localhost:3000/auth/user/login-password",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email, password }),
            }
          );

          const data = await response.json();

          if (response.ok) {
            // Store token and user info
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Redirect based on role
            if (data.user.role === "farmer") {
              window.location.href = "farmer-dashboard.html";
            } else {
              window.location.href = "products.html";
            }
          } else {
            showAlert("danger", data.error || "Login failed");
          }
        } else {
          // OTP login
          const response = await fetch(
            "http://localhost:3000/auth/user/login-otp",
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
            // Store email for OTP verification page
            localStorage.setItem("otpEmail", email);

            showAlert(
              "success",
              "OTP sent successfully! Redirecting to verification page..."
            );

            // Redirect to OTP verification page
            setTimeout(() => {
              window.location.href = `otp-verification.html?email=${encodeURIComponent(
                email
              )}`;
            }, 1500);
          } else {
            showAlert("danger", data.error || "Failed to send OTP");
          }
        }
      } catch (error) {
        console.error("Error:", error);
        showAlert("danger", "An error occurred during login");
      }
    });

    // Show alert messages
    function showAlert(type, message) {
      // Remove existing alerts
      const existingAlert = document.querySelector(".alert");
      if (existingAlert && !existingAlert.classList.contains("alert-info")) {
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
      loginForm.parentNode.insertBefore(alertDiv, loginForm);
    }
  }

  // Handle signup form submission
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Get form values
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      // Validate password match
      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      // Validate password strength
      if (password.length < 6) {
        alert("Password must be at least 6 characters long!");
        return;
      }

      // Prepare form data
      const formData = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        password: password,
        role: document.getElementById("role").value,
      };

      // Add farmer-specific data if role is farmer
      if (formData.role === "farmer") {
        formData.farmInfo = {
          farmName: document.getElementById("farmName").value,
          farmLocation: document.getElementById("farmLocation").value,
        };
      }

      try {
        console.log("Sending signup request with data:", formData);

        const response = await fetch(
          "http://localhost:3000/auth/user/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        const data = await response.json();
        console.log("Signup response:", data);

        if (response.ok) {
          alert("Registration successful! Please login.");
          window.location.href = "login.html";
        } else {
          alert(data.message || "Registration failed");
        }
      } catch (error) {
        console.error("Signup error:", error);
        alert("An error occurred during registration. Please try again.");
      }
    });
  }
});
