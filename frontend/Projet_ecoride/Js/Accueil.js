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

// on attend que le DOM soit prêt
document.addEventListener('DOMContentLoaded', () => {
    // on cible toutes les images des cartes
    const images = document.querySelectorAll('.card-img img');

    images.forEach(img => {
    img.addEventListener('mouseenter', () => {
        // on agrandit très légèrement
        img.style.transform = 'scale(1.05)';
    });
    img.addEventListener('mouseleave', () => {
        // on remet à l’échelle normale
        img.style.transform = 'scale(1)';
    });
    });
});