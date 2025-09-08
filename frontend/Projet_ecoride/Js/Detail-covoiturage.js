// --- Burger menu ---
document.addEventListener('DOMContentLoaded', function () {
  const burger = document.querySelector('.menu-hamburger');
  const nav = document.querySelector('.nav-links');
  if (!burger || !nav) return;
  burger.addEventListener('click', function () {
    nav.classList.toggle('mobile-menu');
  });
});

// --- Sélecteurs modale réservation ---
const overlay       = document.getElementById('modal-overlay');
const btnParticiper = document.querySelector('.btn-participer');
const btnClose      = document.querySelector('.modal-close');
const btnCancel     = document.getElementById('btn-cancel');

const mdDep = document.getElementById('modal-departure');
const mdArr = document.getElementById('modal-arrival');
const mdDT  = document.getElementById('modal-datetime');
const mdCr  = document.getElementById('modal-credits');

// Scroll lock du body quand la modale est ouverte
function lockBody(lock) {
  if (lock) document.body.classList.add('no-scroll');
  else document.body.classList.remove('no-scroll');
}

function openModal() {
  if (!overlay) return;
  overlay.style.display = 'flex';
  lockBody(true);
}
function closeModal() {
  if (!overlay) return;
  overlay.style.display = 'none';
  lockBody(false);
}

// Boutons / interactions modale
btnParticiper?.addEventListener('click', openModal);
btnClose?.addEventListener('click', closeModal);
btnCancel?.addEventListener('click', closeModal);

// Ferme au clic hors de la boîte
overlay?.addEventListener('click', e => {
  if (e.target === overlay) closeModal();
});

// Ferme avec la touche Échap
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay && overlay.style.display === 'flex') {
    closeModal();
  }
});

// --- Modale "Avis" (si présente) ---
document.addEventListener('DOMContentLoaded', () => {
  const btnAvis    = document.querySelector('.btn-avis');
  const revOverlay = document.getElementById('reviews-overlay');
  if (!btnAvis || !revOverlay) return;

  const revCloses  = revOverlay.querySelectorAll('.modal-close, #btn-reviews-close');

  btnAvis.addEventListener('click', () => {
    revOverlay.classList.add('active');
  });

  revCloses.forEach(btn => {
    btn.addEventListener('click', () => revOverlay.classList.remove('active'));
  });

  revOverlay.addEventListener('click', e => {
    if (e.target === revOverlay) revOverlay.classList.remove('active');
  });
});

// === Détails dynamiques + Réservation API ===
(function () {
  const API = window.API_BASE_URL ?? 'http://localhost:8080';

  // id du trajet depuis l'URL
  const id = new URLSearchParams(location.search).get('id');
  if (!id) return;

  const $  = sel => document.querySelector(sel);
  const rdRoute  = $('#rd-route');
  const rdDate   = $('#rd-datetime');
  const rdVeh    = $('#rd-vehicle');
  const rdSC     = $('#rd-seats-credits');
  const rdStatus = $('#rd-status');

  // bouton réserver : #rd-book si présent, sinon .btn-participer
  const bookBtn = $('#rd-book') || document.querySelector('.btn-participer');

  function showStatus(msg, type='') {
    if (rdStatus) {
      rdStatus.textContent = msg;
      rdStatus.className = `status ${type}`;
    } else {
      // fallback
      if (type === 'err') alert(msg);
      else console.log(msg);
    }
  }

  function setBookBtnState(seats) {
    if (!bookBtn) return;
    if (seats <= 0) {
      bookBtn.disabled = true;
      bookBtn.textContent = 'Complet';
    } else {
      bookBtn.disabled = false;
      if (bookBtn.id === 'rd-book') bookBtn.textContent = 'Réserver';
    }
  }

  // Charge les infos du trajet + remplit la modale
  async function loadRide() {
    try {
      const res = await fetch(`${API}/api/rides/${encodeURIComponent(id)}`);
      const r   = await res.json();
      if (!res.ok) throw new Error(r.error || 'Erreur');

      // Zone principale
      if (rdRoute) rdRoute.textContent = `${r.origin} → ${r.destination}`;
      if (rdDate)  rdDate.textContent  =
        `${r.date_time}${r.duration_minutes ? ` • ${r.duration_minutes} min` : ''}` +
        `${Number.isInteger(r.driver_rating) ? ` • ★${r.driver_rating}` : ''}`;
      if (rdVeh)   rdVeh.textContent   =
        r.vehicle_brand
          ? `Véhicule : ${r.vehicle_brand} ${r.vehicle_model || ''}${r.vehicle_plate ? ` (${r.vehicle_plate})` : ''}`
          : 'Véhicule : —';
      if (rdSC)    rdSC.textContent    = `Places dispo : ${r.seats} • Prix : ${Number(r.credits).toFixed(0)} crédits`;

      // Résumé dans la modale
      if (mdDep) mdDep.textContent = r.origin;
      if (mdArr) mdArr.textContent = r.destination;
      if (mdDT)  mdDT.textContent  = r.date_time + (r.duration_minutes ? ` • ${r.duration_minutes} min` : '');
      if (mdCr)  mdCr.textContent  = `${Number(r.credits).toFixed(0)} crédits`;

      setBookBtnState(Number(r.seats));
      showStatus('', '');
    } catch (e) {
      showStatus('Impossible de charger ce trajet', 'err');
    }
  }

  // Expo pour pouvoir rafraîchir après réservation
  window.__ecoRide_loadRide = loadRide;

  // Clic sur "Réserver" : ouvre la modale si elle existe, sinon fallback en prompt
  if (bookBtn) {
    bookBtn.addEventListener('click', async () => {
      const hasModalForm = document.getElementById('book-form');
      if (overlay && hasModalForm) {
        openModal();
        return;
      }

      // Fallback prompt (si pas de modale)
      const name  = prompt('Votre nom ?');
      const email = prompt('Votre email ?');
      if (!name || !email) return;

      bookBtn.disabled = true;
      try {
        const res = await fetch(`${API}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ ride_id: Number(id), name, email })
        });
        const data = await res.json().catch(()=> ({}));

        if (res.ok) {
          showStatus('Réservation enregistrée ✅', 'ok');
          await loadRide(); // refresh seats
        } else if (res.status === 409 && data.error === 'Ride full') {
          showStatus('Trajet complet', 'err');
          await loadRide();
        } else if (res.status === 409 && data.error === 'Already booked') {
          showStatus('Vous avez déjà réservé ce trajet', 'err');
        } else if (res.status === 404) {
          showStatus('Trajet introuvable', 'err');
        } else if (res.status === 422) {
          showStatus('Données invalides', 'err');
        } else {
          showStatus(data.error || 'Erreur de réservation', 'err');
        }
      } catch (err) {
        showStatus('Serveur indisponible', 'err');
      } finally {
        bookBtn.disabled = false;
      }
    });
  }

  // --- Soumission via la modale ---
  (function () {
    const rideId    = Number(new URLSearchParams(location.search).get('id') || 0);
    if (!rideId) return;

    const form      = document.getElementById('book-form');
    if (!form) return;

    const nameInput = document.getElementById('book_name');
    const mailInput = document.getElementById('book_email');
    const submitBtn = document.getElementById('btn-book-submit');
    const statusEl  = document.getElementById('book-status') || rdStatus;

    function show(msg, type='') {
      if (!statusEl) { type === 'err' ? alert(msg) : console.log(msg); return; }
      statusEl.textContent = msg;
      statusEl.className = `status ${type}`;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name  = nameInput?.value.trim() || '';
      const email = mailInput?.value.trim() || '';
      if (!name || !email) {
        show('Merci de remplir votre nom et votre email.', 'err');
        return;
      }

      submitBtn && (submitBtn.disabled = true);
      try {
        const res = await fetch(`${API}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ ride_id: rideId, name, email })
        });
        const data = await res.json().catch(()=> ({}));

        if (res.ok) {
          show('Réservation enregistrée ✅', 'ok');
          if (typeof window.__ecoRide_loadRide === 'function') {
            await window.__ecoRide_loadRide();
          }
          form.reset();
          setTimeout(() => { try { closeModal(); } catch(_){} }, 350);
        } else if (res.status === 409 && data.error === 'Ride full') {
          show('Trajet complet', 'err');
          if (typeof window.__ecoRide_loadRide === 'function') {
            await window.__ecoRide_loadRide();
          }
        } else if (res.status === 409 && data.error === 'Already booked') {
          show('Vous avez déjà réservé ce trajet', 'err');
        } else if (res.status === 404) {
          show('Trajet introuvable', 'err');
        } else if (res.status === 422) {
          show('Données invalides', 'err');
        } else {
          show(data.error || 'Erreur de réservation', 'err');
        }
      } catch (err) {
        show('Serveur indisponible', 'err');
      } finally {
        submitBtn && (submitBtn.disabled = false);
      }
    });
  })();

  // Premier chargement
  window.addEventListener('DOMContentLoaded', loadRide);
})();
