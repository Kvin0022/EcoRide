console.log("connexion.js chargé");

// Burger menu (inchangé)
document.addEventListener('DOMContentLoaded', function () {
  const burger = document.querySelector('.menu-hamburger');
  const nav = document.querySelector('.nav-links');
  if (!burger || !nav) return;
  burger.addEventListener('click', () => nav.classList.toggle('mobile-menu'));
});

// === LOGIN ===
document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = (window.API_BASE_URL ?? 'https://ecoride-production-0838.up.railway.app').replace(/\/+$/,'');

  const form     = document.querySelector('#login-form') || document.querySelector('.login-form');
  const emailEl  = document.querySelector('#email');
  const passEl   = document.querySelector('#password');
  const statusEl = document.querySelector('#login-status');
  const errorEl  = document.querySelector('#login-error');
  const btn      = document.querySelector('#login-submit');

  if (!form) return;

  const STORAGE_KEY = (window.EcoAuth && window.EcoAuth.KEY) || 'ecoride.session';
  const setStatus = (msg) => {
    if (statusEl) {
      statusEl.textContent = msg || '';
      statusEl.className = 'status';
      statusEl.setAttribute('aria-live', 'polite');
    }
  };
  const setError  = (msg) => {
    if (errorEl)  {
      errorEl.textContent  = msg || '';
      errorEl.className  = 'error';
      errorEl.setAttribute('aria-live', 'assertive');
    }
  };

  const isValidEmail = (v='') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = (emailEl?.value || '').trim();
    const password = passEl?.value || '';

    // validations rapides
    if (!email || !password)      { setError('Merci de renseigner email et mot de passe.'); setStatus(''); return; }
    if (!isValidEmail(email))     { setError('Email invalide.'); setStatus(''); return; }
    if (password.length < 6)      { setError('Mot de passe : 6 caractères minimum.'); setStatus(''); return; }

    setError('');
    setStatus('Connexion en cours…');
    if (btn) btn.disabled = true;

    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.token) {
        const session = { token: data.token, role: data.role || 'user', email };

        // stocke via EcoAuth si dispo, sinon fallback localStorage
        if (window.EcoAuth && typeof window.EcoAuth.setSession === 'function') {
          window.EcoAuth.setSession(session);
          if (typeof window.EcoAuth.refreshNavbar === 'function') window.EcoAuth.refreshNavbar();
        } else {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch {}
          window.dispatchEvent(new CustomEvent('ecoride:session'));
        }

        // Message visible avant redirection
        if (statusEl) {
          statusEl.textContent = 'Connexion réussie ✅';
          statusEl.classList.add('ok');           // -> pense à styliser .status.ok dans ton CSS
          statusEl.setAttribute('aria-live', 'polite');
        }
        setError('');
        if (passEl) passEl.value = '';

        // Laisse le temps de voir le message (1,2 s), puis redirige
        await new Promise(r => setTimeout(r, 1200));
        window.location.href = '../Html/Recherche-covoiturage.html';
        return;

      } else if (res.status === 401) {
        setError('Identifiants invalides.');
        setStatus('');
      } else {
        setError(data?.error || 'Erreur de connexion.');
        setStatus('');
      }

    } catch (_) {
      setError('Serveur indisponible.');
      setStatus('');
    } finally {
      if (btn) btn.disabled = false;
    }
  });
});
