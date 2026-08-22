/**
 * AM SPORT — Cart Management System
 * Complete shopping cart with localStorage persistence
 * Features: Add/remove items, quantity control, WhatsApp checkout
 */

const CART_STORAGE_KEY = 'cart';
const WHATSAPP_PHONE = '201559848849';

class CartManager {
  constructor() {
    this.items = this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('[Cart] Storage load error:', e);
      return [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
      this.updateBadge();
    } catch (e) {
      console.error('[Cart] Storage save error:', e);
    }
  }

  addItem(product, size, color, quantity = 1, colorLabel = null) {
    if (!product || !size || !color) {
      console.warn('[Cart] Missing required fields:', { product, size, color });
      return false;
    }

    const cartId = `${product._id}-${size}-${color}`;
    const existing = this.items.find(item => item.cartId === cartId);

    if (existing) {
      existing.quantity += quantity;
      existing.lineTotal = existing.price * existing.quantity;
    } else {
      this.items.push({
        cartId,
        productId: product._id,
        name: product.name,
        name_ar: product.name_ar || product.name,
        price: product.price,
        original_price: product.original_price,
        image: product.image,
        size,
        color,
        colorLabel: colorLabel || color, // الاسم العربي المعروض للعميل
        quantity,
        lineTotal: product.price * quantity,
      });
    }

    this.saveToStorage();
    return true;
  }

  removeItem(cartId) {
    const idx = this.items.findIndex(item => item.cartId === cartId);
    if (idx !== -1) {
      this.items.splice(idx, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  updateQuantity(cartId, quantity) {
    const item = this.items.find(item => item.cartId === cartId);
    if (item) {
      item.quantity = Math.max(1, quantity);
      item.lineTotal = item.price * item.quantity;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getCartTotal() {
    return this.items.reduce((sum, item) => sum + item.lineTotal, 0);
  }

  getCartCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getShipping() {
    return 0;
  }

  getGrandTotal() {
    return this.getCartTotal() + this.getShipping();
  }

  clear() {
    this.items = [];
    this.saveToStorage();
  }

  updateBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
      const count = this.getCartCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }
}

// ─────────────────────────────────────────────────────
// GLOBAL INSTANCE
// ─────────────────────────────────────────────────────
const cart = new CartManager();

// ─────────────────────────────────────────────────────
// INIT ON PAGE LOAD
// ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  cart.updateBadge();

  if (document.getElementById('addToCartBtn')) {
    setupProductDetailsPage();
  }

  if (document.getElementById('cartItemsContainer')) {
    renderCartPage();
  }
});

// ─────────────────────────────────────────────────────
// PRODUCT DETAILS PAGE
// ─────────────────────────────────────────────────────
function setupProductDetailsPage() {
  const addBtn = document.getElementById('addToCartBtn');
  if (!addBtn) return;

  addBtn.addEventListener('click', () => {
    const productId = addBtn.dataset.productId;
    const sizeSelect = document.getElementById('sizeSelect');
    const colorSelect = document.getElementById('colorSelect');

    if (!sizeSelect?.value || !colorSelect?.value) {
      showToast('يرجى اختيار الحجم واللون', 'error');
      return;
    }

    const size = sizeSelect.value;
    const color = colorSelect.value;

    api.getAllProducts().then(products => {
      const product = products.find(p => p._id === productId);
      if (product && cart.addItem(product, size, color)) {
        showToast('تم الإضافة ✓', 'success');
      } else {
        showToast('خطأ في إضافة المنتج', 'error');
      }
    }).catch(err => {
      console.error('[Cart] Error loading product:', err);
      showToast('خطأ في الاتصال', 'error');
    });
  });
}

// ─────────────────────────────────────────────────────
// CART PAGE RENDERING
// ─────────────────────────────────────────────────────
function renderCartPage() {
  const container = document.getElementById('cartItemsContainer');
  if (!container) return;

  if (cart.items.length === 0) {
    renderEmptyCart();
    return;
  }

  const html = cart.items.map(item => {
    const imgSrc = resolveImageUrl(item.image);
    const lineTotal = item.lineTotal.toLocaleString('ar-EG');

    return `
      <div class="cart-item" data-cart-id="${item.cartId}">
        <img src="${imgSrc}" class="cart-item-img" alt="${item.name}" loading="lazy"
             onerror="this.style.opacity=0.3">

        <div class="cart-item-body">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-meta">
            <span>الحجم: ${item.size}</span>
            <span class="color-dot" style="background: ${getColorHex(item.color)};"></span>
            <span>${item.colorLabel || item.color}</span>
          </div>
          <div class="qty-ctrl">
            <button onclick="decreaseQty('${item.cartId}')" aria-label="تقليل">−</button>
            <div class="qty-num">${item.quantity}</div>
            <button onclick="increaseQty('${item.cartId}')" aria-label="زيادة">+</button>
          </div>
        </div>

        <div class="cart-item-right">
          <div class="cart-item-price">${lineTotal} ج.م</div>
          <a class="cart-item-remove" onclick="removeFromCart('${item.cartId}')">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
            حذف
          </a>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
  updateCartSummary();
}

function renderEmptyCart() {
  const container = document.getElementById('cartItemsContainer');
  if (!container) return;

  container.parentElement.innerHTML = `
    <div class="cart-empty">
      <svg class="cart-empty-icon" width="60" height="60" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <h2>السلة فارغة</h2>
      <p>ابدأ التسوق الآن واستمتع بمجموعتنا المميزة من ملابس اللياقة البدنية الفاخرة</p>
      <a href="index.html" class="cart-empty-btn">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        متابعة التسوق
      </a>
    </div>
  `;
}

function updateCartSummary() {
  const subtotal = cart.getCartTotal();
  const shipping = cart.getShipping();
  const total = cart.getGrandTotal();

  const subtotalEl = document.getElementById('subtotal');
  const shippingEl = document.getElementById('shipping');
  const totalEl = document.getElementById('total');

  if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString('ar-EG')} ج.م`;
  if (shippingEl) shippingEl.textContent = `${shipping.toLocaleString('ar-EG')} ج.م`;
  if (totalEl) totalEl.textContent = `${total.toLocaleString('ar-EG')} ج.م`;
}

// ─────────────────────────────────────────────────────
// CART ACTIONS
// ─────────────────────────────────────────────────────
window.increaseQty = function (cartId) {
  const item = cart.items.find(i => i.cartId === cartId);
  if (item) {
    cart.updateQuantity(cartId, item.quantity + 1);
    renderCartPage();
  }
};

window.decreaseQty = function (cartId) {
  const item = cart.items.find(i => i.cartId === cartId);
  if (item && item.quantity > 1) {
    cart.updateQuantity(cartId, item.quantity - 1);
    renderCartPage();
  }
};

window.removeFromCart = function (cartId) {
  if (cart.removeItem(cartId)) {
    showToast('تم حذف المنتج من السلة', 'success');
    renderCartPage();
  }
};

// ─────────────────────────────────────────────────────
// WHATSAPP CHECKOUT
// ─────────────────────────────────────────────────────
window.checkoutViaWhatsApp = function () {
  if (cart.items.length === 0) {
    showToast('السلة فارغة', 'error');
    return;
  }

  const lines = [];
  lines.push('استعلام الشراء من AM SPORT');
  lines.push('');

  cart.items.forEach((item, idx) => {
    const priceText = item.price.toLocaleString('ar-EG');
    const lineText = item.lineTotal.toLocaleString('ar-EG');
    lines.push(`${idx + 1}. ${item.name}`);
    lines.push(`   الحجم: ${item.size} | اللون: ${item.colorLabel || item.color}`);
    lines.push(`   الكمية: ${item.quantity} × ${priceText} ج.م = ${lineText} ج.م`);
    lines.push('');
  });

  const total = cart.getGrandTotal().toLocaleString('ar-EG');
  lines.push(`الإجمالي: ${total} ج.م`);
  lines.push('');
  lines.push('يرجى التأكيد والرد على البيانات التالية:');
  lines.push('- الاسم الكامل');
  lines.push('- رقم الهاتف');
  lines.push('- عنوان التوصيل');

  const message = encodeURIComponent(lines.join('\n'));
  const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${message}`;
  window.open(whatsappUrl, '_blank');
};

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────
function resolveImageUrl(img) {
  if (!img) return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80';
  if (img.startsWith('http')) return img;

  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  return isLocal ? `http://localhost:5000${img}` : img;
}

function getColorHex(colorName) {
  const colorMap = {
    'Black':        '#111111',
    'White':        '#FAFAF8',
    'Charcoal':     '#3D3D40',
    'Graphite':     '#5A5A5E',
    'Ivory':        '#F5F0E8',
    'Grey':         '#8A8A8E',
    'BrightRed':    '#E30613',
    'Burgundy':     '#6D071A',
    'WineRed':      '#722F37',
    'CoralRed':     '#FF6B5B',
    'HotPink':      '#FF69B4',
    'BabyPink':     '#F4C2C2',
    'OrchidPink':   '#DA95C4',
    'DustyMauve':   '#B784A0',
    'Beige':        '#E8D5B7',
    'LightGray':    '#D3D3D3',
    'CharcoalGray': '#4A4A4D',
    'RoyalBlue':    '#4169E1',
    'SkyBlue':      '#87CEEB',
    'NavyBlue':     '#1B1F3B',
    'OliveGreen':   '#708238',
  };
  return colorMap[colorName] || '#999';
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '<svg class="ti" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg class="ti" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg class="ti" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>',
  };

  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `${icons[type]}<span>${message}</span>`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ─────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.CartManager = CartManager;
  window.cart = cart;
}
