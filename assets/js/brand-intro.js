/* JMB MEDIA — once-per-tab cinematic brand reveal */
(function(){
  "use strict";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  try { if (sessionStorage.getItem("jmb-media-intro-seen") === "1") return; sessionStorage.setItem("jmb-media-intro-seen","1"); }
  catch(e) { if (window.__jmbMediaIntroSeen) return; window.__jmbMediaIntroSeen = true; }
  if (!document.body) return;
  var layer = document.createElement("div");
  layer.className = "jmb-brand-intro";
  layer.setAttribute("role","dialog");
  layer.setAttribute("aria-modal","true");
  layer.setAttribute("aria-label","Welcome to JMB MEDIA");
  layer.innerHTML =
    '<div class="jmb-intro-core">' +
      '<img class="jmb-intro-logo" src="/favicon/jmb-logo.svg?v=10" alt="JMB MEDIA" width="512" height="512">' +
      '<div class="jmb-intro-title"><span>JMB MEDIA</span></div>' +
      '<p class="jmb-intro-subtitle">WATCH&nbsp; · &nbsp;READ&nbsp; · &nbsp;LISTEN</p>' +
      '<div class="jmb-intro-rule" aria-hidden="true"></div>' +
    '</div>' +
    '<button class="jmb-intro-skip" type="button">SKIP INTRO</button>';
  document.body.appendChild(layer);
  var finished = false, timer;
  function finish(){
    if(finished) return;
    finished = true;
    clearTimeout(timer);
    layer.classList.add("is-leaving");
    window.setTimeout(function(){ if(layer.parentNode) layer.parentNode.removeChild(layer); },580);
  }
  layer.querySelector(".jmb-intro-skip").addEventListener("click",finish);
  layer.addEventListener("click",function(e){ if(e.target===layer) finish(); });
  document.addEventListener("keydown",function onKey(e){
    if(e.key==="Escape" && !finished){finish();document.removeEventListener("keydown",onKey);}
  });
  timer = window.setTimeout(finish,2450);
})();
