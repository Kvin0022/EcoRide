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

// on récupère les éléments
const btnFilter     = document.querySelector('.filters');
const panel         = document.getElementById('filter-panel');
const overlay       = document.getElementById('filter-overlay');
const btnClose      = document.getElementById('filter-close');
const btnReset      = document.getElementById('filter-reset');

// fonction pour ouvrir
function openFilter() {
    panel.classList.add('open');
    overlay.classList.add('open');
}

// fonction pour fermer
function closeFilter() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
}

// événements
btnFilter.addEventListener('click', openFilter);
btnClose.addEventListener('click', closeFilter);
overlay.addEventListener('click', closeFilter);
btnReset.addEventListener('click', () => {
  // ici tu remets à zéro tes inputs/radios/sliders…
    closeFilter();
});

(() => {
  const API_BASE_URL = window.API_BASE_URL ?? 'http://localhost:8080';

  const list   = document.querySelector('#rides-list');
  const status = document.querySelector('#rides-status');
  const toast  = document.querySelector('#toast');
  if (!list) return;

  const esc = s => String(s).replace(/[&<>"']/g, m =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])
  );

  function showToast(msg, type='ok'){
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    setTimeout(()=> toast.className='toast', 1900);
  }

  async function loadRides(params = {}) {
    if (status) status.textContent = 'Chargement...';

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
          const label    = r.seats <= 0 ? 'Complet' : 'Réserver';
          return `
            <li class="ride">
              <div class="left">
                <div class="route"><strong>${esc(r.origin)} → ${esc(r.destination)}</strong></div>
                <div class="meta">${esc(r.date_time)} • ${r.seats} place${r.seats>1?'s':''}</div>
              </div>
              <div class="right">
                <div class="price">${Number(r.credits ?? r.price).toFixed(0)} crédits</div>
                <button class="btn" data-ride="${r.id}" ${disabled}>${label}</button>
              </div>
            </li>`;
        }).join('');
      }
    } catch (err) {
      console.error('GET /api/rides failed', err);
      list.innerHTML = '<li>Impossible de charger les trajets.</li>';
    } finally {
      if (status) status.textContent = '';
    }
  }


// Délégateur de clic pour réserver
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn[data-ride]');
  if (!btn) return;

  const rideId = Number(btn.dataset.ride);
  const name  = prompt("Votre nom ?");
  const email = prompt("Votre email ?");
  if (!name || !email) return;

  btn.disabled = true;
  try {
    const res = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ ride_id: rideId, name, email })
    });
    const data = await res.json().catch(()=> ({}));

    if (res.ok) {
      showToast('Réservation enregistrée ✅', 'ok');
      await loadRides();                       // refresh seats
    } else if (res.status === 409 && data.error === 'Ride full') {
      showToast('Trajet complet', 'err');
      await loadRides();                       // refresh seats
    } else if (res.status === 409 && data.error === 'Already booked') {
      showToast('Vous avez déjà réservé ce trajet', 'err');
    } else if (res.status === 404) {
      showToast('Trajet introuvable', 'err');
      await loadRides();
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

const inpOrigin      = document.getElementById('filter-origin');
const inpDestination = document.getElementById('filter-destination');
const inpDate        = document.getElementById('filter-date');
const inpSeatsMin    = document.getElementById('filter-seats-min');
const inpCreditsMax  = document.getElementById('filter-credits-max');
const btnApply       = document.getElementById('filter-apply');

btnApply?.addEventListener('click', async () => {
  const params = {
    origin:       inpOrigin?.value,
    destination:  inpDestination?.value,
    date_from:    inpDate?.value,        // backend attend date_from
    seats_min:    inpSeatsMin?.value,
    credits_max:  inpCreditsMax?.value
  };
  await loadRides(params);
  closeFilter();
});

btnReset?.addEventListener('click', async () => {
  if (inpOrigin)      inpOrigin.value = '';
  if (inpDestination) inpDestination.value = '';
  if (inpDate)        inpDate.value = '';
  if (inpSeatsMin)    inpSeatsMin.value = '';
  if (inpCreditsMax)  inpCreditsMax.value = '';
  await loadRides({});
  closeFilter();
});

// première charge sans filtre
document.addEventListener('DOMContentLoaded', () => loadRides({}));

  document.addEventListener('DOMContentLoaded', loadRides);
})();


