/**
 * AM SPORT — Orders Dashboard JS
 */

const token = localStorage.getItem('adminToken');

// حماية الصفحة: لو مفيش توكن، رجّع لصفحة الدخول
if (!token) {
  window.location.replace('login.html');
}

let allOrders = [];
let currentFilter = 'all';

/* ── TOAST ─────────────────────────────────────────────── */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${message}</span>`;
  container?.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ── LOGOUT ─────────────────────────────────────────────── */
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem('adminToken');
  window.location.replace('login.html');
});

/* ── STATUS LABELS ─────────────────────────────────────── */
const STATUS_LABELS = {
  pending:   'قيد التجهيز',
  shipped:   'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

/* ── FILTER BUTTONS ───────────────────────────────────── */
document.getElementById('filterRow')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = btn.dataset.filter;
  renderOrders();
});

/* ── FETCH ORDERS ─────────────────────────────────────── */
async function fetchOrders() {
  try {
    allOrders = await api.getAllOrders(token);
    updateStats();
    renderOrders();
  } catch (err) {
    console.error('[Orders] fetchOrders:', err);
    const tbody = document.getElementById('ordersTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:3rem;color:var(--danger)">تعذر تحميل الطلبات. تأكد من تسجيل الدخول وحاول مرة أخرى.</td></tr>`;
    }
    showToast('خطأ في تحميل الطلبات.', 'error');
  }
}

/* ── STATS ─────────────────────────────────────────────── */
function updateStats() {
  document.getElementById('totalOrders').textContent     = allOrders.length;
  document.getElementById('pendingOrders').textContent   = allOrders.filter(o => (o.status || 'pending') === 'pending').length;
  document.getElementById('shippedOrders').textContent   = allOrders.filter(o => o.status === 'shipped').length;
  document.getElementById('deliveredOrders').textContent = allOrders.filter(o => o.status === 'delivered').length;
}

/* ── RENDER ────────────────────────────────────────────── */
function renderOrders() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  const filtered = currentFilter === 'all'
    ? allOrders
    : allOrders.filter(o => (o.status || 'pending') === currentFilter);

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>
          <p>لا توجد طلبات حاليًا.</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(order => {
    const status = order.status || 'pending';
    const date = order.createdAt
      ? new Date(order.createdAt).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : '';
    const itemsHtml = (order.items || []).map(it =>
      `<div>${it.name || ''} ${it.color ? '· ' + it.color : ''} ${it.size ? '· ' + it.size : ''} × ${it.quantity || 1}</div>`
    ).join('');
    const total = Number(order.totalAmount || 0).toLocaleString('ar-EG');
    const whatsappNumber = (order.phone || '').replace(/\D/g, '');
    const whatsappHref = whatsappNumber ? `https://wa.me/2${whatsappNumber}` : '#';

    return `
      <tr>
        <td data-label="رقم الطلب">
          <div class="order-num">${order.orderNumber || '—'}</div>
          <div class="order-date">${date}</div>
        </td>
        <td data-label="العميل">
          <div class="customer-name">${order.customerName || ''}</div>
          <div class="customer-phone">${order.phone || ''}</div>
          ${whatsappNumber ? `<a class="whatsapp-link" href="${whatsappHref}" target="_blank" rel="noopener">تواصل واتساب ↗</a>` : ''}
        </td>
        <td data-label="العنوان">
          <div>${order.governorate || ''}</div>
          <div style="color:var(--muted);font-size:0.8rem">${order.address || ''}</div>
          ${order.notes ? `<div style="color:var(--muted);font-size:0.75rem;margin-top:0.2rem">ملاحظات: ${order.notes}</div>` : ''}
        </td>
        <td data-label="المنتجات"><div class="items-list">${itemsHtml || '—'}</div></td>
        <td data-label="الإجمالي"><span class="total">${total} ج.م</span></td>
        <td data-label="الحالة">
          <span class="status-badge status-${status}">${STATUS_LABELS[status] || status}</span>
          <br>
          <select class="status-select" data-id="${order._id}">
            <option value="pending" ${status === 'pending' ? 'selected' : ''}>قيد التجهيز</option>
            <option value="shipped" ${status === 'shipped' ? 'selected' : ''}>تم الشحن</option>
            <option value="delivered" ${status === 'delivered' ? 'selected' : ''}>تم التسليم</option>
            <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>ملغي</option>
          </select>
        </td>
      </tr>`;
  }).join('');

  // ربط أحداث تغيير الحالة
  tbody.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const newStatus = e.target.value;
      try {
        const res = await api.updateOrderStatus(id, newStatus, token);
        if (res.ok) {
          showToast('تم تحديث حالة الطلب ✓', 'success');
          const order = allOrders.find(o => o._id === id);
          if (order) order.status = newStatus;
          updateStats();
          renderOrders();
        } else {
          showToast('فشل تحديث الحالة.', 'error');
        }
      } catch (err) {
        console.error('[Orders] updateStatus:', err);
        showToast('خطأ في الاتصال بالسيرفر.', 'error');
      }
    });
  });
}

/* ── INIT ────────────────────────────────────────────────── */
fetchOrders();
