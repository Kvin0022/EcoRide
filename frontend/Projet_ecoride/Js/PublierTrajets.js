document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = window.API_BASE_URL ?? 'http://localhost:8080';

  const form = document.getElementById('publish-form');
  if (!form) return;

  const originEl = document.getElementById('publish_origin');
  const destEl   = document.getElementById('publish_destination');
  const dtEl     = document.getElementById('publish_date_time');
  const seatsEl  = document.getElementById('publish_seats');
  const credEl   = document.getElementById('publish_credits');
  const statusEl = document.getElementById('publish-status');
  const errorEl  = document.getElementById('publish-error');

  const toSql = v => v ? v.replace('T',' ') + (v.length === 16 ? ':00' : '') : '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    statusEl.textContent = 'Publication en cours...';

    const payload = {
      origin:      originEl.value.trim(),
      destination: destEl.value.trim(),
      date_time:   toSql(dtEl.value),
      seats:       Number(seatsEl.value),
      price:       Number(credEl.value)      // <-- on envoie "price" = crédits
      // Optionnel: credits: Number(credEl.value)  // si tu ajoutes l’alias côté back
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/rides`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        statusEl.textContent = 'Trajet publié ✅';
        form.reset();
      } else {
        statusEl.textContent = '';
        errorEl.textContent = data.error || 'Publication impossible';
      }
    } catch (err) {
      statusEl.textContent = '';
      errorEl.textContent = 'Serveur indisponible';
    }
  });
});
