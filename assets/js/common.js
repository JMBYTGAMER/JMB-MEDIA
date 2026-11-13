(function(){
"use strict";
var path=window.location.pathname;
var marker="/JMB-MEDIA/";
var base=path.indexOf(marker)===0?marker:"/";
window.JMBBase=base;

function storageGet(key){try{return window.localStorage.getItem(key);}catch(error){return null;}}
function storageSet(key,value){try{window.localStorage.setItem(key,value);}catch(error){}}
function copyText(value){
 if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(value);
 return new Promise(function(resolve,reject){
  try{
   var box=document.createElement("textarea");box.value=value;box.setAttribute("readonly","");
   box.style.position="fixed";box.style.opacity="0";document.body.appendChild(box);box.select();
   var ok=document.execCommand("copy");box.remove();if(ok)resolve();else reject(new Error("Copy unavailable"));
  }catch(error){reject(error);}
 });
}

var toggle=document.querySelector("[data-menu-toggle]");
var mobile=document.querySelector("[data-mobile-nav]");
function closeMenu(){
 if(!toggle||!mobile)return;
 mobile.classList.remove("open");toggle.setAttribute("aria-expanded","false");
}
if(toggle&&mobile){
 toggle.addEventListener("click",function(){
  var open=mobile.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));
 });
 mobile.querySelectorAll("a").forEach(function(a){a.addEventListener("click",closeMenu);});
 document.addEventListener("click",function(event){
  if(mobile.classList.contains("open")&&!mobile.contains(event.target)&&!toggle.contains(event.target))closeMenu();
 });
 document.addEventListener("keydown",function(event){if(event.key==="Escape")closeMenu();});
}

var theme=document.querySelector("[data-theme-toggle]");
function setTheme(mode){
 var light=mode==="light";
 document.documentElement.classList.toggle("light",light);
 if(theme){
  theme.textContent=light?"☾":"☼";
  theme.setAttribute("aria-label",light?"Switch to dark theme":"Switch to light theme");
  theme.title=light?"Switch to dark theme":"Switch to light theme";
 }
 storageSet("jmb-media-theme",mode);storageSet("theme",mode);
}
if(theme){
 var saved=storageGet("jmb-media-theme")||storageGet("theme");
 setTheme(saved==="light"?"light":"dark");
 theme.addEventListener("click",function(){
  setTheme(document.documentElement.classList.contains("light")?"dark":"light");
 });
}

var quick=document.querySelector("[data-global-search]");
if(quick){
 quick.addEventListener("submit",function(event){
  event.preventDefault();
  var input=quick.querySelector("input"),q=(input&&input.value||"").trim();
  if(q)window.location.href=base+"tv/?q="+encodeURIComponent(q);
 });
}

var share=document.querySelectorAll("[data-share-site]");
share.forEach(function(button){
 button.addEventListener("click",async function(){
  var url=window.location.origin+window.location.pathname;
  var payload={title:document.title||"JMB TV",text:"Watch, read and listen with JMB TV.",url:url};
  try{
   if(navigator.share){await navigator.share(payload);return;}
   await copyText(url);
   window.JMBToast("JMB TV link copied. Share it in WhatsApp to show the preview.");
  }catch(error){
   if(error&&error.name==="AbortError")return;
   try{await copyText(url);window.JMBToast("Website link copied.");}
   catch(copyError){window.prompt("Copy your JMB TV link",url);}
  }
 });
});

var current=location.pathname.split("/").filter(Boolean).pop()||"home";
document.querySelectorAll("[data-nav]").forEach(function(anchor){
 if(anchor.getAttribute("data-nav")===current){anchor.classList.add("active");anchor.setAttribute("aria-current","page");}
});
var toast=document.querySelector("[data-toast]");
window.JMBToast=function(message){
 if(!toast){toast=document.createElement("div");toast.className="toast";toast.setAttribute("data-toast","");toast.setAttribute("role","status");toast.setAttribute("aria-live","polite");document.body.appendChild(toast);}
 toast.textContent=message;toast.classList.add("show");
 clearTimeout(window.__jmbToastTimer);
 window.__jmbToastTimer=setTimeout(function(){toast.classList.remove("show");},2800);
};
document.querySelectorAll("[data-year]").forEach(function(el){el.textContent=String(new Date().getFullYear());});
document.querySelectorAll('a[target="_blank"]').forEach(function(anchor){
 var rel=(anchor.getAttribute("rel")||"").split(/\s+/).filter(Boolean);
 ["noopener","noreferrer"].forEach(function(value){if(rel.indexOf(value)<0)rel.push(value);});
 anchor.setAttribute("rel",rel.join(" "));
});
document.documentElement.classList.add("js-ready");
})();