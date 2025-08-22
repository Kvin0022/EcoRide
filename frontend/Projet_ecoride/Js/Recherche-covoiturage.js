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
  if (!list) return;

  const esc = s => String(s).replace(/[&<>"']/g, m =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])
  );

  async function loadRides() {
    if (status) status.textContent = 'Chargement...';
    try {
      const res = await fetch(`${API_BASE_URL}/api/rides`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rides = await res.json();

      if (!Array.isArray(rides) || rides.length === 0) {
        list.innerHTML = '<li>Aucun trajet pour le moment.</li>';
      } else {
        list.innerHTML = rides.map(r => `
          <li class="ride">
            <div class="left">
              <div class="route"><strong>${esc(r.origin)} → ${esc(r.destination)}</strong></div>
              <div class="meta">${esc(r.date_time)} • ${r.seats} place${r.seats > 1 ? 's' : ''}</div>
            </div>
            <div class="right">
              <div class="price">${Number(r.price).toFixed(2)} €</div>
              <button class="btn" data-ride="${r.id}">Réserver</button>
            </div>
          </li>
        `).join('');
      }
    } catch (err) {
      console.error('GET /api/rides failed', err);
      list.innerHTML = '<li>Impossible de charger les trajets.</li>';
    } finally {
      if (status) status.textContent = '';
    }
  }

  document.addEventListener('DOMContentLoaded', loadRides);
})();

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn[data-ride]');
  if (!btn) return;

  const rideId = Number(btn.dataset.ride);
  const name  = prompt("Votre nom ?");
  const email = prompt("Votre email ?");
  if (!name || !email) return;

  try {
    const res = await fetch(`${(window.API_BASE_URL ?? 'http://localhost:8080')}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ ride_id: rideId, name, email })
    });
    const data = await res.json();
    if (res.ok) alert('Réservation enregistrée ✅');
    else alert(data.error || 'Erreur de réservation');
  } catch (err) {
    alert('Serveur indisponible');
  }
});


