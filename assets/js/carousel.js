/* === APA NYM TechComm — Hero Carousel === */

(function () {
  'use strict';

  const track = document.querySelector('.hero-track');
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  const prevBtn = document.querySelector('.hero-btn-prev');
  const nextBtn = document.querySelector('.hero-btn-next');
  const heroEl = document.querySelector('.hero');

  if (!track || slides.length === 0) return;

  let current = 0;
  let autoTimer = null;
  const INTERVAL = 6000;

  function goTo(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    current = index;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    dots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === current);
      dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
    });
  }

  function next() {
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(next, INTERVAL);
  }

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  // Buttons
  if (prevBtn) prevBtn.addEventListener('click', function () { prev(); startAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { next(); startAuto(); });

  // Dots
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () { goTo(i); startAuto(); });
  });

  // Pause on hover
  if (heroEl) {
    heroEl.addEventListener('mouseenter', stopAuto);
    heroEl.addEventListener('mouseleave', startAuto);
  }

  // Keyboard navigation
  document.addEventListener('keydown', function (e) {
    if (!heroEl) return;
    var rect = heroEl.getBoundingClientRect();
    var inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;

    if (e.key === 'ArrowLeft') { prev(); startAuto(); e.preventDefault(); }
    if (e.key === 'ArrowRight') { next(); startAuto(); e.preventDefault(); }
  });

  // Touch swipe
  var touchStartX = 0;
  var touchEndX = 0;

  if (heroEl) {
    heroEl.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    heroEl.addEventListener('touchend', function (e) {
      touchEndX = e.changedTouches[0].screenX;
      var diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) next(); else prev();
        startAuto();
      }
    }, { passive: true });
  }

  // Init
  goTo(0);
  startAuto();
})();