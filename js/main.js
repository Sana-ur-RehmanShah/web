/* =========================================================
   SunnyShoots — main.js
   Entry point. Orchestrates initialization of the animation
   and interaction modules once the DOM is ready.
   No animation or interaction logic should live in this file —
   it only calls into SunnyShoots.animations / SunnyShoots.interactions.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  // Order matters: interactions.init() renders dynamic content
  // (testimonials, featured work, portfolio) synchronously from
  // JSON. animations.init() must run AFTER that so its
  // IntersectionObserver for .reveal-up picks up those elements
  // too, not just the ones present in the static HTML.
  if (window.SunnyShoots && window.SunnyShoots.interactions) {
    window.SunnyShoots.interactions.init();
  }

  if (window.SunnyShoots && window.SunnyShoots.animations) {
    window.SunnyShoots.animations.init();
  }
});
