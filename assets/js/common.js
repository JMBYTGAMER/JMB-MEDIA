(function(){
"use strict";
var path=location.pathname;
var marker="/JMB-MEDIA/";
var base=path.indexOf(marker)===0?marker:"/";
window.JMBBase=base;
var toggle=document.querySelector("[data-menu-toggle]");
var mobile=document.querySelector("[data-mobile-nav]");
if(toggle&&mobile){toggle.addEventListener("click",function(){var open=mobile.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));});mobile.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){mobile.classList.remove("open");toggle.setAttribute("aria-expanded","false");});});}
var theme=document.querySelector("[data-theme-toggle]");
if(theme){var saved=localStorage.getItem("jmb-media-theme");if(saved==="light")document.documentElement.classList.add("light");theme.addEventListener("click",function(){document.documentElement.classList.toggle("light");localStorage.setItem("jmb-media-theme",document.documentElement.classList.contains("light")?"light":"dark");});}
var quick=document.querySelector("[data-global-search]");
if(quick){quick.addEventListener("submit",function(e){e.preventDefault();var input=quick.querySelector("input");var q=(input&&input.value||"").trim();if(q)location.href=base+"tv/?q="+encodeURIComponent(q);});}
var current=location.pathname.split("/").filter(Boolean).pop()||"home";
document.querySelectorAll("[data-nav]").forEach(function(a){if(a.getAttribute("data-nav")===current)a.classList.add("active");});
var toast=document.querySelector("[data-toast]");
window.JMBToast=function(message){if(!toast){toast=document.createElement("div");toast.className="toast";toast.setAttribute("data-toast","");document.body.appendChild(toast);}toast.textContent=message;toast.classList.add("show");clearTimeout(window.__jmbToastTimer);window.__jmbToastTimer=setTimeout(function(){toast.classList.remove("show");},2600);};
document.querySelectorAll("[data-year]").forEach(function(el){el.textContent=String(new Date().getFullYear());});
})();