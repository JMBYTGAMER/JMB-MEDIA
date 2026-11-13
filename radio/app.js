(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var hosts=["https://de1.api.radio-browser.info","https://nl1.api.radio-browser.info","https://at1.api.radio-browser.info"];
var cacheKey="jmb-radio-directory-v2",stations=[],favorites=readFavorites(),timer=null,sequence=0,loading=false;
function esc(v){return String(v||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function safeSite(v){try{var u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password?u.href:"";}catch(e){return "";}}
function readFavorites(){try{return JSON.parse(localStorage.getItem("jmb-radio-favorites-v2")||"[]");}catch(e){return [];}}
function saveFavorites(){try{localStorage.setItem("jmb-radio-favorites-v2",JSON.stringify(favorites));}catch(e){window.JMBToast("Browser storage is unavailable; favourites may not be saved.");}}
function safeName(s){return s&&!/(adult|erotic|porn|explicit|xxx|sex)/i.test(String(s.name||"")+" "+String(s.tags||""));}
function cleanStation(s){return {stationuuid:String(s.stationuuid||""),name:String(s.name||""),country:String(s.country||""),countrycode:String(s.countrycode||""),state:String(s.state||""),language:String(s.language||""),tags:String(s.tags||"").slice(0,300),homepage:safeSite(s.homepage),codec:String(s.codec||""),bitrate:Number(s.bitrate)||0};}
async function request(url){var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},9000);try{var r=await fetch(url,{signal:controller.signal,cache:"no-store",headers:{"Accept":"application/json"}});if(!r.ok)throw new Error("HTTP "+r.status);return await r.json();}finally{clearTimeout(timer);}}
async function api(path){var last;for(var i=0;i<hosts.length;i++){try{return await request(hosts[i]+path);}catch(e){last=e;}}throw last||new Error("Radio directory unavailable");}
function fill(id,values){var el=$(id),old=el.value,unique=Array.from(new Set(values.filter(Boolean))).sort();el.innerHTML='<option value="">'+(id==="radioCountry"?"All countries":"All languages")+'</option>'+unique.map(function(v){return '<option value="'+esc(v)+'">'+esc(v)+'</option>';}).join("");if(unique.indexOf(old)>=0)el.value=old;}
function cacheRead(){try{return JSON.parse(localStorage.getItem(cacheKey)||"{}")||{};}catch(e){return {};}}
function cacheWrite(rows){try{localStorage.setItem(cacheKey,JSON.stringify({updated:Date.now(),stations:rows.map(cleanStation)}));}catch(e){}}
function render(){
 var q=$("stationSearch").value.trim().toLowerCase(),country=$("radioCountry").value,language=$("radioLanguage").value,genre=$("radioGenre").value,band=$("bandFilter").value;
 var list=stations.filter(function(s){var blob=[s.name,s.country,s.state,s.language,s.tags].join(" ").toLowerCase();return (!q||blob.indexOf(q)>=0)&&(!country||s.country===country)&&(!language||s.language.split(",").map(function(x){return x.trim();}).indexOf(language)>=0)&&(!genre||s.tags.toLowerCase().indexOf(genre)>=0);});
 if(band==="fm")list=list.filter(function(s){return /\bfm\b/i.test(s.tags+" "+s.name);});
 if(band==="am")list=list.filter(function(s){return /\bam\b/i.test(s.tags+" "+s.name);});
 if(band==="internet")list=list.filter(function(s){return !/\b(am|fm)\b/i.test(s.tags+" "+s.name);});
 list.sort(function(a,b){var fav=favorites.indexOf(b.stationuuid)-favorites.indexOf(a.stationuuid);return fav||a.name.localeCompare(b.name);});
 $("radioStatus").textContent=list.length.toLocaleString()+" matching stations · directory information only";
 $("radioGrid").innerHTML=list.length?list.map(function(s){
  var fav=favorites.indexOf(s.stationuuid)>=0,kind=/\bfm\b/i.test(s.tags+" "+s.name)?"FM-tagged":/\bam\b/i.test(s.tags+" "+s.name)?"AM-tagged":"Internet radio listing";
  var tags=[kind,s.codec,s.bitrate?s.bitrate+" kbps":""].filter(Boolean);
  return '<article class="media-card radio-directory-card"><div class="card-top"><div class="avatar" aria-hidden="true">📻</div><div style="min-width:0;flex:1"><div class="card-title">'+esc(s.name)+'</div><div class="muted tiny">'+esc(s.country||"Country not listed")+' · '+esc(s.language||"Language not listed")+'</div></div><button class="icon-btn" data-fav="'+esc(s.stationuuid)+'" aria-label="'+(fav?"Remove favourite":"Add favourite")+'" aria-pressed="'+String(fav)+'">'+(fav?"♥":"♡")+'</button></div><div class="tag-row">'+tags.map(function(x){return '<span class="tag">'+esc(x)+'</span>';}).join("")+'</div><div class="card-description">'+esc(s.state||"Station directory entry")+' · Website links are supplied by Radio Browser and may need verification.</div><div class="card-actions">'+(s.homepage?'<a class="btn small" href="'+esc(s.homepage)+'" target="_blank" rel="noopener noreferrer">Visit listed station website ↗</a>':'<span class="btn small secondary" aria-disabled="true">No secure website listed</span>')+'</div></article>';
 }).join(""):'<div class="empty-state">No station matches these filters. Try another search or clear a filter.</div>';
}
async function load(){
 if(loading)return;loading=true;var id=++sequence;
 $("radioStatus").textContent="Loading station directory…";$("radioGrid").innerHTML='<div class="loading-state">Searching public station records <span class="loading-dot"></span></div>';
 $("radioRetry").disabled=true;$("radioRetry").textContent="Refreshing…";
 var p=new URLSearchParams(),q=$("stationSearch").value.trim(),country=$("radioCountry").value,language=$("radioLanguage").value,genre=$("radioGenre").value;
 if(q)p.set("name",q);if(country)p.set("country",country);if(language)p.set("language",language);if(genre)p.set("tag",genre);
 p.set("limit","100");p.set("order","name");p.set("reverse","false");p.set("hidebroken","true");
 try{
  var rows=await api("/json/stations/search?"+p.toString());if(id!==sequence)return;
  stations=rows.filter(safeName).map(cleanStation).filter(function(s){return s.stationuuid&&s.name;});
  cacheWrite(stations);
  fill("radioCountry",stations.map(function(s){return s.country;}));fill("radioLanguage",stations.reduce(function(a,s){return a.concat(s.language.split(",").map(function(x){return x.trim();}));},[]));
  render();
 }catch(error){
  if(id!==sequence)return;
  var saved=cacheRead();
  if(Array.isArray(saved.stations)&&saved.stations.length){stations=saved.stations.map(cleanStation);render();$("radioStatus").textContent="Directory service unavailable · showing saved station information";}
  else{$("radioStatus").textContent="Could not connect to Radio Browser";$("radioGrid").innerHTML='<div class="empty-state">The station directory is temporarily unavailable. Try refreshing later.</div>';}
 }finally{if(id===sequence){loading=false;$("radioRetry").disabled=false;$("radioRetry").textContent="↻ Refresh";}}
}
$("radioGrid").addEventListener("click",function(e){var b=e.target.closest("[data-fav]");if(!b)return;var id=b.getAttribute("data-fav"),i=favorites.indexOf(id);if(i>=0)favorites.splice(i,1);else favorites.push(id);saveFavorites();render();});
["radioCountry","radioLanguage","radioGenre","bandFilter"].forEach(function(id){$(id).addEventListener("change",load);});
$("stationSearch").addEventListener("input",function(){clearTimeout(timer);timer=setTimeout(load,350);});
$("radioRetry").addEventListener("click",load);
load();
})();