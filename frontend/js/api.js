/**
 * AM SPORT — API Service
 * لازم يتحمّل في admin.html قبل admin.js
 * <script src="js/api.js"></script>
 * <script src="js/admin.js"></script>
 */

class PilatesApiService {
  constructor() {
    // رابط الباك إند الفعلي على Railway (بعد رفع الموقع)
this.baseUrl = 'https://am-sport-backend-production-0fac.up.railway.app/api';  }

  /* ── جلب كل المنتجات ─────────────────────────────── */
  async getAllProducts() {
    const res = await fetch(`${this.baseUrl}/products`);
    if (!res.ok) throw new Error(`فشل تحميل المنتجات (${res.status})`);
    return res.json();
  }

  /* ── إضافة منتج جديد ─────────────────────────────── */
  async createProduct(payload, token) {
    return fetch(`${this.baseUrl}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
  }

  /* ── تحديث منتج موجود ─────────────────────────────── */
  async updateProduct(id, payload, token) {
    return fetch(`${this.baseUrl}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
  }

  /* ── حذف منتج ─────────────────────────────────────── */
  async deleteProduct(id, token) {
    return fetch(`${this.baseUrl}/products/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  /* ── تجهيز رابط الصورة (لو الرابط ناقص أو نسبي) ───── */
    resolveImageUrl(image) {
    if (!image) {
      return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop';
    }
    const rawMatch = image.match(/^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/);
    if (rawMatch) {
      const [, user, repo, ref, path] = rawMatch;
      return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${ref}/${path}`;
    }
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    return `${this.baseUrl.replace('/api', '')}/${image.replace(/^\/+/, '')}`;
  }
}

// ─────────────────────────────────────────────────────
// GLOBAL INSTANCE (used by cart.js and product pages)
// ─────────────────────────────────────────────────────
const api = new PilatesApiService();
if (typeof window !== 'undefined') {
  window.api = api;
}
