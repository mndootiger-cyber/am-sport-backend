/**
 * AM SPORT — Login JS
 */

// If already logged in, redirect
if (localStorage.getItem('adminToken')) {
  window.location.replace('admin.html');
}

const loginForm = document.getElementById('loginForm');
const loginBtn  = document.getElementById('loginBtn');
const errorMsg  = document.getElementById('errorMsg');

const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const LOGIN_URL = isLocal
  ? 'http://localhost:5000/api/auth/login'
  : 'https://am-sport-backend-production-0fac.up.railway.app/api/auth/login';

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
  // Shake animation
  loginBtn.style.animation = 'shake 0.4s ease';
  setTimeout(() => loginBtn.style.animation = '', 400);
}

function hideError() {
  errorMsg.style.display = 'none';
}

// Inline shake keyframes via style tag
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%      { transform: translateX(-6px); }
  40%      { transform: translateX(6px); }
  60%      { transform: translateX(-4px); }
  80%      { transform: translateX(4px); }
}`;
document.head.appendChild(shakeStyle);

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showError('يرجى ملء جميع الحقول.');
    return;
  }

  loginBtn.classList.add('loading');
  loginBtn.textContent = 'جارٍ التحقق...';

  try {
    const res  = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.token) {
      localStorage.setItem('adminToken', data.token);
      loginBtn.textContent = 'تم الدخول ✓';
      loginBtn.style.background = '#4ade80';
      setTimeout(() => window.location.replace('admin.html'), 600);
    } else {
      showError(data.message || 'بيانات الدخول غير صحيحة.');
      loginBtn.classList.remove('loading');
      loginBtn.textContent = 'تسجيل الدخول';
    }
  } catch (err) {
    showError('تعذّر الاتصال بالسيرفر. تحقق من الاتصال وحاول مجدداً.');
    loginBtn.classList.remove('loading');
    loginBtn.textContent = 'تسجيل الدخول';
  }
});

// Clear error on input
['email','password'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', hideError);
});
