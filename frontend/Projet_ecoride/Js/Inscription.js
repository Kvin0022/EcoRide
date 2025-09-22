// Burger menu (inchangé)
document.addEventListener('DOMContentLoaded', function () {
  const burger = document.querySelector('.menu-hamburger');
  const nav = document.querySelector('.nav-links');
  if (!burger || !nav) return;
  burger.addEventListener('click', function () {
    nav.classList.toggle('mobile-menu');
  });
});

// === INSCRIPTION ===
document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = window.API_BASE_URL ?? 'https://ecoride-production-0838.up.railway.app';

  const form     = document.getElementById('signup-form') || document.querySelector('.signup-form');
  const emailEl  = document.getElementById('email');
  const userEl   = document.getElementById('username');
  const passEl   = document.getElementById('password');
  const pass2El  = document.getElementById('password_confirm');
  const termsEl  = document.getElementById('terms');

  const statusEl = document.getElementById('signup-status');
  const errorEl  = document.getElementById('signup-error');
  const btn      = document.getElementById('signup-submit');

  if (!form) return;

  const STORAGE_KEY = (window.EcoAuth && window.EcoAuth.KEY) || 'ecoride.session';
  const setStatus = (msg) => { if (statusEl) { statusEl.textContent = msg || ''; statusEl.className = 'status'; } };
  const setError  = (msg) => { if (errorEl)  { errorEl.textContent  = msg || ''; errorEl.className  = 'error'; } };

  const isValidEmail = (v='') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  async function loginAfterRegister(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.token) {
        const session = { token: data.token, role: data.role || 'user', email };
        if (window.EcoAuth?.setSession) {
          window.EcoAuth.setSession(session);
          if (typeof window.EcoAuth.refreshNavbar === 'function') window.EcoAuth.refreshNavbar();
        } else {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch {}
          window.dispatchEvent(new CustomEvent('ecoride:session'));
        }
        return true;
      }
    } catch {}
    return false;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = (emailEl?.value || '').trim();
    const pseudo = (userEl?.value || '').trim();
    const pass = passEl?.value || '';
    const pass2 = pass2El?.value || '';
    const termsOk = !!termsEl?.checked;

    // Validations
    if (!email || !pseudo || !pass || !pass2) {
      setError('Merci de remplir tous les champs.');
      setStatus(''); return;
    }
    if (!isValidEmail(email)) {
      setError('Email invalide.');
      setStatus(''); return;
    }
    if (pass.length < 6) {
      setError('Mot de passe : 6 caractères minimum.');
      setStatus(''); return;
    }
    if (pass !== pass2) {
      setError('Les mots de passe ne correspondent pas.');
      setStatus(''); return;
    }
    if (!termsOk) {
      setError('Veuillez accepter les CGU pour continuer.');
      setStatus(''); return;
    }

    setError('');
    setStatus('Création du compte…');
    if (btn) btn.disabled = true;

    try {
      // API attend: { pseudo, email, password }
      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ pseudo, email, password: pass })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok || res.status === 201) {
        setStatus('Compte créé ✅ Connexion…');

        // auto-login pour récupérer un token et créer la session
        const ok = await loginAfterRegister(email, pass);
        if (!ok) {
          // Si l’API login est HS, on redirige vers Connexion
          setStatus('Compte créé ✅ Redirection…');
          setTimeout(() => { window.location.href = '../Html/Connexion.html'; }, 400);
          return;
        }

        // Redirection vers la recherche
        setStatus('Bienvenue ! Redirection…');
        // sécurité: vider les mdp
        if (passEl) passEl.value = '';
        if (pass2El) pass2El.value = '';
        setTimeout(() => {
          window.location.href = '../Html/Recherche-covoiturage.html';
        }, 400);

      } else if (res.status === 409) {
        setError(data?.error || 'Un compte existe déjà avec cet email.');
        setStatus('');
      } else if (res.status === 422) {
        setError(data?.error || 'Données invalides.');
        setStatus('');
      } else {
        setError(data?.error || 'Erreur lors de l’inscription.');
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
