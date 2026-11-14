/* JMB MEDIA — compact mobile navigation for shared pages */
(function () {
  "use strict";
  var root = window.JMBBase || "/";
  var items = [
    { label: "Home", icon: "⌂", path: "", key: "home" },
    { label: "TV", icon: "▣", path: "tv/", key: "tv" },
    { label: "Read", icon: "▤", path: "newspaper/", key: "newspaper" },
    { label: "Radio", icon: "♫", path: "radio/", key: "radio" },
    { label: "World", icon: "◎", path: "social/", key: "social" }
  ];
  var segment = location.pathname.split("/").filter(Boolean).pop() || "home";
  if (segment === "index.html") segment = location.pathname.split("/").filter(Boolean).slice(-2, -1)[0] || "home";
  var active = ["tv", "newspaper", "radio", "social"].indexOf(segment) >= 0 ? segment : "home";

  var dock = document.createElement("nav");
  dock.className = "jmb-mobile-dock";
  dock.setAttribute("aria-label", "Quick navigation");
  items.forEach(function (item) {
    var link = document.createElement("a");
    link.href = root + item.path;
    if (item.key === active) link.setAttribute("aria-current", "page");
    var icon = document.createElement("span");
    icon.className = "dock-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = item.icon;
    var label = document.createElement("span");
    label.textContent = item.label;
    link.appendChild(icon);
    link.appendChild(label);
    dock.appendChild(link);
  });
  document.body.classList.add("has-jmb-dock");
  document.body.appendChild(dock);

  var hero = document.querySelector(".page-hero");
  if (hero) {
    var marks = {
      newspaper: "THE PRESS",
      radio: "ON AIR",
      social: "WORLD DESK"
    };
    hero.setAttribute("data-mark", marks[active] || "DISCOVER");
  }
})();