(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var hosts=["https://de1.api.radio-browser.info","https://nl1.api.radio-browser.info","https://at1.api.radio-browser.info"];
var stations=[],audio=$("radioAudio"),current=null,favorites=loadFavorites(),timer=null,optionsLoaded=false,loadSeq=0,loadController=null;
var RADIO_CACHE_KEY="jmb-radio-directory-v1";
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function safeUrl(s){var raw=String(s||"").trim();if(!raw)return "";try{var u=new URL(raw);return u.protocol==="https:"&&!u.username&&!u.password?u.href:"";}catch(e){return "";}}
function textValue(value,max){return String(value||"").replace(/\\s+/g," ").trim().slice(0,max);}
function normalizeStation(s){
 if(!s||!s.stationuuid||!s.name)return null;
 var name=textValue(s.name,150),tags=textValue(s.tags,220),stream=safeUrl(s.url_resolved);
 if(!name||!stream||/(adult|erotic|porn|explicit|xxx|sex)/i.test(name+" "+tags))return null;
 return {
  stationuuid:textValue(s.stationuuid,80),name:name,url_resolved:stream,
  favicon:safeUrl(s.favicon),country:textValue(s.country,90),state:textValue(s.state,90),
  language:textValue(s.language,100),tags:tags,codec:textValue(s.codec,24),
  bitrate:Math.max(0,Math.min(100000,Number(s.bitrate)||0)),
  clickcount:Math.max(0,Number(s.clickcount)||0)
 };
}
function loadDirectoryCache(){
 try{
  var data=JSON.parse(localStorage.getItem(RADIO_CACHE_KEY)||"[]");
  return Array.isArray(data)?data.map(normalizeStation).filter(Boolean).slice(0,200):[];
 }catch(e){return [];}
}
function saveDirectoryCache(list){
 try{
  var merged=new Map();
  (list||[]).forEach(function(s){var clean=normalizeStation(s);if(clean&&!merged.has(clean.stationuuid))merged.set(clean.stationuuid,clean);});
  loadDirectoryCache().forEach(function(s){if(!merged.has(s.stationuuid))merged.set(s.stationuuid,s);});
  localStorage.setItem(RADIO_CACHE_KEY,JSON.stringify(Array.from(merged.values()).slice(0,200)));
 }catch(e){}
}
function loadFavorites(){try{return JSON.parse(localStorage.getItem("jmb-radio-favorites")||"[]");}catch(e){return [];}}
function saveFavorites(){try{localStorage.setItem("jmb-radio-favorites",JSON.stringify(favorites));}catch(e){window.JMBToast("Browser storage is unavailable; favourites may not be saved.");}}
function safeStation(s){return !/(adult|erotic|porn|explicit|xxx|sex)/i.test(String(s.tags||""))&&!/(adult|erotic|porn|explicit|xxx|sex)/i.test(String(s.name||""));}
function fill(id,values){var el=$(id),old=el.value;Array.from(new Set(values.filter(Boolean))).sort().forEach(function(v){el.insertAdjacentHTML("beforeend",'<option value="'+esc(v)+'">'+esc(v)+'</option>');});if(values.indexOf(old)>=0)el.value=old;}
async function api(path,signal){
 var last;
 for(var i=0;i<hosts.length;i++){
  var ctl=new AbortController(),timer=setTimeout(function(c){return function(){c.abort();};}(ctl),9000);
  var abort=function(){ctl.abort();};
  if(signal){if(signal.aborted)ctl.abort();else signal.addEventListener("abort",abort,{once:true});}
  try{
   var r=await fetch(hosts[i]+path,{headers:{"Accept":"application/json"},signal:ctl.signal});
   if(!r.ok)throw new Error("Radio directory unavailable (HTTP "+r.status+")");
   return await r.json();
  }catch(e){last=e;if(signal&&signal.aborted)throw e;}
  finally{clearTimeout(timer);if(signal)signal.removeEventListener("abort",abort);}
 }
 throw last||new Error("Radio directory unavailable");
}
function queryUrl(){
 var p=new URLSearchParams(),q=$("stationSearch").value.trim(),country=$("radioCountry").value,language=$("radioLanguage").value,genre=$("radioGenre").value;
 if(q)p.set("name",q);if(country)p.set("country",country);if(language)p.set("language",language);if(genre)p.set("tag",genre);
 p.set("hidebroken","true");p.set("order","clickcount");p.set("reverse","true");p.set("limit","80");
 return "/json/stations/search?"+p.toString();
}
function render(){
 var q=$("stationSearch").value.toLowerCase().trim(),country=$("radioCountry").value,language=$("radioLanguage").value,genre=$("radioGenre").value;
 var band=$("bandFilter").value,favOnly=$("favoritesOnly").value==="yes",list=stations.filter(safeStation);
 if(q)list=list.filter(function(s){return [s.name,s.country,s.state,s.language,s.tags].join(" ").toLowerCase().indexOf(q)>=0;});
 if(country)list=list.filter(function(s){return s.country===country;});
 if(language)list=list.filter(function(s){return (s.language||"").split(",").some(function(x){return x.trim()===language;});});
 if(genre)list=list.filter(function(s){return (s.tags||"").toLowerCase().split(",").some(function(x){return x.trim()===genre;});});
 if(favOnly)list=list.filter(function(s){return favorites.indexOf(s.stationuuid)>=0;});
 if(band==="fm")list=list.filter(function(s){return /\bfm\b/i.test(s.tags||"")||/\bfm\b/i.test(s.name||"");});
 if(band==="am")list=list.filter(function(s){return /\bam\b/i.test(s.tags||"")||/\bam\b/i.test(s.name||"");});
 if(band==="internet")list=list.filter(function(s){return !/\b(am|fm)\b/i.test((s.tags||"")+" "+(s.name||""));});
 $("radioStatus").textContent=list.length.toLocaleString()+" stations found";
 if(!list.length){$("radioGrid").innerHTML=favOnly?'<div class="empty-state"><strong>No favourite stations yet.</strong><p>Tap the heart on a station card to save it here. Your favourites stay on this device.</p></div>':'<div class="empty-state">No stations matched. Try removing a filter or searching a different spelling.</div>';return;}
 $("radioGrid").innerHTML=list.map(function(s){
  var fav=favorites.indexOf(s.stationuuid)>=0,icon=safeUrl(s.favicon),logo=icon?'<img src="'+esc(s.favicon)+'" alt="" style="width:52px;height:52px;object-fit:contain;border-radius:12px;background:#fff" loading="lazy" onerror="this.style.display=\'none\'">':'<div class="avatar">📻</div>';
  var type=/\bfm\b/i.test((s.tags||"")+" "+(s.name||""))?"FM-tagged":/\bam\b/i.test((s.tags||"")+" "+(s.name||""))?"AM-tagged":"Internet stream";
  return '<article class="media-card"><div class="card-top">'+logo+'<div style="min-width:0;flex:1"><div class="card-title">'+esc(s.name)+'</div><div class="muted tiny">'+esc(s.country||"Worldwide")+' · '+esc(s.language||"Language not listed")+'</div></div><button class="icon-btn" data-fav="'+esc(s.stationuuid)+'" aria-label="Toggle favourite" title="Favourite">'+(fav?"♥":"♡")+'</button></div><div class="tag-row"><span class="tag">'+esc(type)+'</span><span class="tag">'+esc((s.codec||"Audio")+" "+(s.bitrate?s.bitrate+" kbps":""))+'</span>'+(s.tags?'<span class="tag">'+esc(String(s.tags).split(",").slice(0,2).join(", "))+'</span>':"")+'</div><div class="card-description">'+esc([s.state,s.country].filter(Boolean).join(" · ")||"Live internet radio")+' · Live audio stream</div><div class="card-actions"><button class="btn small" data-play="'+esc(s.stationuuid)+'">▶ Listen live</button></div></article>';
 }).join("");
}
async function load(){
 var retry=$("radioRetry"),seq=++loadSeq;if(retry){retry.disabled=true;retry.textContent="Refreshing…";}
 if(loadController)loadController.abort();
 loadController=new AbortController();
 var signal=loadController.signal;
 $("radioStatus").textContent="Searching radio stations…";
 $("radioGrid").innerHTML='<div class="loading-state" role="status">Searching stations… <span class="loading-dot"></span></div>';
 try{
  var jobs=[api(queryUrl(),signal)];
  if(!optionsLoaded){jobs.push(api("/json/countries?order=name&reverse=false",signal));jobs.push(api("/json/languages?order=name&reverse=false",signal));}
  var results=await Promise.all(jobs);
  if(seq!==loadSeq)return;
  stations=results[0].map(normalizeStation).filter(Boolean).filter(safeStation);
  saveDirectoryCache(stations);
  if(!optionsLoaded){
   fill("radioCountry",results[1].map(function(x){return x.name;}));
   fill("radioLanguage",results[2].map(function(x){return x.name;}));
   optionsLoaded=true;
  }
  render();
  $("radioStatus").textContent+=" · live directory";
  if(retry){retry.disabled=false;retry.textContent="↻ Refresh stations";}
 }catch(e){
  if(seq!==loadSeq)return;
  stations=loadDirectoryCache();
  if(stations.length){
   render();
   $("radioStatus").textContent=$("radioStatus").textContent+" · saved offline directory";
  }else{
   $("radioStatus").textContent="Could not connect to Radio Browser.";
   $("radioGrid").innerHTML='<div class="empty-state" role="status"><strong>The station directory is temporarily unavailable.</strong><p>Check your connection and try again. Your favourites are kept on this device.</p></div>';
  }
  if(retry){retry.disabled=false;retry.textContent="↻ Try again";}
 }
}
function play(s){
 var stream=s&&safeUrl(s.url_resolved);
 if(!stream){window.JMBToast("This station does not provide a secure HTTPS stream.");return;}
 current=s;audio.pause();audio.src=stream;audio.volume=Number($("radioVolume").value);
 audio.play().then(function(){
  $("nowTitle").textContent=s.name;$("nowSubtitle").textContent=(s.country||"Worldwide")+" · "+(s.language||"Online radio");$("radioPlay").textContent="Ⅱ";
  api("/json/url/"+encodeURIComponent(s.stationuuid)).catch(function(){});
 }).catch(function(){window.JMBToast("The stream did not start. Try another station.");$("radioPlay").textContent="▶";});
}
$("radioGrid").addEventListener("click",function(e){
 var b=e.target.closest("[data-play]"),f=e.target.closest("[data-fav]");
 if(b){var s=stations.find(function(x){return x.stationuuid===b.getAttribute("data-play");});play(s);}
 if(f){var id=f.getAttribute("data-fav"),i=favorites.indexOf(id);if(i>=0)favorites.splice(i,1);else favorites.push(id);saveFavorites();render();}
});
$("radioPlay").addEventListener("click",function(){
 if(!current){window.JMBToast("Choose a station first.");return;}
 if(audio.paused)audio.play().catch(function(){window.JMBToast("This station could not resume.");});
 else audio.pause();
});
$("stopRadio").addEventListener("click",function(){audio.pause();audio.removeAttribute("src");audio.load();current=null;$("nowTitle").textContent="Choose a station";$("nowSubtitle").textContent="JMB Radio player";$("radioPlay").textContent="▶";});
$("radioVolume").addEventListener("input",function(){audio.volume=Number(this.value);});
audio.addEventListener("playing",function(){$("radioPlay").textContent="Ⅱ";});audio.addEventListener("pause",function(){$("radioPlay").textContent="▶";});audio.addEventListener("ended",function(){$("radioPlay").textContent="▶";});
audio.addEventListener("error",function(){if(current)window.JMBToast("This station stream is offline or blocked by its provider.");$("radioPlay").textContent="▶";});
["radioCountry","radioLanguage","radioGenre","bandFilter"].forEach(function(id){$(id).addEventListener("change",load);});
$("favoritesOnly").addEventListener("change",render);
$("radioRetry").addEventListener("click",load);
var initialQuery=new URLSearchParams(location.search).get("q");if(initialQuery)$("stationSearch").value=initialQuery.slice(0,120);
$("stationSearch").addEventListener("input",function(){clearTimeout(timer);timer=setTimeout(load,350);});window.addEventListener("online",function(){load();});
load();
})();