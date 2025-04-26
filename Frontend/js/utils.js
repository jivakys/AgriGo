// Utility Functions
const API_BASE_URL = "http://localhost:6666/";

// Check if user is authenticated
function checkAuth() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// Logout function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// Format date
function formatDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

// Show alert message
function showAlert(message, type = "success") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.role = "alert";
  alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

  const container = document.querySelector(".container");
  container.insertBefore(alertDiv, container.firstChild);

  // Auto dismiss after 5 seconds
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// Handle API errors
function handleApiError(error) {
  console.error("API Error:", error);
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    showAlert(error.response.data.message || "An error occurred", "danger");
  } else if (error.request) {
    // The request was made but no response was received
    showAlert("No response from server. Please try again later.", "danger");
  } else {
    // Something happened in setting up the request that triggered an Error
    showAlert("An error occurred. Please try again.", "danger");
  }
}

// Validate form inputs
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;

  const inputs = form.querySelectorAll(
    "input[required], select[required], textarea[required]"
  );
  let isValid = true;

  inputs.forEach((input) => {
    if (!input.value.trim()) {
      isValid = false;
      input.classList.add("is-invalid");
    } else {
      input.classList.remove("is-invalid");
    }
  });

  return isValid;
}

function setupFormValidation(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  const inputs = form.querySelectorAll(
    "input[required], select[required], textarea[required]"
  );

  inputs.forEach((input) => {
    input.addEventListener("input", function () {
      if (this.value.trim()) {
        this.classList.remove("is-invalid");
      }
    });
  });
}

window.utils = {
  checkAuth,
  logout,
  formatDate,
  formatCurrency,
  showAlert,
  handleApiError,
  validateForm,
  setupFormValidation,
  API_BASE_URL,
};
