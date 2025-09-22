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
  document.body.classList.add('body-lock');
}
function closeFilter() {
  panel?.classList.remove('open');
  overlay?.classList.remove('open');
  document.body.classList.remove('body-lock');
}

btnFilter?.addEventListener('click', openFilter);
btnClose?.addEventListener('click', closeFilter);
overlay?.addEventListener('click', closeFilter);

// --- App Rides ---
(() => {
  const API_BASE_URL = window.API_BASE_URL ?? 'https://ecoride-production-0838.up.railway.app';


  const list   = document.querySelector('#rides-list');
  const status = document.querySelector('#rides-status');
  const toast  = document.querySelector('#toast');
  if (!list) return;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, m =>
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
  const inpDate        = document.getElementById('filter-date');      // YYYY-MM-DD (→ API: date_from)
  const inpSeatsMin    = document.getElementById('filter-seats-min');
  const inpDurationMax = document.getElementById('duration-range');   // minutes
  const inpRatingMin   = document.getElementById('rating-range');     // étoiles 0..5
  const durValue       = document.getElementById('duration-value');
  const rateValue      = document.getElementById('rating-value');

  // slider prix = "credits_max"
  const inpCreditsMax  = document.getElementById('price-range');
  const priceValue     = document.getElementById('price-value');
  const btnApply       = document.getElementById('filter-apply');

  // écolo : peut être un input[type=checkbox] OU un bouton
  const ecoBtn = document.getElementById('filter-eco');

  // --- Tri ---
  const selSortBy  = document.getElementById('sort-by');    // date | price | seats | duration
  const selSortOrd = document.getElementById('sort-order'); // ASC | DESC

  /* =========== ECO helpers (support bouton OU checkbox) =========== */
  let ecoOn = false; // état interne unique

  function isCheckbox(el) {
    return !!el && el.tagName === 'INPUT' && el.type === 'checkbox';
  }

  function setEcoUI(on) {
    ecoOn = !!on;
    // bouton (classe active + aria-pressed)
    ecoBtn?.classList.toggle('active', ecoOn);
    ecoBtn?.setAttribute('aria-pressed', ecoOn ? 'true' : 'false');
    // checkbox (si c'en est une)
    if (isCheckbox(ecoBtn)) ecoBtn.checked = ecoOn;
  }

  function ecoState() {
    // si c'est une checkbox, on suit sa valeur ; sinon l'état interne
    return isCheckbox(ecoBtn) ? !!ecoBtn.checked : ecoOn;
  }

  // si checkbox → garder l'état en phase quand on (dé)coche, sans fetch
  if (isCheckbox(ecoBtn)) {
    ecoBtn.addEventListener('change', () => setEcoUI(!!ecoBtn.checked));
  }

  // si bouton → bascule visuelle sans fetch
  ecoBtn && !isCheckbox(ecoBtn) && ecoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    setEcoUI(!ecoOn);
  });

  // --- URL <-> UI (helpers unifiés) ---
  function writeParamsToURL(params, replace = false) {
    const url = new URL(window.location.href);
    // nettoie d’abord les clés connues
    ['origin','destination','date_from','seats_min','credits_max','duration_max','rating_min','sort_by','order','eco']
      .forEach(k => url.searchParams.delete(k));

    // écrit uniquement les valeurs non vides
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && String(v).trim() !== '') url.searchParams.set(k, v);
    });

    const newUrl = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
    (replace ? history.replaceState : history.pushState).call(history, null, '', newUrl);
  }

  // Remplit les champs depuis l’URL et renvoie les params à utiliser
  function readParamsFromURL() {
    const sp = new URLSearchParams(location.search);

    if (inpOrigin)       inpOrigin.value       = sp.get('origin')      || '';
    if (inpDestination)  inpDestination.value  = sp.get('destination') || '';
    if (inpDate)         inpDate.value         = sp.get('date_from')   || '';
    if (inpSeatsMin)     inpSeatsMin.value     = sp.get('seats_min')   || '';

    if (inpCreditsMax) {
      inpCreditsMax.value = sp.get('credits_max') || '0';
      if (priceValue) priceValue.textContent = inpCreditsMax.value;
    }
    if (inpDurationMax) {
      inpDurationMax.value = sp.get('duration_max') || '0';
      if (durValue) durValue.textContent = inpDurationMax.value;
    }
    if (inpRatingMin) {
      inpRatingMin.value = sp.get('rating_min') || '0';
      if (rateValue) rateValue.textContent = inpRatingMin.value;
    }

    if (selSortBy)  selSortBy.value  = sp.get('sort_by') || 'date';
    if (selSortOrd) selSortOrd.value = sp.get('order')   || 'ASC';

    // sync eco visuel depuis l’URL
    setEcoUI(sp.get('eco') === '1' || sp.get('eco') === 'true');

    return getCurrentParams();
  }

  // Construit les paramètres actuels (filtres + tri)
  function getCurrentParams() {
    return {
      origin:       inpOrigin?.value,
      destination:  inpDestination?.value,
      date_from:    inpDate?.value, // l’API supporte date_from
      seats_min:    inpSeatsMin?.value,
      credits_max:  (inpCreditsMax && Number(inpCreditsMax.value) > 0) ? inpCreditsMax.value : undefined,
      duration_max: (inpDurationMax && Number(inpDurationMax.value) > 0) ? inpDurationMax.value : undefined,
      rating_min:   (inpRatingMin && Number(inpRatingMin.value)   > 0) ? inpRatingMin.value   : undefined,
      sort_by:      selSortBy?.value || 'date',
      order:        selSortOrd?.value || 'ASC',
      eco:          ecoState() ? 1 : undefined, // ← état écolo combiné
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
          const seatsLeft = Number.isFinite(r.seats_left) ? r.seats_left : r.seats; // fallback
          const disabled  = seatsLeft <= 0 ? 'disabled' : '';
          const label     = seatsLeft <= 0 ? 'Complet'   : 'Réserver';
          const price     = Number(r.credits ?? r.price);
          const brand     = r.vehicle_brand ? `${esc(r.vehicle_brand)} ${esc(r.vehicle_model || '')}` : '';

          return `
            <li class="ride">
              <div class="left">
                <div class="route"><strong>${esc(r.origin)} → ${esc(r.destination)}</strong></div>
                <div class="meta">
                  ${esc(r.date_time)} • ${seatsLeft} place${seatsLeft>1?'s':''}
                  ${r.duration_minutes ? ` • ${r.duration_minutes} min` : ''}
                  ${Number.isInteger(r.driver_rating) ? ` • ★${r.driver_rating}` : ''}
                  ${brand ? ` • ${brand}` : ''}
                  ${r.energy === 'electric' ? ' • 🌱' : ''}
                </div>
              </div>
              <div class="right">
                <div class="price">${Number.isFinite(price) ? price.toFixed(0) : '-'} crédits</div>
                <div class="actions">
                  <a class="btn secondary" href="../Html/Detail-covoiturage.html?id=${r.id}">Détails</a>
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
      } else if (res.status === 409 && (data.error === 'Ride full' || data.error === 'Ride Full')) {
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
    const params = getCurrentParams();
    writeParamsToURL(params);          // <-- maj URL
    await loadRides(params);
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

    setEcoUI(false); // ← OFF pour le bouton/checkbox écolo

    const params = getCurrentParams(); // ne garde que tri si présent
    writeParamsToURL(params);          // <-- maj URL
    await loadRides(params);
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
  const applyCurrentFilters = () => {
    const params = getCurrentParams();
    writeParamsToURL(params);          // <-- maj URL
    loadRides(params);
  };
  selSortBy?.addEventListener('change', applyCurrentFilters);
  selSortOrd?.addEventListener('change', applyCurrentFilters);

  // Initialisation : on lit l’URL, on complète les champs, défauts de tri si manquants
  document.addEventListener('DOMContentLoaded', () => {
    const p = readParamsFromURL();

    if (selSortBy && !p.sort_by)  selSortBy.value  = 'date';
    if (selSortOrd && !p.order)   selSortOrd.value = 'ASC';

    writeParamsToURL(getCurrentParams(), true);  // true = replaceState (pas d’historique en plus)
    loadRides(getCurrentParams());
  });

  // Support bouton “précédent/suivant” du navigateur
  window.addEventListener('popstate', () => {
    readParamsFromURL();
    loadRides(getCurrentParams());
  });

})();
