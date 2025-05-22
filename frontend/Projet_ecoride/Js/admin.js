const ridesCtx = document.getElementById('rides-chart').getContext('2d');
new Chart(ridesCtx, {
    type: 'line',
    data: {
        labels: ['01/06','02/06','03/06','04/06','05/06'],
        datasets: [{ label:'Covoiturages/jour', data:[5,8,6,9,7], fill:false }]
    },
    options:{ scales:{ y:{ beginAtZero:true } } }
});

const creditsCtx = document.getElementById('credits-chart').getContext('2d');
new Chart(creditsCtx, {
    type: 'bar',
    data: {
        labels: ['01/06','02/06','03/06','04/06','05/06'],
        datasets: [{ label:'Crédits', data:[40,64,48,72,56] }]
    },
    options:{ scales:{ y:{ beginAtZero:true } } }
});

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
