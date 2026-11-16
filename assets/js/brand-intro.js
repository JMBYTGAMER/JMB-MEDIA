/* JMB MEDIA — one-time cinematic brand reveal */
(function(){
  "use strict";

  if (window.__jmbMediaIntroActive) return;
  var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  try {
    if (sessionStorage.getItem("jmb-media-intro-seen") === "1") return;
    sessionStorage.setItem("jmb-media-intro-seen", "1");
  } catch (error) {
    if (window.__jmbMediaIntroSeen) return;
    window.__jmbMediaIntroSeen = true;
  }

  if (!document.body) return;
  window.__jmbMediaIntroActive = true;

  var previousFocus = document.activeElement;
  var oldHtmlOverflow = document.documentElement.style.overflow;
  var oldBodyOverflow = document.body.style.overflow;
  var layer = document.createElement("div");
  layer.className = "jmb-brand-intro" + (reducedMotion ? " is-reduced" : "");
  layer.setAttribute("role", "dialog");
  layer.setAttribute("aria-modal", "true");
  layer.setAttribute("aria-label", "Welcome to JMB MEDIA");
  layer.innerHTML =
    '<div class="jmb-intro-ambient" aria-hidden="true">' +
      '<div class="jmb-intro-nebula"></div>' +
      '<div class="jmb-intro-grid"></div>' +
      '<div class="jmb-intro-portal"></div>' +
      '<div class="jmb-intro-beam"></div>' +
    '</div>' +
    '<div class="jmb-intro-particles" aria-hidden="true"></div>' +
    '<div class="jmb-intro-core">' +
      '<div class="jmb-intro-topline"><i class="jmb-intro-live-dot"></i> THE JMB MEDIA EXPERIENCE</div>' +
      '<div class="jmb-intro-logo-stage" aria-hidden="true">' +
        '<div class="jmb-intro-logo-halo"></div>' +
        '<div class="jmb-intro-logo-orbit orbit-two"></div>' +
        '<div class="jmb-intro-logo-orbit"></div>' +
        '<div class="jmb-intro-logo-frame"><img class="jmb-intro-logo" src="/favicon/jmb-logo.svg?v=10" alt="" width="512" height="512" decoding="async"></div>' +
        '<i class="jmb-intro-spark spark-a"></i><i class="jmb-intro-spark spark-b"></i>' +
      '</div>' +
      '<div class="jmb-intro-title">JMB <span>MEDIA</span></div>' +
      '<p class="jmb-intro-subtitle">WATCH&nbsp; · &nbsp;READ&nbsp; · &nbsp;LISTEN</p>' +
      '<div class="jmb-intro-progress-wrap"><span class="jmb-intro-progress-caption">CONNECTING YOUR WORLD</span><div class="jmb-intro-progress" aria-hidden="true"></div></div>' +
      '<div class="jmb-intro-footer"><span>WATCH</span><i>•</i><span>READ</span><i>•</i><span>LISTEN</span></div>' +
    '</div>' +
    '<button class="jmb-intro-skip" type="button">SKIP INTRO&nbsp; ↗</button>';

  document.body.appendChild(layer);
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.classList.add("jmb-intro-lock");

  var particles = layer.querySelector(".jmb-intro-particles");
  var fragment = document.createDocumentFragment();
  for (var i = 0; i < 28; i++) {
    var dot = document.createElement("span");
    var left = 5 + Math.random() * 90;
    var top = 7 + Math.random() * 86;
    var size = 1 + Math.random() * 2.2;
    var delay = Math.random() * 2.2;
    var duration = 2.8 + Math.random() * 3.5;
    dot.style.setProperty("--x", left.toFixed(2) + "%");
    dot.style.setProperty("--y", top.toFixed(2) + "%");
    dot.style.setProperty("--size", size.toFixed(2) + "px");
    dot.style.setProperty("--delay", delay.toFixed(2) + "s");
    dot.style.setProperty("--duration", duration.toFixed(2) + "s");
    dot.style.setProperty("--drift", (Math.random() * 22 - 11).toFixed(1) + "px");
    dot.style.setProperty("--opacity", (0.35 + Math.random() * 0.55).toFixed(2));
    fragment.appendChild(dot);
  }
  particles.appendChild(fragment);

  var finished = false;
  var timer;
  var skipButton = layer.querySelector(".jmb-intro-skip");

  function finish(){
    if (finished) return;
    finished = true;
    window.clearTimeout(timer);
    document.removeEventListener("keydown", onKeydown);
    layer.classList.add("is-leaving");
    window.setTimeout(function(){
      if (layer.parentNode) layer.parentNode.removeChild(layer);
      document.documentElement.style.overflow = oldHtmlOverflow;
      document.body.style.overflow = oldBodyOverflow;
      document.body.classList.remove("jmb-intro-lock");
      window.__jmbMediaIntroActive = false;
      if (previousFocus && previousFocus !== document.body && typeof previousFocus.focus === "function") {
        try { previousFocus.focus({preventScroll:true}); } catch (error) { previousFocus.focus(); }
      }
    }, reducedMotion ? 80 : 660);
  }

  function onKeydown(event){
    if (event.key === "Escape") {
      event.preventDefault();
      finish();
    }
  }

  skipButton.addEventListener("click", finish);
  layer.addEventListener("click", function(event){
    if (event.target === layer) finish();
  });
  document.addEventListener("keydown", onKeydown);
  try { skipButton.focus({preventScroll:true}); } catch (error) { skipButton.focus(); }

  timer = window.setTimeout(finish, reducedMotion ? 1150 : 3950);
})();