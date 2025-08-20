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

const overlay = document.getElementById('modal-overlay');
const btnParticiper = document.querySelector('.btn-participer');
const btnClose = document.querySelector('.modal-close');
const btnCancel = document.getElementById('btn-cancel');

function openModal() {
    overlay.style.display = 'flex';
}
function closeModal() {
    overlay.style.display = 'none';
}

btnParticiper.addEventListener('click', openModal);
btnClose.addEventListener('click', closeModal);
btnCancel.addEventListener('click', closeModal);

// ferme aussi en cliquant en dehors de la boîte
overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
});

document.addEventListener('DOMContentLoaded', () => {
  // participation modal existant…
    const btnAvis      = document.querySelector('.btn-avis');
    const revOverlay  = document.getElementById('reviews-overlay');
    const revCloses   = revOverlay.querySelectorAll('.modal-close, #btn-reviews-close');

    btnAvis.addEventListener('click', () => {
        revOverlay.classList.add('active');
    });

    revCloses.forEach(btn => {
        btn.addEventListener('click', () => {
        revOverlay.classList.remove('active');
        });

        // ferme la modale “reviews” au clic en dehors de la boîte
    revOverlay.addEventListener('click', e => {
    if (e.target === revOverlay) revOverlay.classList.remove('active');
    });
    });
});
