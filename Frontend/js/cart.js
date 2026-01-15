// Simple cart + checkout
document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = 'login.html'; return; }

  const cartItemsEl = document.getElementById('cartItems');
  const subtotalEl = document.getElementById('subtotal');
  const placeOrderBtn = document.getElementById('placeOrderBtn');

  // Helper to get full URL
  const getUrl = (path) => `${utils.API_BASE_URL}${path}`;

  async function loadCart() {
    try {
      const res = await fetch(getUrl('orders/cart'), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        cartItemsEl.innerHTML = '<div class="alert alert-info">Your cart is empty.</div>';
        subtotalEl.textContent = '0';
        return;
      }
      const data = await res.json();
      renderCart(data.items || []);
    } catch (e) {
      console.error(e);
      cartItemsEl.innerHTML = '<div class="text-danger">Failed to load cart.</div>';
    }
  }

  function renderCart(items) {
    if (!items.length) {
      cartItemsEl.innerHTML = '<div class="alert alert-info">Your cart is empty.</div>';
      subtotalEl.textContent = '0';
      if (placeOrderBtn) placeOrderBtn.disabled = true;
      return;
    }

    if (placeOrderBtn) placeOrderBtn.disabled = false;

    let total = 0;
    cartItemsEl.innerHTML = items.map(item => {
      const line = item.quantity * item.product.price;
      total += line;

      const maxStock = item.product.quantity;
      // Note: product.quantity is the AVAILABLE stock in DB. 
      // If user has 5 in cart and db has 5, user effectively took all.
      // So max capable of having is actually `item.product.quantity` (assuming the api returns current db stock).
      // Wait, if I have 5 in cart, does backend return 5 or 0? 
      // Typically backend returns current available stock. 
      // So if I have 5 in cart, and stock is 10, total available to me is 10 (5 already taken? No, separate logic usually).
      // Let's assume `item.product.quantity` is the REMAINING stock available for others.
      // Then max I can have is `item.quantity + item.product.quantity`.
      // BUT for simplicity, let's assume `item.product.quantity` is the TOTAL stock including what's in cart if it wasn't reserved yet.
      // Actually, looking at backend: it decrements ONLY on order creation.
      // So `product.quantity` IS the current available stock.
      // So I can increase cart qty up to `product.quantity`.

      const isMaxed = item.quantity >= maxStock;

      return `
        <div class="card mb-2">
          <div class="card-body d-flex justify-content-between align-items-center">
            <div>
              <div class="fw-semibold">${item.product.name}</div>
              <div class="text-muted small">₹${item.product.price} / ${item.product.unit}</div>
              <div class="text-muted small">Available: ${item.product.quantity} ${item.product.unit}</div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-outline-secondary btn-sm" data-dec="${item.product._id}">
                <i class="fas fa-minus"></i>
              </button>
              <span class="fw-bold" style="min-width: 30px; text-align: center;">${item.quantity}</span>
              <button class="btn btn-outline-secondary btn-sm" data-inc="${item.product._id}" ${isMaxed ? 'disabled' : ''}>
                <i class="fas fa-plus"></i>
              </button>
              <span class="ms-3 w-25 text-end">₹${line}</span>
              <button class="btn btn-outline-danger btn-sm ms-3" data-remove="${item.product._id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>`;
    }).join('');
    subtotalEl.textContent = String(total);

    cartItemsEl.querySelectorAll('[data-inc]').forEach(btn => btn.addEventListener('click', () => updateQty(btn.getAttribute('data-inc'), 1)));
    cartItemsEl.querySelectorAll('[data-dec]').forEach(btn => btn.addEventListener('click', () => updateQty(btn.getAttribute('data-dec'), -1)));
    cartItemsEl.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => removeItem(btn.getAttribute('data-remove'))));
  }

  async function updateQty(productId, delta) {
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
  }

  async function removeItem(productId) {
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
  }

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
      // Fetch latest cart state to ensure validity
      const cartRes = await fetch(getUrl('orders/cart'), { headers: { Authorization: `Bearer ${token}` } });
      const cart = await cartRes.json();

      if (!cart.items || !cart.items.length) {
        Toast.error('Cart is empty');
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = originalBtnText;
        return;
      }

      const products = cart.items.map(it => ({ productId: it.product._id, quantity: it.quantity }));
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

        // Clear cart on backend (Frontend workaround: clean visually or rely on manual clear endpoints if API doesn't auto-clear)
        // Since the provided Backend API doesn't seem to have a "clear cart" endpoint, 
        // and "Create Order" doesn't explicitly clear the in-memory cart map in the code I saw (Wait, let me verify),
        // I should check if backend clears cart.
        // The backend code for POST /orders (Step 211) does NOT seem to access `userIdToCart` to clear it.
        // This is a bug in the backend logic provided. The cart remains full after order.
        // I should fix this in the Backend too, but first let's handle the UI.

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


