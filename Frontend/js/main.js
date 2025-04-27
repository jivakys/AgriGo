// Main Page Functions
document.addEventListener("DOMContentLoaded", function () {
  // Initialize carousel
  const heroCarousel = new bootstrap.Carousel(
    document.getElementById("heroCarousel"),
    {
      interval: 5000,
      wrap: true,
    }
  );

  // Load featured products
  loadFeaturedProducts();

  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
});

// Load featured products
async function loadFeaturedProducts() {
  try {
    const response = await fetch(`${utils.API_BASE_URL}/products/featured`);
    if (!response.ok) {
      throw new Error("Failed to load featured products");
    }

    const products = await response.json();
    displayFeaturedProducts(products);
  } catch (error) {
    console.error("Error loading featured products:", error);
    // Don't show error to user as featured products are not critical
  }
}

// Display featured products
function displayFeaturedProducts(products) {
  const container = document.getElementById("featuredProducts");
  if (!container) return;

  container.innerHTML = products
    .map(
      (product) => `
        <div class="col-md-4 mb-4">
            <div class="card h-100">
                <img src="${product.imageUrl || "images/default-product.jpg"}" 
                     class="card-img-top" 
                     alt="${product.name}"
                     style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text">${product.description}</p>
                    <p class="card-text">
                        <strong>Price:</strong> ${utils.formatCurrency(
                          product.price
                        )}
                    </p>
                    <p class="card-text">
                        <small class="text-muted">
                            Available: ${product.quantity} ${product.unit}
                        </small>
                    </p>
                    <a href="products.html" class="btn btn-success">View Details</a>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Handle feature item hover effects
document.querySelectorAll(".feature-item").forEach((item) => {
  item.addEventListener("mouseenter", function () {
    this.style.transform = "translateY(-10px)";
  });

  item.addEventListener("mouseleave", function () {
    this.style.transform = "translateY(0)";
  });
});

// Add scroll-to-top button functionality
window.addEventListener("scroll", function () {
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");
  if (scrollToTopBtn) {
    if (window.pageYOffset > 300) {
      scrollToTopBtn.style.display = "block";
    } else {
      scrollToTopBtn.style.display = "none";
    }
  }
});

// Initialize tooltips
const tooltipTriggerList = [].slice.call(
  document.querySelectorAll('[data-bs-toggle="tooltip"]')
);
tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl);
});

// Add scroll-to-top button to the page
const scrollToTopBtn = document.createElement("button");
scrollToTopBtn.id = "scrollToTopBtn";
scrollToTopBtn.className =
  "btn btn-success rounded-circle position-fixed bottom-0 end-0 m-4";
scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
scrollToTopBtn.style.display = "none";
scrollToTopBtn.onclick = function () {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
document.body.appendChild(scrollToTopBtn);

// Add smooth scroll for navigation links
document.querySelectorAll("a.nav-link").forEach((link) => {
  link.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  });
});
