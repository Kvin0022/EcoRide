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

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = window.API_BASE_URL ?? 'http://localhost:8080';

  const form = document.querySelector('#forgot-form') || document.querySelector('.reset-form');
  if (!form) return;

  // Accepte #forgot_email (si tu l'utilises plus tard) ou #email (ton HTML actuel)
  const emailInput = document.querySelector('#forgot_email') || document.querySelector('#email');
  const ok  = document.querySelector('#forgot-ok');
  const err = document.querySelector('#forgot-err');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    ok.textContent = ''; err.textContent = '';

    try {
      const res = await fetch(`${API_BASE_URL}/api/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email: (emailInput?.value || '').trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        ok.textContent = data.message || 'Si un compte existe, un email a été envoyé';
        form.reset();
      } else {
        err.textContent = data.error || 'Erreur';
      }
    } catch {
      err.textContent = 'Serveur indisponible';
    }
  });
});

