/* JMB MEDIA — subtle motion and scroll feedback; no external dependencies */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var progress = document.createElement("div");
  progress.className = "jmb-scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  var queued = false;
  function updateProgress() {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var ratio = Math.min(1, Math.max(0, window.scrollY / max));
    progress.style.transform = "scaleX(" + ratio + ")";
    queued = false;
  }
  function requestProgress() {
    if (!queued) {
      queued = true;
      window.requestAnimationFrame(updateProgress);
    }
  }
  window.addEventListener("scroll", requestProgress, { passive: true });
  window.addEventListener("resize", requestProgress, { passive: true });
  updateProgress();

  /* A shared Back to Top control for the homepage, newspapers, radio and world desk. */
  if (document.querySelector(".radio-player")) document.body.classList.add("has-jmb-radio-player");
  var backTop = document.createElement("button");
  backTop.type = "button";
  backTop.className = "jmb-to-top";
  backTop.textContent = "↑";
  backTop.setAttribute("aria-label", "Back to top");
  backTop.setAttribute("title", "Back to top");
  backTop.setAttribute("aria-hidden", "true");
  backTop.tabIndex = -1;
  document.body.appendChild(backTop);

  function syncBackTop() {
    var visible = window.scrollY > 420;
    backTop.classList.toggle("is-visible", visible);
    backTop.setAttribute("aria-hidden", String(!visible));
    backTop.tabIndex = visible ? 0 : -1;
  }
  backTop.addEventListener("click", function() {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });
  window.addEventListener("scroll", syncBackTop, { passive: true });
  syncBackTop();

  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function syncThemeColor() {
    if (themeMeta) themeMeta.setAttribute("content", root.classList.contains("light") ? "#f3f6fb" : "#090b12");
  }
  syncThemeColor();
  if (window.MutationObserver) {
    new MutationObserver(syncThemeColor).observe(root, { attributes: true, attributeFilter: ["class"] });
  }

  if (!reduced && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -28px 0px" });

    function watch(node) {
      if (!node || node.nodeType !== 1 || node.classList.contains("jmb-reveal")) return;
      node.classList.add("jmb-reveal");
      observer.observe(node);
    }

    document.querySelectorAll(
      ".service-card,.source-tile,.page-hero,.newspaper-feature,.side-panel,.feature-band"
    ).forEach(watch);

    ["newsGrid", "radioGrid", "storyList", "videoDesk", "audioDesk", "publisherGrid"].forEach(function (id) {
      var target = document.getElementById(id);
      if (!target || !window.MutationObserver) return;
      new MutationObserver(function (records) {
        records.forEach(function (record) {
          record.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) {
              watch(node);
              node.querySelectorAll && node.querySelectorAll(".news-card,.media-card,.story,.source-tile").forEach(watch);
            }
          });
        });
      }).observe(target, { childList: true, subtree: true });
    });
  }
})();