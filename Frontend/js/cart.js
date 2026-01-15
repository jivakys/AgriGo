// Simple cart + checkout
document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = 'login.html'; return; }

  const cartItemsEl = document.getElementById('cartItems');
  const subtotalEl = document.getElementById('subtotal');
  const placeOrderBtn = document.getElementById('placeOrderBtn');

  async function loadCart() {
    const res = await fetch('/orders/cart', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { cartItemsEl.innerHTML = '<div class="alert alert-info">Your cart is empty.</div>'; subtotalEl.textContent = '0'; return; }
    const data = await res.json();
    renderCart(data.items || []);
  }

  function renderCart(items) {
    if (!items.length) {
      cartItemsEl.innerHTML = '<div class="alert alert-info">Your cart is empty.</div>';
      subtotalEl.textContent = '0';
      return;
    }
    let total = 0;
    cartItemsEl.innerHTML = items.map(item => {
      const line = item.quantity * item.product.price;
      total += line;
      return `
        <div class="card mb-2">
          <div class="card-body d-flex justify-content-between align-items-center">
            <div>
              <div class="fw-semibold">${item.product.name}</div>
              <div class="text-muted small">₹${item.product.price} • ${item.product.unit}</div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-outline-secondary btn-sm" data-dec="${item.product._id}">-</button>
              <span>${item.quantity}</span>
              <button class="btn btn-outline-secondary btn-sm" data-inc="${item.product._id}">+</button>
              <span class="ms-3">₹${line}</span>
              <button class="btn btn-outline-danger btn-sm ms-3" data-remove="${item.product._id}"><i class="fas fa-trash"></i></button>
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
    const res = await fetch('/orders/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, delta })
    });
    await loadCart();
  }

  async function removeItem(productId) {
    await fetch(`/orders/cart/${productId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }});
    await loadCart();
  }

  placeOrderBtn.addEventListener('click', async function() {
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

    const cartRes = await fetch('/orders/cart', { headers: { Authorization: `Bearer ${token}` } });
    const cart = await cartRes.json();
    if (!cart.items || !cart.items.length) { Toast.success('Cart is empty'); return; }

    const products = cart.items.map(it => ({ productId: it.product._id, quantity: it.quantity }));
    const body = {
      products,
      deliveryAddress: { street, city, pincode },
      paymentMethod,
      deliverySlot: slotDate ? { date: slotDate, window: slotWindow } : null
    };

    const res = await fetch('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (res.ok) {
      Toast.success('Order placed successfully');
      window.location.href = 'orders.html';
    } else {
      Toast.error(data.message || 'Failed to place order');
    }
  });

  loadCart();
});


