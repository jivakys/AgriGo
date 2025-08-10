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
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch(
          "https://agrigo-backend.onrender.com/auth/user/login",
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
          alert(data.message || "Login failed");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred during login");
      }
    });
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
          "https://agrigo-backend.onrender.com/auth/user/register",
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
