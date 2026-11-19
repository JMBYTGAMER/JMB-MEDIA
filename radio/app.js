(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var hosts=["https://de1.api.radio-browser.info","https://nl1.api.radio-browser.info","https://at1.api.radio-browser.info"];
var stations=[],audio=$("radioAudio"),current=null,favorites=loadFavorites(),timer=null,optionsLoaded=false,loadSeq=0,loadController=null;
var RADIO_CACHE_KEY="jmb-radio-directory-v1";
var TUNER_STATE_KEY="jmb-radio-tuner-v2";
var tunerBank="FM1",tunerStationCache=new Map(),tunerLookupSeq=0;
var TUNER_BANKS={
 FM1:[
  {freq:91.9,name:"Radio Mango",city:"Kochi",aliases:["radio mango","mango fm"],type:"FM"},
  {freq:93.5,name:"Red FM",city:"Kochi",aliases:["red fm"],type:"FM"},
  {freq:94.3,name:"Club FM",city:"Kochi",aliases:["club fm"],type:"FM"},
  {freq:102.3,name:"Akashvani Kochi FM",city:"Kochi",aliases:["air kochi","akashvani kochi","all india radio kochi"],type:"FM"},
  {freq:104.0,name:"Radio Mirchi",city:"Kochi",aliases:["radio mirchi","mirchi"],type:"FM"},
  {freq:107.5,name:"Akashvani Rainbow",city:"Kochi",aliases:["air rainbow","rainbow fm kochi","akashvani rainbow"],type:"FM"}
 ],
 FM2:[
  {freq:92.7,name:"Big FM",city:"Thiruvananthapuram",aliases:["big fm","big 92.7"],type:"FM"},
  {freq:93.5,name:"Red FM",city:"Thiruvananthapuram",aliases:["red fm"],type:"FM"},
  {freq:94.3,name:"Club FM",city:"Thiruvananthapuram",aliases:["club fm"],type:"FM"},
  {freq:98.3,name:"Radio Mirchi",city:"Thiruvananthapuram",aliases:["radio mirchi","mirchi"],type:"FM"},
  {freq:100.1,name:"Akashvani Punalur Relay",city:"Punalur",aliases:["air punalur","akashvani punalur","all india radio punalur"],type:"FM"},
  {freq:101.1,name:"Akashvani Thrissur",city:"Thrissur",aliases:["air thrissur","akashvani thrissur","all india radio thrissur"],type:"FM"},
  {freq:101.9,name:"Akashvani Ananthapuri",city:"Thiruvananthapuram",aliases:["air trivandrum","akashvani thiruvananthapuram","ananthapuri fm"],type:"FM"},
  {freq:91.1,name:"Red FM",city:"Thrissur",aliases:["red fm"],type:"FM"},
  {freq:91.9,name:"Radio Mango",city:"Thrissur",aliases:["radio mango","mango fm"],type:"FM"},
  {freq:104.8,name:"Club FM",city:"Thrissur",aliases:["club fm"],type:"FM"}
 ],
 AM1:[
  {freq:576,name:"Akashvani Alappuzha",city:"Alappuzha",aliases:["air alleppey","air alappuzha","akashvani alleppey","all india radio alappuzha"],type:"AM"},
  {freq:630,name:"Akashvani Thrissur",city:"Thrissur",aliases:["air thrissur","akashvani thrissur","all india radio thrissur"],type:"AM"}
 ],
 AM2:[
  {freq:684,name:"Akashvani Kozhikode",city:"Kozhikode",aliases:["air calicut","air kozhikode","akashvani kozhikode","all india radio calicut"],type:"AM"},
  {freq:1161,name:"Akashvani Thiruvananthapuram",city:"Thiruvananthapuram",aliases:["air trivandrum","air thiruvananthapuram","akashvani trivandrum","all india radio thiruvananthapuram"],type:"AM"}
 ]
};
var TUNER_DEFAULT={FM1:91.9,FM2:98.3,AM1:576,AM2:684};
var tunerFrequency=TUNER_DEFAULT.FM1;
function esc(s){return String(s||"").replace(/[&<>\"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function safeUrl(s){var raw=String(s||"").trim();if(!raw)return "";try{var u=new URL(raw);return u.protocol==="https:"&&!u.username&&!u.password?u.href:"";}catch(e){return "";}}
function textValue(value,max){return String(value||"").replace(/\s+/g," ").trim().slice(0,max);}
function normalizeStation(s){
 if(!s||!s.stationuuid||!s.name)return null;
 var name=textValue(s.name,150),tags=textValue(s.tags,220),stream=safeUrl(s.url_resolved);
 if(!name||!stream||/(adult|erotic|porn|explicit|xxx|sex)/i.test(name+" "+tags))return null;
 return {stationuuid:textValue(s.stationuuid,80),name:name,url_resolved:stream,favicon:safeUrl(s.favicon),country:textValue(s.country,90),state:textValue(s.state,90),language:textValue(s.language,100),tags:tags,codec:textValue(s.codec,24),bitrate:Math.max(0,Math.min(100000,Number(s.bitrate)||0)),clickcount:Math.max(0,Number(s.clickcount)||0)};
}
function loadDirectoryCache(){try{var data=JSON.parse(localStorage.getItem(RADIO_CACHE_KEY)||"[]");return Array.isArray(data)?data.map(normalizeStation).filter(Boolean).slice(0,200):[];}catch(e){return [];}}
function saveDirectoryCache(list){try{var merged=new Map();(list||[]).forEach(function(s){var clean=normalizeStation(s);if(clean&&!merged.has(clean.stationuuid))merged.set(clean.stationuuid,clean);});loadDirectoryCache().forEach(function(s){if(!merged.has(s.stationuuid))merged.set(s.stationuuid,s);});localStorage.setItem(RADIO_CACHE_KEY,JSON.stringify(Array.from(merged.values()).slice(0,200)));}catch(e){}}
function loadFavorites(){try{return JSON.parse(localStorage.getItem("jmb-radio-favorites")||"[]");}catch(e){return [];}}
function saveFavorites(){try{localStorage.setItem("jmb-radio-favorites",JSON.stringify(favorites));}catch(e){window.JMBToast("Browser storage is unavailable; favourites may not be saved.");}}
function safeStation(s){return !/(adult|erotic|porn|explicit|xxx|sex)/i.test(String(s.tags||""))&&!/(adult|erotic|porn|explicit|xxx|sex)/i.test(String(s.name||""));}
function fill(id,values){var el=$(id),old=el.value;Array.from(new Set(values.filter(Boolean))).sort().forEach(function(v){if(!Array.from(el.options).some(function(o){return o.value===v;}))el.insertAdjacentHTML("beforeend",'<option value="'+esc(v)+'">'+esc(v)+'</option>');});if(Array.from(el.options).some(function(o){return o.value===old;}))el.value=old;}
async function api(path,signal){
 var last;
 for(var i=0;i<hosts.length;i++){
  var ctl=new AbortController(),timer=setTimeout(function(c){return function(){c.abort();};}(ctl),9000);
  var abort=function(){ctl.abort();};
  if(signal){if(signal.aborted)ctl.abort();else signal.addEventListener("abort",abort,{once:true});}
  try{var r=await fetch(hosts[i]+path,{headers:{"Accept":"application/json"},signal:ctl.signal});if(!r.ok)throw new Error("Radio directory unavailable (HTTP "+r.status+")");return await r.json();}
  catch(e){last=e;if(signal&&signal.aborted)throw e;}
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
function presetForFrequency(freq){var bank=TUNER_BANKS[tunerBank]||[];return bank.find(function(p){return Math.abs(p.freq-freq)<(p.type==="FM"?0.051:0.6);})||null;}
function bankRange(bank){return bank.indexOf("FM")===0?{min:87.5,max:108,step:0.1,unit:"MHz"}:{min:531,max:1602,step:9,unit:"kHz"};}
function saveTunerState(){try{localStorage.setItem(TUNER_STATE_KEY,JSON.stringify({bank:tunerBank,frequency:tunerFrequency}));}catch(e){}}
function fmtFrequency(value,bank){return bank.indexOf("FM")===0?Number(value).toFixed(1):String(Math.round(value));}
function renderPresetButtons(){
 var list=TUNER_BANKS[tunerBank]||[];
 $("tunerPresets").innerHTML=list.map(function(p,i){
  var active=Math.abs(p.freq-tunerFrequency)<0.051;
  return '<button type="button" class="tuner-preset'+(active?' is-active':'')+'" data-tuner-preset="'+i+'"><b>'+fmtFrequency(p.freq,tunerBank)+' '+(p.type==="FM"?"MHz":"kHz")+'</b><span>'+esc(p.name)+'</span><small>'+esc(p.city)+'</small></button>';
 }).join("");
}
function updateTunerReadout(){
 var bankRangeValue=bankRange(tunerBank),preset=presetForFrequency(tunerFrequency);
 $("tunerFrequency").textContent=fmtFrequency(tunerFrequency,tunerBank);
 $("tunerUnit").textContent=bankRangeValue.unit;
 $("tunerBand").textContent=tunerBank;
 $("tunerDial").min=bankRangeValue.min;$("tunerDial").max=bankRangeValue.max;$("tunerDial").step=bankRangeValue.step;$("tunerDial").value=tunerFrequency;
 $("tunerRangeMin").textContent=fmtFrequency(bankRangeValue.min,tunerBank);$("tunerRangeMax").textContent=fmtFrequency(bankRangeValue.max,tunerBank);
 $("tunerKnob").style.setProperty("--knob-angle",(-135+270*((tunerFrequency-bankRangeValue.min)/(bankRangeValue.max-bankRangeValue.min)))+"deg");
 $("tunerKnob").setAttribute("aria-valuemin",String(bankRangeValue.min));$("tunerKnob").setAttribute("aria-valuemax",String(bankRangeValue.max));$("tunerKnob").setAttribute("aria-valuenow",String(tunerFrequency));
 $("tunerStationName").textContent=preset?preset.name+" · "+preset.city:"No preset at this frequency";
 $("tunerMatchStatus").textContent=preset?"Frequency preset · online stream check required":"Move the dial to a marked station frequency";
 var cachedPreset=preset?(tunerStationCache.get(tunerBank+":"+preset.freq+":"+preset.city)||findCachedPreset(preset)):null;
 $("tunerPlay").disabled=!preset;
 $("tunerPlay").removeAttribute("data-tuner-ready");
 $("tunerPlay").textContent=!preset?"No station at this frequency":cachedPreset?"▶ Listen to "+cachedPreset.name:"Find online stream";
 document.querySelectorAll("[data-tuner-bank]").forEach(function(b){var active=b.getAttribute("data-tuner-bank")===tunerBank;b.classList.toggle("is-active",active);b.setAttribute("aria-pressed",String(active));});
 renderPresetButtons();
}
function setTunerBank(bank){
 if(!TUNER_BANKS[bank])return;
 tunerBank=bank;
 try{var saved=JSON.parse(localStorage.getItem(TUNER_STATE_KEY)||"{}");}catch(e){var saved={};}
 var range=bankRange(bank),def=saved.bank===bank&&Number.isFinite(Number(saved.frequency))?Number(saved.frequency):TUNER_DEFAULT[bank];
 tunerFrequency=Math.max(range.min,Math.min(range.max,Math.round(def/range.step)*range.step));
 updateTunerReadout();saveTunerState();
 $("tunerMatchStatus").textContent="Choose a frequency preset or turn the dial.";
}
function setTunerFrequency(value,lookup){
 var range=bankRange(tunerBank),steps=Math.round((Number(value)-range.min)/range.step);
 tunerFrequency=Math.max(range.min,Math.min(range.max,Number((range.min+steps*range.step).toFixed(1))));
 updateTunerReadout();saveTunerState();
 if(lookup)resolveTunerPreset();
}
function findCachedPreset(preset){
 if(!preset)return null;
 var candidates=stations.concat(loadDirectoryCache());
 var aliases=preset.aliases.map(function(x){return x.toLowerCase();});
 var matches=candidates.filter(function(s){var name=s.name.toLowerCase();return aliases.some(function(a){return name===a||name.indexOf(a)>=0;});});
 var city=preset.city.toLowerCase();
 return matches.find(function(s){return (s.state||"").toLowerCase().indexOf(city)>=0||s.name.toLowerCase().indexOf(city)>=0;})||matches[0]||null;
}
async function findPresetStream(preset){
 var key=tunerBank+":"+preset.freq+":"+preset.city;
 if(tunerStationCache.has(key))return tunerStationCache.get(key);
 var p=new URLSearchParams();p.set("name",preset.aliases[0]);p.set("country","India");p.set("hidebroken","true");p.set("order","clickcount");p.set("reverse","true");p.set("limit","30");
 try{
  var results=await api("/json/stations/search?"+p.toString());
  var valid=results.map(normalizeStation).filter(Boolean).filter(safeStation);
  var aliasNames=preset.aliases.map(function(x){return x.toLowerCase();});
  var matched=valid.filter(function(s){var n=s.name.toLowerCase();return aliasNames.some(function(a){return n===a||n.indexOf(a)>=0;});});
  var city=preset.city.toLowerCase();
  var station=matched.find(function(s){return (s.state||"").toLowerCase().indexOf(city)>=0||s.name.toLowerCase().indexOf(city)>=0;})||matched[0]||null;
  if(station&&!stations.some(function(x){return x.stationuuid===station.stationuuid;})){stations.unshift(station);stations=stations.slice(0,240);saveDirectoryCache(stations);}
  tunerStationCache.set(key,station);
  return station;
 }catch(e){return null;}
}
async function resolveTunerPreset(){
 var seq=++tunerLookupSeq,preset=presetForFrequency(tunerFrequency);
 if(!preset){$("tunerMatchStatus").textContent="No listed broadcast at this frequency.";return null;}
 $("tunerMatchStatus").textContent="Looking for an online stream for "+preset.name+"…";
 $("tunerPlay").disabled=true;
 var station=findCachedPreset(preset)||await findPresetStream(preset);
 if(seq!==tunerLookupSeq)return null;
 if(station){
  tunerStationCache.set(tunerBank+":"+preset.freq+":"+preset.city,station);
  $("tunerMatchStatus").textContent="Online stream found · "+station.name;
  $("tunerPlay").disabled=false;$("tunerPlay").textContent="▶ Listen to "+station.name;
  $("tunerPlay").setAttribute("data-tuner-ready","true");
 }else{
  $("tunerMatchStatus").textContent="Frequency verified, but no matching internet stream is listed right now. Try the station search below.";
  $("tunerPlay").disabled=true;$("tunerPlay").textContent="Online stream unavailable";
  $("tunerPlay").removeAttribute("data-tuner-ready");
 }
 return station;
}
function tunePreset(index){
 var preset=(TUNER_BANKS[tunerBank]||[])[index];if(!preset)return;
 setTunerFrequency(preset.freq,false);
 resolveTunerPreset();
}
function initTuner(){
 var saved={};try{saved=JSON.parse(localStorage.getItem(TUNER_STATE_KEY)||"{}");}catch(e){}
 tunerBank=TUNER_BANKS[saved.bank]?saved.bank:"FM1";
 setTunerBank(tunerBank);
 document.querySelectorAll("[data-tuner-bank]").forEach(function(b){b.addEventListener("click",function(){setTunerBank(b.getAttribute("data-tuner-bank"));resolveTunerPreset();});});
 $("tunerDial").addEventListener("input",function(){setTunerFrequency(this.value,false);});
 $("tunerDial").addEventListener("change",resolveTunerPreset);
 $("tunerDown").addEventListener("click",function(){setTunerFrequency(tunerFrequency-bankRange(tunerBank).step,true);});
 $("tunerUp").addEventListener("click",function(){setTunerFrequency(tunerFrequency+bankRange(tunerBank).step,true);});
 $("tunerPresets").addEventListener("click",function(e){var b=e.target.closest("[data-tuner-preset]");if(b)tunePreset(Number(b.getAttribute("data-tuner-preset")));});
 $("tunerPlay").addEventListener("click",async function(){
  var preset=presetForFrequency(tunerFrequency);if(!preset)return;
  var station=findCachedPreset(preset)||await findPresetStream(preset);
  if(station)play(station);else $("tunerMatchStatus").textContent="No matching internet stream was found. Try the station directory search.";
 });
 var knob=$("tunerKnob"),drag=null;
 knob.addEventListener("pointerdown",function(e){drag={id:e.pointerId,y:e.clientY,value:tunerFrequency};knob.setPointerCapture(e.pointerId);e.preventDefault();});
 knob.addEventListener("pointermove",function(e){if(!drag||drag.id!==e.pointerId)return;var range=bankRange(tunerBank);setTunerFrequency(drag.value+(drag.y-e.clientY)*range.step/3,false);});
 function finish(e){if(drag&&drag.id===e.pointerId){drag=null;resolveTunerPreset();}}
 knob.addEventListener("pointerup",finish);knob.addEventListener("pointercancel",function(){drag=null;});
 knob.addEventListener("keydown",function(e){var step=bankRange(tunerBank).step;if(e.key==="ArrowUp"||e.key==="ArrowRight"){e.preventDefault();setTunerFrequency(tunerFrequency+step,true);}if(e.key==="ArrowDown"||e.key==="ArrowLeft"){e.preventDefault();setTunerFrequency(tunerFrequency-step,true);}});
 resolveTunerPreset();
}
async function load(){
 var retry=$("radioRetry"),seq=++loadSeq;if(retry){retry.disabled=true;retry.textContent="Refreshing…";}
 if(loadController)loadController.abort();loadController=new AbortController();var signal=loadController.signal;
 $("radioStatus").textContent="Searching radio stations…";$("radioGrid").innerHTML='<div class="loading-state" role="status">Searching stations… <span class="loading-dot"></span></div>';
 try{
  var jobs=[api(queryUrl(),signal)];if(!optionsLoaded){jobs.push(api("/json/countries?order=name&reverse=false",signal));jobs.push(api("/json/languages?order=name&reverse=false",signal));}
  var results=await Promise.all(jobs);if(seq!==loadSeq)return;
  stations=results[0].map(normalizeStation).filter(Boolean).filter(safeStation);saveDirectoryCache(stations);
  if(!optionsLoaded){fill("radioCountry",results[1].map(function(x){return x.name;}));fill("radioLanguage",results[2].map(function(x){return x.name;}));optionsLoaded=true;}
  render();$("radioStatus").textContent+=" · live directory";if(retry){retry.disabled=false;retry.textContent="↻ Refresh stations";}
 }catch(e){
  if(seq!==loadSeq)return;stations=loadDirectoryCache();
  if(stations.length){render();$("radioStatus").textContent=$("radioStatus").textContent+" · saved offline directory";}
  else{$("radioStatus").textContent="Could not connect to Radio Browser.";$("radioGrid").innerHTML='<div class="empty-state" role="status"><strong>The station directory is temporarily unavailable.</strong><p>Check your connection and try again. Your favourites are kept on this device.</p></div>';}
  if(retry){retry.disabled=false;retry.textContent="↻ Try again";}
 }
}
function play(s){
 var stream=s&&safeUrl(s.url_resolved);if(!stream){window.JMBToast("This station does not provide a secure HTTPS stream.");return;}
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
$("radioPlay").addEventListener("click",function(){if(!current){window.JMBToast("Choose a station first.");return;}if(audio.paused)audio.play().catch(function(){window.JMBToast("This station could not resume.");});else audio.pause();});
$("stopRadio").addEventListener("click",function(){audio.pause();audio.removeAttribute("src");audio.load();current=null;$("nowTitle").textContent="Choose a station";$("nowSubtitle").textContent="JMB Radio player";$("radioPlay").textContent="▶";});
$("radioVolume").addEventListener("input",function(){audio.volume=Number(this.value);});
audio.addEventListener("playing",function(){$("radioPlay").textContent="Ⅱ";});
audio.addEventListener("pause",function(){$("radioPlay").textContent="▶";});
audio.addEventListener("ended",function(){$("radioPlay").textContent="▶";});
audio.addEventListener("error",function(){if(current)window.JMBToast("This station stream is offline or blocked by its provider.");$("radioPlay").textContent="▶";});
["radioCountry","radioLanguage","radioGenre","bandFilter"].forEach(function(id){$(id).addEventListener("change",load);});
$("favoritesOnly").addEventListener("change",render);
$("radioRetry").addEventListener("click",load);
var initialQuery=new URLSearchParams(location.search).get("q");if(initialQuery)$("stationSearch").value=initialQuery.slice(0,120);
$("stationSearch").addEventListener("input",function(){clearTimeout(timer);timer=setTimeout(load,350);});
window.addEventListener("online",function(){load();});
initTuner();load();
})();