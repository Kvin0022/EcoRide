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

// On récupère tous les boutons “btn-aside”
    const tabsBtns = document.querySelectorAll('.sidebar-nav .btn-aside');

// On récupère tout le contenu à afficher/masquer
    const tabsContent = document.querySelectorAll('.tab-content');

    tabsBtns.forEach(btn => {
        btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;  // ex: "tab-driver"

// 1) On retire la classe active de tous les contenus
    tabsContent.forEach(sec => sec.classList.remove('active'));

// 2) On ajoute la classe active à la section ciblée
document.getElementById(targetId).classList.add('active');

// 3) On retire la classe active de tous les boutons
    tabsBtns.forEach(b => b.classList.remove('active'));
    
// 4) On ajoute la classe active au bouton cliqué
    btn.classList.add('active');
    });
});

const btn = document.getElementById("open-vehicle-modal");
const modal = document.getElementById("vehicle-modal");
const close = modal.querySelector(".modal-close");

btn.addEventListener("click", ()=> modal.classList.add("active"));
close.addEventListener("click", ()=> modal.classList.remove("active"));
modal.addEventListener("click", e => {
    if(e.target === modal) modal.classList.remove("active");
    });

// ------------------------
// Modal “Ajouter une préférence”
// ------------------------
const openPrefBtn = document.getElementById('open-pref-modal');
const prefModal   = document.getElementById('pref-modal');
const closePrefBtn = prefModal.querySelector('.modal-close');

openPrefBtn.addEventListener('click', () => {
    prefModal.classList.add('active');
});

closePrefBtn.addEventListener('click', () => {
    prefModal.classList.remove('active');
});

// Fermer si on clique en dehors de .modal-content
prefModal.addEventListener('click', e => {
    if (e.target === prefModal) {
        prefModal.classList.remove('active');
    }
});

// (Optionnel) Soumission du formulaire de préf
document.getElementById('pref-form').addEventListener('submit', e => {
    e.preventDefault();
    const val = document.getElementById('new-pref').value.trim();
    if (!val) return;
// ici, vous pourriez ajouter la nouvelle préférence en DOM
// ou lancer votre appel API…
    console.log('Nouvelle préférence créée :', val);
    prefModal.classList.remove('active');
    e.target.reset();
});

// Définition des modèles par marque
const modelsByBrand = {
    seat:    ['Ibiza', 'Leon', 'Arona'],
    mercedes:['Classe A', 'Classe C', 'GLA'],
    bmw:     ['Série 1', 'Série 3', 'X1'],
    citroen: ['C3', 'C4', 'C5 Aircross'],
    renault: ['Clio', 'Mégane', 'Captur'],
    peugeot:['208', '308', '2008']
};

//  Référence aux deux <select>
const brandSelect = document.getElementById('brand');
const modelSelect = document.getElementById('model');

//  À chaque changement de marque, on reconstruit la liste des <option> de modèles
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
});