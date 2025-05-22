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