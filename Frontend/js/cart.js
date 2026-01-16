document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = 'login.html'; return; }

  const cartItemsEl = document.getElementById('cartItems');
  const subtotalEl = document.getElementById('subtotal');
  const grandTotalEl = document.getElementById('grandTotal');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const placeOrderBtn = document.getElementById('placeOrderBtn');

  // Helper to get full URL
  const getUrl = (path) => `${utils.API_BASE_URL}${path}`;

  let currentCartItems = [];

  async function loadCart() {
    try {
      const res = await fetch(getUrl('orders/cart'), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        cartItemsEl.innerHTML = '<div class="alert alert-info">Your cart is empty.</div>';
        subtotalEl.textContent = '0';
        grandTotalEl.textContent = '0';
        return;
      }
      const data = await res.json();
      currentCartItems = data.items || [];
      renderCart(currentCartItems);
    } catch (e) {
      console.error(e);
      cartItemsEl.innerHTML = '<div class="text-danger">Failed to load cart. Check console for details.</div>';
    }
  }

  function renderCart(items) {
    if (!items.length) {
      cartItemsEl.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <h4>Your cart is empty</h4>
                    <p class="text-muted">Browse our products and add something fresh!</p>
                    <a href="products.html" class="btn btn-success rounded-pill px-4 mt-2">Go Shopping</a>
                </div>`;
      subtotalEl.textContent = '0';
      grandTotalEl.textContent = '0';
      if (placeOrderBtn) placeOrderBtn.disabled = true;
      return;
    }

    if (placeOrderBtn) placeOrderBtn.disabled = false;

    let total = 0;
    cartItemsEl.innerHTML = items.map(item => {
      const line = item.quantity * item.product.price;
      total += line;

      const maxStock = item.product.quantity;
      const isMaxed = item.quantity >= maxStock;

      // Mock original price (15% more)
      const originalPrice = Math.round(item.product.price * 1.15);

      return `
                <div class="cart-item-card" data-id="${item.product._id}">
                    <div class="item-main-content">
                        <input type="checkbox" class="item-checkbox item-select" data-id="${item.product._id}">
                        
                        <div class="item-image-container">
                            <img src="${item.product.images?.[0] || item.product.imageUrl || 'https://placehold.co/100'}" alt="${item.product.name}">
                        </div>

                        <div class="item-details">
                            <div class="farmer-info">
                                <div class="farmer-logo">
                                    <i class="fas fa-store"></i>
                                </div>
                                <span class="farmer-name">${item.product.farmerName || 'Local Farm'}</span>
                            </div>
                            
                            <span class="category-tag">${item.product.category || 'Other'}</span>
                            <h4 class="product-name">${item.product.name}</h4>
                            <p class="product-specs">Type: Organic &nbsp;|&nbsp; Unit: ${item.product.unit}</p>

                            <div class="item-actions">
                                <i class="fas fa-trash-alt" onclick="removeItem('${item.product._id}')"></i>
                                <i class="fas fa-heart"></i>
                                <i class="fas fa-share-alt"></i>
                            </div>
                        </div>

                        <div class="price-section">
                            <div class="text-end">
                                <span class="original-price">₹${originalPrice}</span>
                                <span class="current-price">₹${item.product.price}</span>
                            </div>

                            <div class="qty-control">
                                <button class="qty-btn" onclick="updateQty('${item.product._id}', -1)">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="qty-value">${item.quantity}</span>
                                <button class="qty-btn" onclick="updateQty('${item.product._id}', 1)" ${isMaxed ? 'disabled' : ''}>
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;
    }).join('');

    subtotalEl.textContent = String(total);
    grandTotalEl.textContent = String(total);
  }

  window.updateQty = async function (productId, delta) {
    try {
      const res = await fetch(getUrl('orders/cart'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, delta })
      });
      if (res.ok) {
        await loadCart();
      } else {
        const err = await res.json();
        Toast.error(err.message || "Failed to update quantity");
      }
    } catch (e) {
      Toast.error("Connection error");
    }
  };

  window.removeItem = async function (productId) {
    if (!confirm("Remove this item from cart?")) return;
    try {
      await fetch(getUrl(`orders/cart/${productId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      Toast.info("Item removed");
      await loadCart();
    } catch (e) {
      Toast.error("Failed to remove item");
    }
  };

  window.toggleSelectAll = function () {
    const checkboxes = document.querySelectorAll('.item-select');
    checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
  };

  window.deleteSelected = async function () {
    const selected = Array.from(document.querySelectorAll('.item-select:checked')).map(cb => cb.getAttribute('data-id'));
    if (selected.length === 0) {
      Toast.info("Please select items to delete");
      return;
    }

    if (!confirm(`Remove ${selected.length} items?`)) return;

    try {
      for (const id of selected) {
        await fetch(getUrl(`orders/cart/${id}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      Toast.success("Selected items removed");
      await loadCart();
    } catch (e) {
      Toast.error("Error removing some items");
    }
  };

  placeOrderBtn.addEventListener('click', async function () {
    const street = document.getElementById('addrStreet').value.trim();
    const city = document.getElementById('addrCity').value.trim();
    const pincode = document.getElementById('addrPincode').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    const slotDate = document.getElementById('slotDate').value;
    const slotWindow = document.getElementById('slotWindow').value;

    if (!street || !city || !pincode) {
      Toast.error('Please enter delivery address.');
      return;
    }

    // Show loading state
    const originalBtnText = placeOrderBtn.innerHTML;
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';

    try {
      // Use currentCartItems which is already loaded
      if (!currentCartItems || !currentCartItems.length) {
        Toast.error('Cart is empty');
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = originalBtnText;
        return;
      }

      const products = currentCartItems.map(it => ({ productId: it.product._id, quantity: it.quantity }));
      const body = {
        products,
        deliveryAddress: { street, city, pincode },
        paymentMethod,
        deliverySlot: slotDate ? { date: slotDate, window: slotWindow } : null
      };

      const res = await fetch(getUrl('orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        Toast.success('Order placed successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = 'orders.html';
        }, 1500);
      } else {
        Toast.error(data.message || 'Failed to place order');
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = originalBtnText;
      }
    } catch (error) {
      console.error(error);
      Toast.error("An error occurred while placing the order.");
      placeOrderBtn.disabled = false;
      placeOrderBtn.innerHTML = originalBtnText;
    }
  });

  loadCart();
});
