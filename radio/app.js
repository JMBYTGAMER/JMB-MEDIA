(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var hosts=["https://de1.api.radio-browser.info","https://nl1.api.radio-browser.info","https://at1.api.radio-browser.info"];
var stations=[],audio=$("radioAudio"),current=null,favorites=loadFavorites(),timer=null,optionsLoaded=false;
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function safeUrl(s){try{var u=new URL(s);return u.protocol==="https:"||u.protocol==="http:"?u.href:"#";}catch(e){return "#";}}
function loadFavorites(){try{return JSON.parse(localStorage.getItem("jmb-radio-favorites")||"[]");}catch(e){return [];}}
function saveFavorites(){localStorage.setItem("jmb-radio-favorites",JSON.stringify(favorites));}
function safeStation(s){return !/(adult|erotic|porn|explicit|xxx|sex)/i.test(String(s.tags||""))&&!/(adult|erotic|porn|explicit|xxx|sex)/i.test(String(s.name||""));}
function fill(id,values){var el=$(id),old=el.value;Array.from(new Set(values.filter(Boolean))).sort().forEach(function(v){el.insertAdjacentHTML("beforeend",'<option value="'+esc(v)+'">'+esc(v)+'</option>');});if(values.indexOf(old)>=0)el.value=old;}
async function api(path){var last;for(var i=0;i<hosts.length;i++){try{var r=await fetch(hosts[i]+path,{headers:{"Accept":"application/json"}});if(!r.ok)throw new Error("Radio directory unavailable");return await r.json();}catch(e){last=e;}}throw last||new Error("Radio directory unavailable");}
function queryUrl(){
 var p=new URLSearchParams(),q=$("stationSearch").value.trim(),country=$("radioCountry").value,language=$("radioLanguage").value,genre=$("radioGenre").value;
 if(q)p.set("name",q);if(country)p.set("country",country);if(language)p.set("language",language);if(genre)p.set("tag",genre);
 p.set("hidebroken","true");p.set("order","clickcount");p.set("reverse","true");p.set("limit","80");
 return "/json/stations/search?"+p.toString();
}
function render(){
 var band=$("bandFilter").value,list=stations.filter(safeStation);
 if(band==="fm")list=list.filter(function(s){return /\bfm\b/i.test(s.tags||"")||/\bfm\b/i.test(s.name||"");});
 if(band==="am")list=list.filter(function(s){return /\bam\b/i.test(s.tags||"")||/\bam\b/i.test(s.name||"");});
 if(band==="internet")list=list.filter(function(s){return !/\b(am|fm)\b/i.test((s.tags||"")+" "+(s.name||""));});
 $("radioStatus").textContent=list.length.toLocaleString()+" stations found";
 if(!list.length){$("radioGrid").innerHTML='<div class="empty-state">No stations matched. Try removing a filter or searching a different spelling.</div>';return;}
 $("radioGrid").innerHTML=list.map(function(s){
  var fav=favorites.indexOf(s.stationuuid)>=0,logo=s.favicon&&/^https?:\/\//i.test(s.favicon)?'<img src="'+esc(s.favicon)+'" alt="" style="width:52px;height:52px;object-fit:contain;border-radius:12px;background:#fff" loading="lazy" onerror="this.style.display=\'none\'">':'<div class="avatar">📻</div>';
  var type=/\bfm\b/i.test((s.tags||"")+" "+(s.name||""))?"FM-tagged":/\bam\b/i.test((s.tags||"")+" "+(s.name||""))?"AM-tagged":"Internet stream";
  return '<article class="media-card"><div class="card-top">'+logo+'<div style="min-width:0;flex:1"><div class="card-title">'+esc(s.name)+'</div><div class="muted tiny">'+esc(s.country||"Worldwide")+' · '+esc(s.language||"Language not listed")+'</div></div><button class="icon-btn" data-fav="'+esc(s.stationuuid)+'" aria-label="Toggle favourite" title="Favourite">'+(fav?"♥":"♡")+'</button></div><div class="tag-row"><span class="tag">'+esc(type)+'</span><span class="tag">'+esc((s.codec||"Audio")+" "+(s.bitrate?s.bitrate+" kbps":""))+'</span>'+(s.tags?'<span class="tag">'+esc(String(s.tags).split(",").slice(0,2).join(", "))+'</span>':"")+'</div><div class="card-description">'+esc([s.state,s.country].filter(Boolean).join(" · ")||"Live internet radio")+' · Live audio stream</div><div class="card-actions"><button class="btn small" data-play="'+esc(s.stationuuid)+'">▶ Listen live</button></div></article>';
 }).join("");
}
async function load(){
 $("radioStatus").textContent="Searching radio stations…";$("radioGrid").innerHTML='<div class="loading-state">Searching <span class="loading-dot"></span><span class="loading-dot"></span></div>';
 try{
  var jobs=[api(queryUrl())];
  if(!optionsLoaded){jobs.push(api("/json/countries?order=name&reverse=false"));jobs.push(api("/json/languages?order=name&reverse=false"));}
  var results=await Promise.all(jobs);
  stations=results[0].filter(safeStation);
  if(!optionsLoaded){
   fill("radioCountry",results[1].map(function(x){return x.name;}));
   fill("radioLanguage",results[2].map(function(x){return x.name;}));
   optionsLoaded=true;
  }
  render();
 }catch(e){$("radioStatus").textContent="Could not connect to Radio Browser."; $("radioGrid").innerHTML='<div class="empty-state">The station directory is temporarily unavailable. Please try again in a moment.</div>';}
}
function play(s){
 if(!s||!s.url_resolved){window.JMBToast("This station has no working stream URL.");return;}
 current=s;audio.pause();audio.src=s.url_resolved;audio.volume=Number($("radioVolume").value);
 audio.play().then(function(){$("nowTitle").textContent=s.name;$("nowSubtitle").textContent=(s.country||"Worldwide")+" · "+(s.language||"Online radio");$("radioPlay").textContent="Ⅱ";api("/json/url/"+encodeURIComponent(s.stationuuid)).catch(function(){});}).catch(function(){window.JMBToast("The stream did not start. Try another station.");$("radioPlay").textContent="▶";});
}
$("radioGrid").addEventListener("click",function(e){
 var b=e.target.closest("[data-play]"),f=e.target.closest("[data-fav]");
 if(b){var s=stations.find(function(x){return x.stationuuid===b.getAttribute("data-play");});play(s);}
 if(f){var id=f.getAttribute("data-fav"),i=favorites.indexOf(id);if(i>=0)favorites.splice(i,1);else favorites.push(id);saveFavorites();render();}
});
$("radioPlay").addEventListener("click",function(){if(!current){window.JMBToast("Choose a station first.");return;}if(audio.paused){audio.play().catch(function(){});$("radioPlay").textContent="Ⅱ";}else{audio.pause();$("radioPlay").textContent="▶";}});
$("stopRadio").addEventListener("click",function(){audio.pause();audio.removeAttribute("src");audio.load();current=null;$("nowTitle").textContent="Choose a station";$("nowSubtitle").textContent="JMB Radio player";$("radioPlay").textContent="▶";});
$("radioVolume").addEventListener("input",function(){audio.volume=Number(this.value);});
audio.addEventListener("ended",function(){$("radioPlay").textContent="▶";});
audio.addEventListener("error",function(){if(current)window.JMBToast("This station stream is offline or blocked by its provider.");$("radioPlay").textContent="▶";});
["radioCountry","radioLanguage","radioGenre","bandFilter"].forEach(function(id){$(id).addEventListener("change",load);});
$("stationSearch").addEventListener("input",function(){clearTimeout(timer);timer=setTimeout(load,350);});
load();
})();