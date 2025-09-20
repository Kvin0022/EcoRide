// --- Burger menu ---
document.addEventListener('DOMContentLoaded', function () {
  const burger = document.querySelector('.menu-hamburger');
  const nav = document.querySelector('.nav-links');
  if (!burger || !nav) return;
  burger.addEventListener('click', function () {
    nav.classList.toggle('mobile-menu');
  });
});

/* =============== Helpers UI (loader + toast) =============== */
const loaderEl = document.getElementById('loader');
const toastEl  = document.getElementById('toast');

function showLoader(on = true) {
  if (!loaderEl) return;
  loaderEl.classList.toggle('hidden', !on);
  loaderEl.setAttribute('aria-hidden', on ? 'false' : 'true');
}
function showToast(msg, type = 'ok') {
  if (!toastEl) { type === 'err' ? alert(msg) : console.log(msg); return; }
  toastEl.textContent = msg;
  toastEl.className = `toast show ${type}`;
  setTimeout(() => (toastEl.className = 'toast'), 1800);
}

/* =============== Modale de réservation =============== */
const overlay   = document.getElementById('modal-overlay');
const btnOpen   = document.getElementById('btn-participer'); // CTA
const btnClose  = document.querySelector('#modal-overlay .modal-close');
const btnCancel = document.getElementById('btn-cancel');

const mdDep = document.getElementById('modal-departure');
const mdArr = document.getElementById('modal-arrival');
const mdDT  = document.getElementById('modal-datetime');
const mdCr  = document.getElementById('modal-credits');

// Scroll-lock body quand la modale est ouverte
function openModal() {
  if (!overlay) return;
  overlay.style.display = 'flex';
  document.body.classList.add('body-lock');
  const first = document.getElementById('book_name');
  if (first) first.focus();
}
function closeModal() {
  if (!overlay) return;
  overlay.style.display = 'none';
  document.body.classList.remove('body-lock');
}

btnOpen  && btnOpen.addEventListener('click', openModal);
btnClose && btnClose.addEventListener('click', closeModal);
btnCancel&& btnCancel.addEventListener('click', closeModal);

// Ferme au clic en dehors de la boîte
overlay && overlay.addEventListener('click', e => {
  if (e.target === overlay) closeModal();
});
// Ferme avec Echap
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && overlay && overlay.style.display !== 'none') closeModal();
});

/* =============== Modale “Avis” =============== */
document.addEventListener('DOMContentLoaded', () => {
  const btnAvis    = document.querySelector('.btn-avis');
  const revOverlay = document.getElementById('reviews-overlay');
  const revTitle   = document.getElementById('reviews-title');
  if (!btnAvis || !revOverlay) return;

  const revCloses = revOverlay.querySelectorAll('.modal-close, #btn-reviews-close');

  btnAvis.addEventListener('click', () => {
    revOverlay.style.display = 'flex';
    document.body.classList.add('body-lock');
  });

  function closeReviews() {
    revOverlay.style.display = 'none';
    document.body.classList.remove('body-lock');
  }

  revCloses.forEach(btn => btn.addEventListener('click', closeReviews));
  revOverlay.addEventListener('click', e => { if (e.target === revOverlay) closeReviews(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && revOverlay.style.display !== 'none') closeReviews();
  });

  // on mettra le titre à jour (Avis sur <nom>) quand on charge le trajet
  window.__ecoRide_setReviewsTitle = (name) => {
    if (revTitle) revTitle.textContent = name ? `Avis sur ${name}` : 'Avis du conducteur';
  };
});

/* =============== Détails dynamiques + Réservation API =============== */
(function () {
  const API = window.API_BASE_URL ?? 'http://localhost:8080';

  // id du trajet depuis l'URL
  const id = new URLSearchParams(location.search).get('id');
  if (!id) return;

  const $ = sel => document.querySelector(sel);

  // En-tête
  const rdRoute = $('#rd-route');

  // “Le trajet”
  const rdDepartCity = $('#rd-depart-city');
  const rdDepartDT   = $('#rd-depart-datetime');
  const rdArrCity    = $('#rd-arrivee-city');

  // Chauffeur (facultatif selon API)
  const driverBlock   = document.getElementById('driver-block'); // conteneur optionnel pour cacher si vide
  const rdDriverAvatar = $('#rd-driver-avatar');
  const rdDriverName   = $('#driver-name');
  const rdDriverRating = $('#driver-rating');
  const rdDriverNote   = $('#driver-note');

  // Véhicule
  const vehTitle = $('#vehicule-title');
  const vehEco   = $('#vehicule-eco');
  const vehPhoto = $('#vehicule-photo');

  // Places / CTA
  const placesTxt = $('#places-texte');
  const placesCout= $('#places-cout');
  const ctaBtn    = document.getElementById('btn-participer');

  function makeStars(n) {
    if (!Number.isFinite(n)) return '—';
    const full = Math.max(0, Math.min(5, Math.round(n)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  function setCtaState(seatsLeft) {
    if (!ctaBtn) return;
    if (seatsLeft <= 0) {
      ctaBtn.disabled = true;
      ctaBtn.textContent = 'Complet';
    } else {
      ctaBtn.disabled = false;
      ctaBtn.textContent = 'Participer';
    }
  }

  async function loadRide() {
    showLoader(true);
    try {
      const res = await fetch(`${API}/api/rides/${encodeURIComponent(id)}`);
      const r   = await res.json();
      if (!res.ok) throw new Error(r.error || 'Erreur');

      const price = Number(r.credits ?? r.price ?? 0);
      const seatsLeft = Number.isFinite(r.seats_left) ? r.seats_left : Number(r.seats ?? 0);

      // --------- En-tête ----------
      if (rdRoute) rdRoute.textContent = `${r.origin ?? '—'} → ${r.destination ?? '—'}`;

      // --------- Le trajet ----------
      if (rdDepartCity) rdDepartCity.textContent = r.origin || '—';
      if (rdDepartDT)   rdDepartDT.textContent   = r.date_time || '—';
      if (rdArrCity)    rdArrCity.textContent    = r.destination || '—';

      // --------- Chauffeur ----------
      // L'API ne renvoie pas de driver_name/avatar actuellement → on masque si on n’a rien
      const hasDriverData = Number.isFinite(r.driver_rating);
      if (rdDriverName)   rdDriverName.textContent   = r.driver_name || '';
      if (rdDriverRating) rdDriverRating.textContent = hasDriverData ? makeStars(r.driver_rating) : '—';
      if (rdDriverNote)   rdDriverNote.textContent   = hasDriverData ? `Note : ${r.driver_rating}/5` : '';
      if (rdDriverAvatar && r.driver_avatar_url) rdDriverAvatar.src = r.driver_avatar_url;
      if (typeof window.__ecoRide_setReviewsTitle === 'function') {
        window.__ecoRide_setReviewsTitle(r.driver_name || '');
      }
      if (driverBlock && !hasDriverData && !r.driver_name && !r.driver_avatar_url) {
        driverBlock.style.display = 'none';
      }

      // --------- Véhicule ----------
      const fullTitle = r.vehicle_brand
        ? `${r.vehicle_brand} ${r.vehicle_model || ''}${r.vehicle_plate ? ` (${r.vehicle_plate})` : ''}`
        : '—';
      if (vehTitle) vehTitle.textContent = fullTitle;
      if (vehPhoto && r.vehicle_photo_url) vehPhoto.src = r.vehicle_photo_url;
      if (vehEco) {
        if (r.energy === 'electric') {
          vehEco.textContent = 'Voyage écologique 🌱';
        } else if (r.energy) {
          vehEco.textContent = '';
        } else {
          vehEco.textContent = '';
        }
      }

      // --------- Places / CTA ----------
      if (placesTxt)  placesTxt.textContent  = `${seatsLeft} place${seatsLeft > 1 ? 's' : ''}`;
      if (placesCout) placesCout.textContent = `Coût ${Number.isFinite(price) ? price.toFixed(0) : '-'} crédits par passager`;
      setCtaState(seatsLeft);

      // --------- Résumé modale ----------
      if (mdDep) mdDep.textContent = r.origin || '—';
      if (mdArr) mdArr.textContent = r.destination || '—';
      if (mdDT)  mdDT.textContent  = r.date_time || '—';
      if (mdCr)  mdCr.textContent  = `${Number.isFinite(price) ? price.toFixed(0) : '-'} crédits`;

    } catch (e) {
      console.error(e);
      showToast('Impossible de charger ce trajet', 'err');
    } finally {
      showLoader(false);
    }
  }

  // Expose pour refresh après réservation
  window.__ecoRide_loadRide = loadRide;

  // === Réservation via la modale ===
  (function () {
    const rideId    = Number(id);
    const form      = document.getElementById('book-form');
    if (!form) return;

    const nameInput = document.getElementById('book_name');
    const mailInput = document.getElementById('book_email');
    const submitBtn = document.getElementById('btn-book-submit');
    const statusEl  = document.getElementById('book-status');

    function showInline(msg, type='') {
      if (statusEl) {
        statusEl.textContent = msg;
        statusEl.className = `status ${type}`;
      }
      showToast(msg, type === 'err' ? 'err' : 'ok');
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name  = nameInput?.value.trim() || '';
      const email = mailInput?.value.trim() || '';
      if (!name || !email) {
        showInline('Merci de remplir votre nom et votre email.', 'err');
        return;
      }

      submitBtn && (submitBtn.disabled = true);
      showLoader(true);
      try {
        const res = await fetch(`${API}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ ride_id: rideId, name, email })
        });
        const data = await res.json().catch(()=> ({}));

        if (res.ok) {
          showInline('Réservation enregistrée ✅', 'ok');
          if (typeof window.__ecoRide_loadRide === 'function') {
            await window.__ecoRide_loadRide(); // refresh seats
          }
          form.reset();
          setTimeout(() => { try { closeModal(); } catch(_){} }, 350);
        } else if (res.status === 409 && (data.error === 'Ride full' || data.error === 'Ride Full')) {
          showInline('Trajet complet', 'err');
          if (typeof window.__ecoRide_loadRide === 'function') await window.__ecoRide_loadRide();
        } else if (res.status === 409 && data.error === 'Already booked') {
          showInline('Vous avez déjà réservé ce trajet', 'err');
        } else if (res.status === 404) {
          showInline('Trajet introuvable', 'err');
        } else if (res.status === 422) {
          showInline('Données invalides', 'err');
        } else {
          showInline(data.error || 'Erreur de réservation', 'err');
        }
      } catch (err) {
        showInline('Serveur indisponible', 'err');
      } finally {
        submitBtn && (submitBtn.disabled = false);
        showLoader(false);
      }
    });
  })();

  // Charger les infos au démarrage
  window.addEventListener('DOMContentLoaded', loadRide);
})();
