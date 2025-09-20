// auth.js — session, navbar et logout
(function () {
  const STORAGE_KEY = 'ecoride.session';

  /** ------- Session helpers ------- **/
  function getSession() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }
  function setSession(obj) {
    try {
      if (!obj) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      // Notifie les autres scripts de la mise à jour locale
      window.dispatchEvent(new CustomEvent('ecoride:session'));
    } catch {}
  }
  function isLoggedIn() {
    const s = getSession();
    return !!(s && (s.token || s.email));
  }
  function logout() {
    setSession(null);
    window.location.href = '../Html/Connexion.html';
  }

  /** ------- Navbar helpers ------- **/
  function findConnexionLink() {
    const links = document.querySelectorAll('.nav-links a, nav a, header a');
    for (const a of links) {
      const text = (a.textContent || '').trim().toLowerCase();
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (text.includes('connexion') || href.includes('connexion.html')) return a;
    }
    return null;
  }
  function showHideByRole(logged) {
    document.body.classList.toggle('is-auth', logged);
    document.querySelectorAll('.guest-only').forEach(el => {
      const li = el.closest('li') || el;
      li.style.display = logged ? 'none' : '';
    });
    document.querySelectorAll('.auth-only').forEach(el => {
      const li = el.closest('li') || el;
      li.style.display = logged ? '' : 'none';
    });
  }

  function updateNavbar() {
    const s = getSession();
    const logged = isLoggedIn();
    showHideByRole(logged);

    const loginLink  = document.getElementById('login-link');   // optionnel
    const logoutLink = document.getElementById('logout-link');  // idéalement présent

    // cible principale pour (dé)connexion
    let target = logoutLink || findConnexionLink();
    if (target) {
      if (logged) {
        const label = s.pseudo ? `Se déconnecter (${s.pseudo})`
                    : (s.email ? `Se déconnecter (${s.email})` : 'Se déconnecter');
        target.textContent = label;
        target.setAttribute('href', '#logout');
        target.onclick = (e) => { e.preventDefault(); logout(); };
      } else {
        target.textContent = 'Connexion';
        target.setAttribute('href', '../Html/Connexion.html');
        target.onclick = null;
      }
    }

    // accessibilité : cache visuellement le lien “Connexion” dédié si déjà connecté
    if (loginLink) {
      const li = loginLink.closest('li') || loginLink;
      li.style.display = logged ? 'none' : '';
    }
  }

  // Mise à jour initiale + synchro
  document.addEventListener('DOMContentLoaded', updateNavbar);
  window.addEventListener('storage', (e) => { if (e.key === STORAGE_KEY) updateNavbar(); });
  window.addEventListener('ecoride:session', updateNavbar);

  // Expose des helpers pour Connexion/Inscription/etc.
  window.EcoAuth = {
    KEY: STORAGE_KEY,
    getSession,
    setSession,
    isLoggedIn,
    logout,
    refreshNavbar: updateNavbar,
  };
})();
