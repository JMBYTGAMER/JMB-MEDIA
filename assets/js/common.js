(function(){
"use strict";
var path=location.pathname,marker="/JMB-MEDIA/",base=path.indexOf(marker)===0?marker:"/";
window.JMBBase=base;
function storageGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function storageSet(k,v){try{localStorage.setItem(k,v);return true;}catch(e){return false;}}
var toggle=document.querySelector("[data-menu-toggle]"),mobile=document.querySelector("[data-mobile-nav]");
function syncMenu(open){
 if(!toggle||!mobile)return;
 mobile.classList.toggle("open",open);
 mobile.setAttribute("aria-hidden",String(!open));
 toggle.setAttribute("aria-expanded",String(open));
 toggle.setAttribute("aria-label",open?"Close menu":"Open menu");
 toggle.setAttribute("title",open?"Close menu":"Open menu");
 toggle.textContent=open?"×":"☰";
}
function closeMenu(returnFocus){if(!toggle||!mobile)return;syncMenu(false);if(returnFocus)toggle.focus();}
if(toggle&&mobile){
 if(!mobile.id)mobile.id="jmbMobileNav";
 toggle.setAttribute("aria-controls",mobile.id);
 syncMenu(false);
 var currentPath=location.pathname.replace(/\/+$/,"")||"/";
 mobile.querySelectorAll("a").forEach(function(a){
  try{
   var targetPath=new URL(a.getAttribute("href"),location.href).pathname.replace(/\/+$/,"")||"/";
   if(targetPath===currentPath){a.setAttribute("aria-current","page");a.setAttribute("aria-label",(a.textContent||"").trim()+" (current page)");}
  }catch(e){}
  a.addEventListener("click",function(){closeMenu(false);});
 });
 toggle.addEventListener("click",function(){syncMenu(toggle.getAttribute("aria-expanded")!=="true");if(toggle.getAttribute("aria-expanded")==="true"){var first=mobile.querySelector("a");if(first)first.focus();}});
 document.addEventListener("pointerdown",function(e){if(mobile.classList.contains("open")&&!mobile.contains(e.target)&&!toggle.contains(e.target))closeMenu(false);});
 document.addEventListener("keydown",function(e){if(e.key==="Escape"&&mobile.classList.contains("open"))closeMenu(true);});
}
var theme=document.querySelector("[data-theme-toggle]");
function updateTheme(){if(!theme)return;var light=document.documentElement.classList.contains("light");theme.setAttribute("aria-pressed",String(light));theme.setAttribute("aria-label",light?"Switch to dark theme":"Switch to light theme");theme.title=light?"Switch to dark theme":"Switch to light theme";}
if(theme){if(storageGet("jmb-media-theme")==="light")document.documentElement.classList.add("light");updateTheme();theme.addEventListener("click",function(){document.documentElement.classList.toggle("light");var light=document.documentElement.classList.contains("light");storageSet("jmb-media-theme",light?"light":"dark");updateTheme();});}
var quick=document.querySelector("[data-global-search]");
if(quick)quick.addEventListener("submit",function(e){e.preventDefault();var input=quick.querySelector("input[type=search]"),scope=quick.querySelector("select"),q=(input&&input.value||"").trim().slice(0,120),target=scope&&scope.value||"tv";var routes={tv:"tv/",newspaper:"newspaper/",radio:"radio/",social:"social/"};if(q&&routes[target])location.href=base+routes[target]+"?q="+encodeURIComponent(q);else if(!q)window.JMBToast("Enter something to search.");});
var current=location.pathname.split("/").filter(Boolean).pop()||"home";
document.querySelectorAll("[data-nav]").forEach(function(a){if(a.getAttribute("data-nav")===current){a.classList.add("active");a.setAttribute("aria-current","page");}else a.removeAttribute("aria-current");});
document.querySelectorAll('a[target="_blank"]').forEach(function(a){a.relList.add("noopener");a.relList.add("noreferrer");});
var toast=document.querySelector("[data-toast]");
window.JMBToast=function(message){if(!toast){toast=document.createElement("div");toast.className="toast";toast.setAttribute("data-toast","");toast.setAttribute("role","status");toast.setAttribute("aria-live","polite");document.body.appendChild(toast);}toast.textContent=message;toast.classList.add("show");clearTimeout(window.__jmbToastTimer);window.__jmbToastTimer=setTimeout(function(){toast.classList.remove("show");},2800);};
document.querySelectorAll("[data-year]").forEach(function(el){el.textContent=String(new Date().getFullYear());});

/* Fast, page-aware search: "/" or Ctrl/Cmd+K focuses the current section's search field. */
var searchTarget = document.querySelector(
  "#channelSearch, #newsSearch, #stationSearch, #socialSearch, [data-global-search] input, input[type='search']"
);
if (searchTarget) {
  searchTarget.setAttribute("aria-keyshortcuts", "/ Control+K Meta+K");
  searchTarget.title = (searchTarget.title ? searchTarget.title + " · " : "") + "Shortcut: / or Ctrl+K";
  document.addEventListener("keydown", function(e) {
    if (e.defaultPrevented || e.isComposing || e.altKey) return;
    var key = String(e.key || "").toLowerCase();
    var slash = key === "/" && !e.ctrlKey && !e.metaKey;
    var commandK = key === "k" && (e.ctrlKey || e.metaKey);
    if (!slash && !commandK) return;
    var target = e.target;
    var editing = target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName || ""));
    if (editing) return;
    e.preventDefault();
    searchTarget.focus();
  });
}

})();