document.addEventListener('DOMContentLoaded', function() {
    const burger = document.querySelector('.menu-hamburger');
    const nav = document.querySelector('.nav-links');
    if (!burger || !nav) {
        console.error('Impossible de trouver .menu-hamburger ou .nav-links');
        return;
    }
    burger.addEventListener('click', function() {
        nav.classList.toggle('mobile-menu');
    });
});

// === LOGIN (à coller sous ton code burger) ===
document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = window.API_BASE_URL ?? 'http://localhost:8080';

  const form     = document.querySelector('#login-form') || document.querySelector('.login-form');
  const emailEl  = document.querySelector('#email');
  const passEl   = document.querySelector('#password');
  const statusEl = document.querySelector('#login-status');
  const errorEl  = document.querySelector('#login-error');
  const btn      = document.querySelector('#login-submit');

  if (!form) return; // pas sur cette page

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // on bloque l'envoi natif vers /connexion

    const email = (emailEl?.value || '').trim();
    const password = (passEl?.value || '').trim();

    if (!email || !password) {
      if (errorEl) errorEl.textContent = 'Merci de remplir tous les champs.';
      return;
    }

    if (btn) btn.disabled = true;
    if (statusEl) statusEl.textContent = 'Connexion en cours...';
    if (errorEl) errorEl.textContent = '';

    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        localStorage.setItem('token', data.token);
        if (statusEl) statusEl.textContent = 'Connecté ✅';
        // Option : rediriger après un court délai
        // setTimeout(() => window.location.href = '../Html/Accueil.html', 700);
      } else {
        if (errorEl) errorEl.textContent = data.error || 'Erreur de connexion';
        if (statusEl) statusEl.textContent = '';
      }
    } catch (err) {
      if (errorEl) errorEl.textContent = 'Serveur indisponible';
      if (statusEl) statusEl.textContent = '';
    } finally {
      if (btn) btn.disabled = false;
    }
  });
});
