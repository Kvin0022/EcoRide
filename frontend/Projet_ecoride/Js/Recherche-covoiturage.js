// --- Burger menu ---
document.addEventListener('DOMContentLoaded', function () {
  const burger = document.querySelector('.menu-hamburger');
  const nav = document.querySelector('.nav-links');
  if (!burger || !nav) return;
  burger.addEventListener('click', function () {
    nav.classList.toggle('mobile-menu');
  });
});

/* =========================
   Loader (helper C.2)
   ========================= */
const loaderEl = document.getElementById('loader'); // <div id="loader">...</div> dans le HTML
function showLoader(on = true) {
  if (!loaderEl) return;
  loaderEl.classList.toggle('hidden', !on);
  loaderEl.setAttribute('aria-hidden', on ? 'false' : 'true');
}

// --- Panneau Filtres ---
const btnFilter = document.querySelector('.filters'); // <section class="filters" id="filter-open">
const panel     = document.getElementById('filter-panel');
const overlay   = document.getElementById('filter-overlay');
const btnClose  = document.getElementById('filter-close');
const btnReset  = document.getElementById('filter-reset');

function openFilter() {
  panel?.classList.add('open');
  overlay?.classList.add('open');
  // C.2 : scroll-lock du body
  document.body.classList.add('body-lock');
}
function closeFilter() {
  panel?.classList.remove('open');
  overlay?.classList.remove('open');
  // C.2 : retire le scroll-lock
  document.body.classList.remove('body-lock');
}

btnFilter?.addEventListener('click', openFilter);
btnClose?.addEventListener('click', closeFilter);
overlay?.addEventListener('click', closeFilter);

// --- App Rides ---
(() => {
  const API_BASE_URL = window.API_BASE_URL ?? 'http://localhost:8080';

  const list   = document.querySelector('#rides-list');
  const status = document.querySelector('#rides-status');
  const toast  = document.querySelector('#toast');
  if (!list) return;

  const esc = s => String(s).replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
  );

  function showToast(msg, type = 'ok') {
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    setTimeout(() => (toast.className = 'toast'), 1900);
  }

  // --- Sélecteurs filtres ---
  const inpOrigin      = document.getElementById('filter-origin');
  const inpDestination = document.getElementById('filter-destination');
  const inpDate        = document.getElementById('filter-date');
  const inpSeatsMin    = document.getElementById('filter-seats-min');
  const inpDurationMax = document.getElementById('duration-range'); // minutes
  const inpRatingMin   = document.getElementById('rating-range');   // étoiles 0..5
  const durValue       = document.getElementById('duration-value');
  const rateValue      = document.getElementById('rating-value');

  // On réutilise le slider prix comme "credits_max"
  const inpCreditsMax  = document.getElementById('price-range');
  const priceValue     = document.getElementById('price-value');
  const btnApply       = document.getElementById('filter-apply');

  // --- Tri ---
  const selSortBy  = document.getElementById('sort-by');    // date | price | seats | duration
  const selSortOrd = document.getElementById('sort-order'); // ASC | DESC

  // Construit les paramètres actuels (filtres + tri)
  function getCurrentParams() {
    return {
      origin:       inpOrigin?.value,
      destination:  inpDestination?.value,
      date_from:    inpDate?.value,
      seats_min:    inpSeatsMin?.value,
      credits_max:  (inpCreditsMax && Number(inpCreditsMax.value) > 0) ? inpCreditsMax.value : undefined,
      duration_max: (inpDurationMax && Number(inpDurationMax.value) > 0) ? inpDurationMax.value : undefined,
      rating_min:   (inpRatingMin && Number(inpRatingMin.value)   > 0) ? inpRatingMin.value   : undefined,
      sort_by:      selSortBy?.value || 'date',
      order:        selSortOrd?.value || 'ASC'
    };
  }

  // === C.2 : loader pendant le chargement ===
  async function loadRides(params = {}) {
    if (status) status.textContent = 'Chargement...';
    showLoader(true);

    const qs = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && String(v).trim() !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const url = `${API_BASE_URL}/api/rides${qs ? '?' + qs : ''}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rides = await res.json();

      if (!Array.isArray(rides) || rides.length === 0) {
        list.innerHTML = '<li>Aucun trajet pour le moment.</li>';
      } else {
        list.innerHTML = rides.map(r => {
          const disabled = r.seats <= 0 ? 'disabled' : '';
          const label    = r.seats <= 0 ? 'Complet'   : 'Réserver';
          return `
            <li class="ride">
              <div class="left">
                <div class="route"><strong>${esc(r.origin)} → ${esc(r.destination)}</strong></div>
                <div class="meta">
                  ${esc(r.date_time)} • ${r.seats} place${r.seats>1?'s':''}
                  ${r.duration_minutes ? ` • ${r.duration_minutes} min` : ''}
                  ${Number.isInteger(r.driver_rating) ? ` • ★${r.driver_rating}` : ''}
                  ${r.vehicle_brand ? ` • ${esc(r.vehicle_brand)} ${esc(r.vehicle_model || '')}` : ''}
                </div>
              </div>
              <div class="right">
                <div class="price">${Number(r.credits ?? r.price).toFixed(0)} crédits</div>
                <div class="actions">
                  <a class="btn secondary" href="../Html/Détail-covoiturage.html?id=${r.id}">Détails</a>
                  <button class="btn" data-ride="${r.id}" ${disabled}>${label}</button>
                </div>
              </div>
            </li>`;
        }).join('');
      }
    } catch (err) {
      console.error('GET /api/rides failed', err);
      list.innerHTML = '<li>Impossible de charger les trajets.</li>';
    } finally {
      if (status) status.textContent = '';
      showLoader(false);
    }
  }

  // --- Réservation (délégation de clic) ---
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn[data-ride]');
    if (!btn) return;

    const rideId = Number(btn.dataset.ride);
    const name  = prompt('Votre nom ?');
    const email = prompt('Votre email ?');
    if (!name || !email) return;

    btn.disabled = true;
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ride_id: rideId, name, email })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showToast('Réservation enregistrée ✅', 'ok');
        await loadRides(getCurrentParams()); // refresh en conservant filtres/tri
      } else if (res.status === 409 && data.error === 'Ride full') {
        showToast('Trajet complet', 'err');
        await loadRides(getCurrentParams());
      } else if (res.status === 409 && data.error === 'Already booked') {
        showToast('Vous avez déjà réservé ce trajet', 'err');
      } else if (res.status === 404) {
        showToast('Trajet introuvable', 'err');
        await loadRides(getCurrentParams());
      } else if (res.status === 422) {
        showToast('Données invalides', 'err');
      } else {
        showToast(data.error || 'Erreur de réservation', 'err');
      }
    } catch (err) {
      showToast('Serveur indisponible', 'err');
    } finally {
      btn.disabled = false;
    }
  });

  // --- Appliquer les filtres ---
  btnApply?.addEventListener('click', async () => {
    await loadRides(getCurrentParams());
    closeFilter();
  });

  // --- Réinitialiser filtres (et MAJ affichage sliders) ---
  btnReset?.addEventListener('click', async () => {
    if (inpOrigin)      inpOrigin.value = '';
    if (inpDestination) inpDestination.value = '';
    if (inpDate)        inpDate.value = '';
    if (inpSeatsMin)    inpSeatsMin.value = '';
    if (inpCreditsMax)  { inpCreditsMax.value = '0'; if (priceValue) priceValue.textContent = '0'; }
    if (inpDurationMax) { inpDurationMax.value = '0'; if (durValue)  durValue.textContent  = '0'; }
    if (inpRatingMin)   { inpRatingMin.value   = '0'; if (rateValue) rateValue.textContent = '0'; }
    await loadRides(getCurrentParams()); // garde le tri choisi
    closeFilter();
  });

  // --- helpers sliders (prix/durée/note) ---
  function bindRange(rangeId, outId) {
    const range = document.getElementById(rangeId);
    const out   = document.getElementById(outId);
    if (!range || !out) return;
    const update = () => { out.textContent = range.value; };
    update(); // valeur initiale
    range.addEventListener('input', update);
    range.addEventListener('change', update);
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindRange('price-range',    'price-value');    // crédits max
    bindRange('duration-range', 'duration-value'); // minutes
    bindRange('rating-range',   'rating-value');   // étoiles
  });

  // --- Changement de tri : recharge immédiate
  const applyCurrentFilters = () => loadRides(getCurrentParams());
  selSortBy?.addEventListener('change', applyCurrentFilters);
  selSortOrd?.addEventListener('change', applyCurrentFilters);

  // 1er chargement : tri par date croissant par défaut
  document.addEventListener('DOMContentLoaded', () => {
    if (selSortBy && !selSortBy.value)  selSortBy.value  = 'date';
    if (selSortOrd && !selSortOrd.value) selSortOrd.value = 'ASC';
    loadRides(getCurrentParams());
  });
})();
