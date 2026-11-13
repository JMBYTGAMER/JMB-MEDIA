(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var hosts=["https://de1.api.radio-browser.info","https://nl1.api.radio-browser.info","https://at1.api.radio-browser.info"];
var cacheKey="jmb-radio-directory-cache-v1";
var stations=[],audio=$("radioAudio"),current=null,favorites=loadFavorites(),timer=null,optionsLoaded=false,loadSequence=0;
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function safeHttps(s){try{var u=new URL(s);return u.protocol==="https:"?u.href:"";}catch(e){return "";}}
function loadFavorites(){try{return JSON.parse(localStorage.getItem("jmb-radio-favorites")||"[]");}catch(e){return [];}}
function saveFavorites(){try{localStorage.setItem("jmb-radio-favorites",JSON.stringify(favorites));}catch(e){window.JMBToast("Browser storage is unavailable; favourites may not be saved.");}}
function safeStation(s){return !/(adult|erotic|porn|explicit|xxx|sex)/i.test(String(s.tags||""))&&!/(adult|erotic|porn|explicit|xxx|sex)/i.test(String(s.name||""));}
function fill(id,values){var el=$(id),old=el.value;Array.from(new Set(values.filter(Boolean))).sort().forEach(function(v){if(!Array.from(el.options).some(function(o){return o.value===v;}))el.insertAdjacentHTML("beforeend",'<option value="'+esc(v)+'">'+esc(v)+'</option>');});if(Array.from(el.options).some(function(o){return o.value===old;}))el.value=old;}
async function request(url,ms){
 var controller=typeof AbortController!=="undefined"?new AbortController():null;
 var timer=controller?setTimeout(function(){controller.abort();},ms||9000):null;
 try{var r=await fetch(url,{headers:{"Accept":"application/json"},signal:controller?controller.signal:undefined,cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);return await r.json();}
 finally{if(timer)clearTimeout(timer);}
}
async function api(path){
 var last;
 for(var i=0;i<hosts.length;i++){
  try{return await request(hosts[i]+path,9000);}
  catch(e){last=e;}
 }
 throw last||new Error("Radio Browser directory unavailable");
}
function queryUrl(){
 var p=new URLSearchParams(),q=$("stationSearch").value.trim(),country=$("radioCountry").value,language=$("radioLanguage").value,genre=$("radioGenre").value;
 if(q)p.set("name",q);if(country)p.set("country",country);if(language)p.set("language",language);if(genre)p.set("tag",genre);
 p.set("hidebroken","true");p.set("order","clickcount");p.set("reverse","true");p.set("limit","80");
 return "/json/stations/search?"+p.toString();
}
function readCache(){try{return JSON.parse(localStorage.getItem(cacheKey)||"{}")||{};}catch(e){return {};}}
function storeCache(rows){
 try{localStorage.setItem(cacheKey,JSON.stringify({time:Date.now(),stations:rows}));}catch(e){}
}
function restoreCache(){
 var saved=readCache();
 return Array.isArray(saved.stations)?saved.stations.filter(safeStation):[];
}
function render(){
 var band=$("bandFilter").value,q=$("stationSearch").value.trim().toLowerCase();
 var country=$("radioCountry").value,language=$("radioLanguage").value;
 var list=stations.filter(safeStation).filter(function(s){
  var blob=[s.name,s.country,s.state,s.language,s.tags].join(" ").toLowerCase();
  return (!q||blob.indexOf(q)>=0)&&(!country||s.country===country)&&(!language||String(s.language||"").split(",").indexOf(language)>=0);
 });
 if(band==="fm")list=list.filter(function(s){return /\bfm\b/i.test(s.tags||"")||/\bfm\b/i.test(s.name||"");});
 if(band==="am")list=list.filter(function(s){return /\bam\b/i.test(s.tags||"")||/\bam\b/i.test(s.name||"");});
 if(band==="internet")list=list.filter(function(s){return !/\b(am|fm)\b/i.test((s.tags||"")+" "+(s.name||""));});
 $("radioStatus").textContent=list.length.toLocaleString()+" stations"+(stations.some(function(s){return s.__saved;})?" · saved directory":" found");
 if(!list.length){$("radioGrid").innerHTML='<div class="empty-state">No stations matched. Try removing a filter or searching a different spelling.</div>';return;}
 $("radioGrid").innerHTML=list.map(function(s){
  var fav=favorites.indexOf(s.stationuuid)>=0;
  var logo=s.favicon&&/^https:\/\//i.test(s.favicon)?'<img src="'+esc(s.favicon)+'" alt="" style="width:52px;height:52px;object-fit:contain;border-radius:12px;background:#fff" loading="lazy" onerror="this.style.display=\\'none\\'">':'<div class="avatar">📻</div>';
  var type=/\bfm\b/i.test((s.tags||"")+" "+(s.name||""))?"FM-tagged":/\bam\b/i.test((s.tags||"")+" "+(s.name||""))?"AM-tagged":"Internet stream";
  var secure=!!safeHttps(s.url_resolved||s.url);
  var tags='<span class="tag">'+esc(type)+'</span><span class="tag">'+esc((s.codec||"Audio")+" "+(s.bitrate?s.bitrate+" kbps":""))+'</span>';
  if(!secure)tags+='<span class="tag">HTTPS unavailable</span>';
  if(s.tags)tags+='<span class="tag">'+esc(String(s.tags).split(",").slice(0,2).join(", "))+'</span>';
  return '<article class="media-card"><div class="card-top">'+logo+'<div style="min-width:0;flex:1"><div class="card-title">'+esc(s.name)+'</div><div class="muted tiny">'+esc(s.country||"Worldwide")+' · '+esc(s.language||"Language not listed")+'</div></div><button class="icon-btn" data-fav="'+esc(s.stationuuid)+'" aria-label="'+(fav?"Remove favourite":"Add favourite")+'" aria-pressed="'+String(fav)+'" title="Favourite">'+(fav?"♥":"♡")+'</button></div><div class="tag-row">'+tags+'</div><div class="card-description">'+esc([s.state,s.country].filter(Boolean).join(" · ")||"Live internet radio")+' · Internet audio stream</div><div class="card-actions"><button class="btn small" data-play="'+esc(s.stationuuid)+'" '+(secure?"":"disabled title=\\"This station does not provide an HTTPS stream\\"")+'>'+(secure?"▶ Listen live":"Stream unavailable")+'</button></div></article>';
 }).join("");
}
async function load(){
 var id=++loadSequence,button=$("radioRetry");
 $("radioStatus").textContent="Searching radio stations…";
 $("radioGrid").innerHTML='<div class="loading-state">Finding stations <span class="loading-dot"></span><span class="loading-dot"></span></div>';
 if(button){button.disabled=true;button.textContent="Searching…";}
 try{
  var result=await api(queryUrl());
  if(id!==loadSequence)return;
  stations=(Array.isArray(result)?result:[]).filter(safeStation);
  storeCache(stations);
  if(!optionsLoaded){
   var lists=await Promise.allSettled([api("/json/countries?order=name&reverse=false"),api("/json/languages?order=name&reverse=false")]);
   if(id!==loadSequence)return;
   if(lists[0].status==="fulfilled")fill("radioCountry",lists[0].value.map(function(x){return x.name;}));
   if(lists[1].status==="fulfilled")fill("radioLanguage",lists[1].value.map(function(x){return x.name;}));
   optionsLoaded=true;
  }
  render();
 }catch(error){
  if(id!==loadSequence)return;
  var cached=restoreCache();
  if(cached.length){
   stations=cached.map(function(s){var x=Object.assign({},s);x.__saved=true;return x;});
   render();$("radioStatus").textContent="Directory offline · showing "+stations.length+" saved stations";
   window.JMBToast("Showing your last saved radio directory.");
  }else{
   $("radioStatus").textContent="Could not connect to Radio Browser";
   $("radioGrid").innerHTML='<div class="empty-state">The radio directory is temporarily unavailable. Check your connection, then try Refresh.</div>';
  }
 }
 if(id===loadSequence&&button){button.disabled=false;button.textContent="↻ Refresh";}
}
function stopPlayback(){
 audio.pause();audio.removeAttribute("src");audio.load();current=null;
 $("nowTitle").textContent="Choose a station";$("nowSubtitle").textContent="JMB Radio player";$("radioPlay").textContent="▶";
}
function play(s){
 var src=s&&safeHttps(s.url_resolved||s.url);
 if(!s||!src){window.JMBToast("This station has no secure HTTPS stream for browser playback.");return;}
 current=s;audio.pause();audio.src=src;audio.volume=Number($("radioVolume").value);
 $("nowTitle").textContent=s.name;$("nowSubtitle").textContent="Connecting · "+(s.country||"Worldwide")+" · "+(s.language||"Online radio");
 $("radioPlay").textContent="…";
 audio.play().then(function(){
  $("nowSubtitle").textContent="Live · "+(s.country||"Worldwide")+" · "+(s.language||"Online radio");
  $("radioPlay").textContent="Ⅱ";
  api("/json/url/"+encodeURIComponent(s.stationuuid)).catch(function(){});
 }).catch(function(){
  $("nowSubtitle").textContent="Could not start · try another station";
  $("radioPlay").textContent="▶";
  window.JMBToast("The stream did not start. The station may be offline or browser-incompatible.");
 });
}
$("radioGrid").addEventListener("click",function(event){
 var b=event.target.closest("[data-play]"),f=event.target.closest("[data-fav]");
 if(b){var station=stations.find(function(x){return x.stationuuid===b.getAttribute("data-play");});play(station);}
 if(f){var id=f.getAttribute("data-fav"),i=favorites.indexOf(id);if(i>=0)favorites.splice(i,1);else favorites.push(id);saveFavorites();render();}
});
$("radioPlay").addEventListener("click",function(){
 if(!current){window.JMBToast("Choose a station first.");return;}
 if(audio.paused){audio.play().then(function(){$("radioPlay").textContent="Ⅱ";}).catch(function(){$("radioPlay").textContent="▶";});}
 else{audio.pause();$("radioPlay").textContent="▶";}
});
$("stopRadio").addEventListener("click",stopPlayback);
$("radioVolume").addEventListener("input",function(){audio.volume=Number(this.value);});
audio.volume=Number($("radioVolume").value);
audio.addEventListener("playing",function(){if(current)$("nowSubtitle").textContent="Live · "+(current.country||"Worldwide");});
audio.addEventListener("waiting",function(){if(current)$("nowSubtitle").textContent="Buffering · "+(current.country||"Worldwide");});
audio.addEventListener("ended",function(){$("radioPlay").textContent="▶";if(current)$("nowSubtitle").textContent="Stream ended";});
audio.addEventListener("error",function(){if(current){$("nowSubtitle").textContent="Stream unavailable · try another station";window.JMBToast("This station is offline or its provider is blocking playback.");}$("radioPlay").textContent="▶";});
["radioCountry","radioLanguage","radioGenre","bandFilter"].forEach(function(id){$(id).addEventListener("change",load);});
$("stationSearch").addEventListener("input",function(){clearTimeout(timer);timer=setTimeout(load,350);});
$("radioRetry").addEventListener("click",load);
load();
})();