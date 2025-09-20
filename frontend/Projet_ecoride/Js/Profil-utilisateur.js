// --- Burger menu ---
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

  document.addEventListener('DOMContentLoaded', () => {
  if (!window.EcoAuth?.requireAuth()) return; // redirige si non connecté
});


  // On récupère tous les boutons “btn-aside”
  const tabsBtns = document.querySelectorAll('.sidebar-nav .btn-aside');

  // On récupère tout le contenu à afficher/masquer
  const tabsContent = document.querySelectorAll('.tab-content');

  tabsBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target; // ex: "tab-driver"

      // 1) On retire la classe active de tous les contenus
      tabsContent.forEach(sec => sec.classList.remove('active'));

      // 2) On ajoute la classe active à la section ciblée
      document.getElementById(targetId)?.classList.add('active');

      // 3) On retire la classe active de tous les boutons
      tabsBtns.forEach(b => b.classList.remove('active'));

      // 4) On ajoute la classe active au bouton cliqué
      btn.classList.add('active');
    });
  });

  // ------------------------
  // Modal “Ajouter un véhicule”
  // ------------------------
  const btn = document.getElementById("open-vehicle-modal");
  const modal = document.getElementById("vehicle-modal");
  const close = modal?.querySelector(".modal-close");

  if (btn && modal && close) {
    btn.addEventListener("click", ()=> modal.classList.add("active"));
    close.addEventListener("click", ()=> modal.classList.remove("active"));
    modal.addEventListener("click", e => {
      if (e.target === modal) modal.classList.remove("active");
    });
  }

  // ------------------------
  // Modal “Ajouter une préférence”
  // ------------------------
  const openPrefBtn  = document.getElementById('open-pref-modal');
  const prefModal    = document.getElementById('pref-modal');
  const closePrefBtn = prefModal?.querySelector('.modal-close');

  if (openPrefBtn && prefModal && closePrefBtn) {
    openPrefBtn.addEventListener('click', () => {
      prefModal.classList.add('active');
    });
    closePrefBtn.addEventListener('click', () => {
      prefModal.classList.remove('active');
    });
    // Fermer si on clique en dehors de .modal-content
    prefModal.addEventListener('click', e => {
      if (e.target === prefModal) prefModal.classList.remove('active');
    });
  }

  // (Optionnel) Soumission du formulaire de préf
  const prefForm = document.getElementById('pref-form');
  if (prefForm) {
    prefForm.addEventListener('submit', e => {
      e.preventDefault();
      const val =
        document.getElementById('new-pref')?.value?.trim() ||
        document.getElementById('pref_name')?.value?.trim() || '';
      if (!val) return;
      console.log('Nouvelle préférence créée :', val);
      prefModal?.classList.remove('active');
      e.target.reset();
    });
  }

  // Définition des modèles par marque (pour la modale véhicule)
  const modelsByBrand = {
    seat:    ['Ibiza', 'Leon', 'Arona'],
    mercedes:['Classe A', 'Classe C', 'GLA'],
    bmw:     ['Série 1', 'Série 3', 'X1'],
    citroen: ['C3', 'C4', 'C5 Aircross'],
    renault: ['Clio', 'Mégane', 'Captur'],
    peugeot: ['208', '308', '2008']
  };

  //  Référence aux deux <select> (modale véhicule)
  const brandSelect = document.getElementById('brand');
  const modelSelect = document.getElementById('model');

  if (brandSelect && modelSelect) {
    brandSelect.addEventListener('change', () => {
      const brand = brandSelect.value;
      const models = modelsByBrand[brand] || [];

      // Vidage des anciennes options
      modelSelect.innerHTML = '<option value="" disabled selected>Modèle</option>';

      // Remplissage avec les nouveaux modèles
      models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.toLowerCase().replace(/\s+/g,'-'); // ex: 'Classe A' → 'classe-a'
        opt.textContent = m;
        modelSelect.appendChild(opt);
      });

      // On réactive le <select> si jamais on l'avait désactivé
      modelSelect.disabled = models.length === 0;
    });
  }
});

// ==============================
// Publier un trajet (+ véhicules)
// ==============================
(function () {
  const API_BASE_URL = window.API_BASE_URL ?? 'http://localhost:8080';

  const form = document.getElementById('publish-form');
  if (!form) return;

  const $ = id => document.getElementById(id);

  // Champs possibles (on supporte tes 2 conventions d'IDs)
  const elOrigin       = () => ($('#publish_origin')?.value?.trim()        ?? $('#departure_address')?.value?.trim()      ?? '');
  const elDestination  = () => ($('#publish_destination')?.value?.trim()   ?? $('#arrival_address')?.value?.trim()        ?? '');
  const elDateTime     = () => ($('#publish_date_time')?.value             ?? $('#departure_datetime')?.value             ?? '');
  const elSeatsInput   = () => ($('#publish_seats')                         ?? $('#seats_publish'));
  const elSeatsValue   = () => parseInt(elSeatsInput()?.value || '0', 10);
  const elCredits      = () => parseInt(($('#publish_credits')?.value      ?? $('#credits_per_passenger')?.value          ?? '0'), 10);
  const elDuration     = () => parseInt(($('#publish_duration')?.value     ?? $('#duration')?.value                       ?? '0'), 10);

  // Select véhicule (ajoute-le en HTML si pas encore fait)
  const selVehicle = $('#publish_vehicle');

  // Auto-remplir "places" selon véhicule choisi
  if (selVehicle) {
    selVehicle.addEventListener('change', () => {
      const opt = selVehicle.selectedOptions[0];
      const seats = opt ? parseInt(opt.getAttribute('data-seats') || '0', 10) : 0;
      const seatsInput = elSeatsInput();
      if (seatsInput && seats > 0) seatsInput.value = String(seats);
    });
  }

  // Peupler la liste des véhicules depuis l'API (par email)
  (async function populateVehicles() {
    if (!selVehicle) return;

    // Récup email (stocké au login ?)
    let email = localStorage.getItem('er_email') || '';
    if (!email) {
      email = prompt("Entrez votre email pour charger vos véhicules :") || '';
      if (email) localStorage.setItem('er_email', email);
    }
    if (!email) return;

    try {
      const r = await fetch(`${API_BASE_URL}/api/vehicles?email=${encodeURIComponent(email)}`);
      const rows = await r.json();

      // Reset options
      selVehicle.innerHTML = '<option value="">Sans véhicule</option>';

      if (Array.isArray(rows)) {
        rows.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.id;
          opt.textContent = `${v.brand} ${v.model} (${v.seats} places)`;
          opt.setAttribute('data-seats', v.seats);
          selVehicle.appendChild(opt);
        });
      }
    } catch (e) {
      // Silencieux : pas bloquant pour publier sans véhicule
      console.warn('Impossible de charger les véhicules', e);
    }
  })();

  // Soumission du trajet
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const origin       = elOrigin();
    const destination  = elDestination();
    const dateTime     = elDateTime();               // "YYYY-MM-DDTHH:MM"
    const seats        = elSeatsValue();             // ignoré si vehicle_id fourni
    const credits      = elCredits();
    const duration     = elDuration();
    const vehicle_id   = selVehicle && selVehicle.value ? Number(selVehicle.value) : undefined;

    // Contrôles simples côté front
    if (!origin || !destination || !dateTime || credits <= 0 || (!vehicle_id && seats <= 0)) {
      alert('Merci de compléter tous les champs obligatoires.');
      return;
    }

    // Payload pour l’API
    const payload = {
      origin,
      destination,
      date_time: dateTime,
      price: credits,                 // “crédits par passager” -> stocké en price
      duration_minutes: duration || 0
    };
    if (vehicle_id) payload.vehicle_id = vehicle_id;
    else            payload.seats = seats;           // requis si pas de véhicule

    try {
      const res = await fetch(`${API_BASE_URL}/api/rides`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert('Trajet publié ✅');
        form.reset();
        // Si vehicle sélectionné, on peut réappliquer les places du véhicule après reset (facultatif)
        // selVehicle.value = ''; // si tu veux vider la sélection
      } else if (res.status === 422) {
        alert(data.error || 'Champs manquants ou invalides.');
      } else {
        alert(data.error || 'Erreur serveur.');
      }
    } catch (err) {
      console.error(err);
      alert('Serveur indisponible.');
    }
  });
})();

// ==============================
// D) Modal "Ajouter un véhicule" -> API + refresh du select
// ==============================
(function () {
  const API = window.API_BASE_URL ?? 'http://localhost:8080';

  const formVeh     = document.getElementById('vehicle-form');   // <form id="vehicle-form"> dans la modale
  const modalVeh    = document.getElementById('vehicle-modal');  // overlay de la modale
  const closeVehBtn = modalVeh?.querySelector('.modal-close');   // bouton de fermeture
  const selVehicle  = document.getElementById('publish_vehicle'); // select du formulaire "Publiez un trajet"

  if (!formVeh) return;

  formVeh.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Email de l’utilisateur (pris du localStorage ou demandé)
    let email = localStorage.getItem('er_email') || '';
    if (!email) {
      email = prompt("Votre email pour enregistrer le véhicule ?") || '';
      if (email) localStorage.setItem('er_email', email);
    }
    if (!email) {
      alert('Email requis');
      return;
    }

    // Champs de la modale
    const brand = document.getElementById('brand')?.value.trim() || '';
    const model = document.getElementById('model')?.value.trim() || '';
    const seats = parseInt(document.getElementById('seats')?.value || '0', 10);
    const plate = document.getElementById('plate')?.value.trim() || '';

    if (!brand || !model || seats < 1 || seats > 7) {
      alert('Champs invalides (marque/modèle requis, places entre 1 et 7).');
      return;
    }

    try {
      // Création du véhicule
      const res = await fetch(`${API}/api/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ owner_email: email, brand, model, seats, plate })
      });
      const data = await res.json().catch(()=> ({}));

      if (!res.ok) {
        alert(data.error || 'Erreur serveur lors de la création du véhicule.');
        return;
      }

      // Rafraîchir le select "publish_vehicle"
      if (selVehicle) {
        const r = await fetch(`${API}/api/vehicles?email=${encodeURIComponent(email)}`);
        const rows = await r.json().catch(()=> []);
        selVehicle.innerHTML = '<option value="">Sans véhicule</option>';
        rows.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.id;
          opt.textContent = `${v.brand} ${v.model} (${v.seats} places)`;
          opt.setAttribute('data-seats', v.seats);
          selVehicle.appendChild(opt);
        });

        // Sélectionne le véhicule tout juste créé + auto-remplit "places"
        if (data.id) selVehicle.value = String(data.id);
        const seatsAttr = selVehicle.selectedOptions[0]?.getAttribute('data-seats');
        const seatsInput = document.getElementById('publish_seats') || document.getElementById('seats_publish');
        if (seatsInput && seatsAttr) seatsInput.value = String(seatsAttr);
      }

      // Nettoyage & fermeture modale
      formVeh.reset();
      if (closeVehBtn) closeVehBtn.click();
      alert('Véhicule ajouté ✅');

    } catch (err) {
      console.error(err);
      alert('Serveur indisponible');
    }
  });
})();

