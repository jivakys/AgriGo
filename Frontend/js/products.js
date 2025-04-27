// Product Management Functions
document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // Check authentication
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Load products
  async function loadProducts() {
    try {
      const response = await fetch("/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load products");
      }

      const products = await response.json();
      displayProducts(products);
    } catch (error) {
      console.error("Error loading products:", error);
      alert("Failed to load products");
    }
  }

  // Display products in the UI
  function displayProducts(products) {
    const productsContainer = document.getElementById("productsContainer");
    if (!productsContainer) return;

    productsContainer.innerHTML = products
      .map(
        (product) => `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <img src="${
                      product.imageUrl || "images/default-product.jpg"
                    }" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">${product.description}</p>
                        <p class="card-text"><strong>Price:</strong> ₹${
                          product.price
                        }</p>
                        <p class="card-text"><small class="text-muted">Available: ${
                          product.quantity
                        } ${product.unit}</small></p>
                        ${
                          user.role === "consumer"
                            ? `
                            <button class="btn btn-primary" onclick="addToCart('${product._id}')">
                                Add to Cart
                            </button>
                        `
                            : ""
                        }
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  // Add to cart functionality
  window.addToCart = async function (productId) {
    try {
      const response = await fetch("/orders/cart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      alert("Product added to cart successfully!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add product to cart");
    }
  };

  // Initialize product listing
  loadProducts();
});
