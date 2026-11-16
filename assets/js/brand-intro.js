/* JMB MEDIA — real page loading screen (shown on every page load) */
(function(){
  "use strict";

  if (!document.body || window.__jmbLoadingScreenActive) return;
  window.__jmbLoadingScreenActive = true;

  var startedAt = Date.now();
  var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var minimumVisible = reducedMotion ? 450 : 850;
  var maximumVisible = 5200;
  var finished = false;
  var hideTimer = 0;
  var fallbackTimer = 0;
  var loadComplete = document.readyState === "complete";

  var screen = document.createElement("div");
  screen.className = "jmb-loading-screen";
  screen.setAttribute("role", "status");
  screen.setAttribute("aria-live", "polite");
  screen.setAttribute("aria-label", "Loading JMB MEDIA");
  screen.innerHTML =
    '<div class="jmb-loading-ambient" aria-hidden="true"></div>' +
    '<div class="jmb-loading-content">' +
      '<div class="jmb-loading-logo-wrap">' +
        '<span class="jmb-loading-orbit" aria-hidden="true"></span>' +
        '<div class="jmb-loading-logo-frame">' +
          '<img src="/favicon/jmb-logo.svg?v=10" alt="" width="512" height="512" decoding="async">' +
        '</div>' +
      '</div>' +
      '<div class="jmb-loading-brand">JMB <span>MEDIA</span></div>' +
      '<div class="jmb-loading-tagline">WATCH <i>·</i> READ <i>·</i> LISTEN</div>' +
      '<div class="jmb-loading-indicator">' +
        '<div class="jmb-loading-track"><span></span></div>' +
        '<div class="jmb-loading-status"><span class="jmb-loading-dot"></span> PREPARING YOUR EXPERIENCE</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(screen);
  document.body.classList.add("jmb-loading-lock");

  function removeScreen(){
    if (finished) return;
    finished = true;
    window.clearTimeout(hideTimer);
    window.clearTimeout(fallbackTimer);
    window.removeEventListener("load", onLoad);
    screen.classList.add("is-hiding");

    window.setTimeout(function(){
      if (screen.parentNode) screen.parentNode.removeChild(screen);
      document.body.classList.remove("jmb-loading-lock");
      window.__jmbLoadingScreenActive = false;
    }, reducedMotion ? 80 : 430);
  }

  function scheduleHide(){
    if (!loadComplete || finished) return;
    var elapsed = Date.now() - startedAt;
    var remaining = Math.max(0, minimumVisible - elapsed);
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(removeScreen, remaining);
  }

  function onLoad(){
    loadComplete = true;
    scheduleHide();
  }

  window.addEventListener("load", onLoad, { once: true });

  if (loadComplete) scheduleHide();

  fallbackTimer = window.setTimeout(function(){
    /* Never leave the interface covered if a remote resource hangs. */
    removeScreen();
  }, maximumVisible);
})();