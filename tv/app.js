(function(){
"use strict";
var API="https://iptv-org.github.io/api/";
var $=function(id){return document.getElementById(id);};
var channels=[],streams=[],logos={},countries={},categories={},languageNames={},feedsByChannel={},hls=null,currentStreams=[],video=$("tvVideo"),dialog=$("playerDialog"),channelGrid=$("channelGrid"),status=$("channelStatus"),visibleCount=90;
var programmes=[
 {keys:["bigg boss malayalam","big boss malayalam","bigboss malayalam"],title:"Bigg Boss Malayalam",broadcasters:["Asianet"],description:"JMB TV will play this programme here only when an authorised public stream is listed and available. Subscription-protected broadcasts cannot be unlocked by this directory."},
 {keys:["bigg boss tamil","big boss tamil","bigboss tamil"],title:"Bigg Boss Tamil",broadcasters:["Star Vijay"],description:"The programme can be matched to its broadcaster, but JMB TV does not currently have a verified public in-page stream for it."},
 {keys:["bigg boss hindi","big boss hindi","bigboss hindi"],title:"Bigg Boss Hindi",broadcasters:["Colors TV"],description:"The programme can be matched to its broadcaster, but JMB TV does not currently have a verified public in-page stream for it."},
 {keys:["bigg boss","big boss"],title:"Bigg Boss — editions",broadcasters:["Asianet","Star Vijay","Colors TV","Star Maa","Colors Kannada"],description:"Choose the language edition. JMB TV shows an in-page Play button only when the broadcaster has an authorised public stream."}
];
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function norm(s){return String(s||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();}
function isHttpUrl(raw){try{var u=new URL(raw);return (u.protocol==="https:"||u.protocol==="http:")&&!!u.hostname;}catch(e){return false;}}
function isHttps(raw){try{return new URL(raw).protocol==="https:";}catch(e){return false;}}
function validChannel(ch){
 var name=String(ch.name||"").trim();
 if(ch.is_nsfw===true||ch.closed||ch.replaced_by||name.length<2)return false;
 if(!/^[\p{L}\p{N}¡]/u.test(name))return false;
 if(/^(unknown|undefined|null|insert|test channel|n\/a|none)$/i.test(name))return false;
 if(!/[\p{L}\p{N}]/u.test(name))return false;
 return true;
}
function domainMatches(website,streamUrl){
 try{
  var a=new URL(website),b=new URL(streamUrl);
  if(a.protocol!=="https:"&&a.protocol!=="http:")return false;
  if(b.protocol!=="https:")return false;
  var ah=a.hostname.toLowerCase().replace(/^www\./,""),bh=b.hostname.toLowerCase().replace(/^www\./,"");
  return ah===bh||bh.endsWith("."+ah)||ah.endsWith("."+bh);
 }catch(e){return false;}
}
function eligibleStream(ch,s){
 if(!s||!s.url||!isHttps(s.url)||!ch.website||!domainMatches(ch.website,s.url))return false;
 if(s.referrer||s.user_agent)return false;
 var labels=(s.labels||[]).map(function(x){return String(x).toLowerCase();});
 if(labels.some(function(x){return x.indexOf("geo-blocked")>=0||x.indexOf("adult")>=0||x.indexOf("blocked")>=0;}))return false;
 if(!/\.m3u8($|\?)/i.test(s.url)&&!/\.mp4($|\?)/i.test(s.url))return false;
 return true;
}
function qualityRank(s){var q=String(s.quality||"").toLowerCase(),m=q.match(/(\d{3,4})p/);if(m)return Number(m[1]);if(/uhd|4k/.test(q))return 2160;if(/hd/.test(q))return 720;return 0;}
function languageList(ch){
 var f=feedsByChannel[ch.id]||[],codes=[];
 f.forEach(function(feed){(feed.languages||[]).forEach(function(code){if(codes.indexOf(code)<0)codes.push(code);});});
 return codes.map(function(code){return languageNames[code]||code;});
}
function categoryList(ch){return (ch.categories||[]).map(function(code){return categories[code]||code;});}
function countryName(ch){return countries[ch.country]||ch.country||"Worldwide";}
function logoFor(ch){
 var options=logos[ch.id]||[];
 if(!options.length)return "";
 var chosen=options.find(function(l){return l.in_use===true;})||options[0];
 return isHttps(chosen.url)?chosen.url:"";
}
function streamsFor(ch){
 return streams.filter(function(s){return s.channel===ch.id&&eligibleStream(ch,s);}).sort(function(a,b){return qualityRank(b)-qualityRank(a);});
}
function fillSelect(id,values,label){
 var el=$(id),old=el.value,unique=Array.from(new Set(values.filter(Boolean))).sort(function(a,b){return String(a).localeCompare(String(b));});
 el.innerHTML='<option value="">'+esc(label)+'</option>'+unique.map(function(v){return '<option value="'+esc(v)+'">'+esc(v)+'</option>';}).join("");
 if(unique.indexOf(old)>=0)el.value=old;
}
function initials(name){return String(name||"TV").split(/\s+/).slice(0,2).map(function(w){return w.charAt(0);}).join("").toUpperCase();}
function channelSearchText(ch){return [ch.name].concat(ch.alt_names||[]).concat(ch.network||[]).concat(ch.owners||[]).join(" ");}
function renderProgramme(q){
 var term=norm(q),matches=programmes.filter(function(p){return term.length>2&&p.keys.some(function(k){return k.indexOf(term)>=0||term.indexOf(k)>=0;});});
 if(!term||!matches.length){$("programmeSection").classList.add("hidden");$("programmeResults").innerHTML="";return;}
 $("programmeSection").classList.remove("hidden");
 $("programmeResults").innerHTML=matches.map(function(p){
  var found=p.broadcasters.map(function(name){
   var ch=channels.find(function(c){return norm(c.name)===norm(name)||((c.alt_names||[]).some(function(a){return norm(a)===norm(name); }));});
   var ss=ch?streamsFor(ch):[];
   return {name:name,channel:ch,streams:ss};
  });
  var tags=found.map(function(item){return '<div class="tv-program-channel"><span>'+esc(item.name)+'</span>'+(item.streams.length?'<button class="tv-watch-btn" data-play="'+esc(item.channel.id)+'">▶ Watch here</button>':'<span class="tv-unavailable">Not playable here</span>')+'</div>';}).join("");
  return '<article class="tv-program-card"><div class="tv-program-icon">🎬</div><div class="tv-program-body"><span class="page-kicker">PROGRAMME MATCH</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.description)+'</p><div class="tv-program-channels">'+tags+'</div></div></article>';
 }).join("");
}
function render(){
 var q=norm($("channelSearch").value),cat=$("categoryFilter").value,lang=$("languageFilter").value,country=$("countryFilter").value,availability=$("availabilityFilter").value,sort=$("sortFilter").value;
 renderProgramme($("channelSearch").value);
 var list=channels.filter(function(ch){
  var words=norm(channelSearchText(ch)),match=!q||words.indexOf(q)>=0;
  var channelLangs=languageList(ch),channelCats=categoryList(ch);
  return match&&(!cat||channelCats.indexOf(cat)>=0)&&(!lang||channelLangs.indexOf(lang)>=0)&&(!country||countryName(ch)===country)&&(!availability||streamsFor(ch).length>0);
 });
 if(sort==="name")list.sort(function(a,b){return a.name.localeCompare(b.name);});
 else if(sort==="country")list.sort(function(a,b){return countryName(a).localeCompare(countryName(b))||a.name.localeCompare(b.name);});
 else list.sort(function(a,b){return (streamsFor(b).length>0)-(streamsFor(a).length>0)||a.name.localeCompare(b.name);});
 var playable=channels.filter(function(ch){return streamsFor(ch).length>0;}).length;
 var hd=channels.filter(function(ch){return streamsFor(ch).some(function(s){return qualityRank(s)>=720;});}).length;
 $("totalCount").textContent=channels.length.toLocaleString();
 $("playableCount").textContent=playable.toLocaleString();
 $("hdCount").textContent=hd.toLocaleString();
 status.textContent=list.length.toLocaleString()+" matching channels · "+list.filter(function(ch){return streamsFor(ch).length>0;}).length.toLocaleString()+" playable in JMB TV";
 if(!list.length){$("loadMoreChannels").classList.add("hidden");channelGrid.innerHTML='<div class="empty-state">No channels match those filters. Try clearing a filter or searching a different channel name.</div>';return;}
 channelGrid.innerHTML=list.slice(0,visibleCount).map(function(ch){
  var ss=streamsFor(ch),best=ss[0],logo=logoFor(ch),langs=languageList(ch).slice(0,2),cats=categoryList(ch).slice(0,2),quality=best&&best.quality?best.quality.toUpperCase():"PUBLIC STREAM";
  var brand=logo?'<img class="tv-channel-logo" src="'+esc(logo)+'" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><span class="tv-channel-fallback" style="display:none">'+esc(initials(ch.name))+'</span>':'<span class="tv-channel-fallback">'+esc(initials(ch.name))+'</span>';
  var action=ss.length?'<button class="tv-watch-btn tv-watch-primary" data-play="'+esc(ch.id)+'">▶ Watch on JMB TV</button>':'<button class="tv-watch-btn tv-watch-disabled" type="button" disabled>Unavailable in player</button>';
  var qualityBadge=ss.length?'<span class="tv-badge tv-badge-live"><i></i> PLAYABLE</span><span class="tv-badge tv-badge-quality">'+esc(quality)+'</span>':'<span class="tv-badge tv-badge-off">NOT AVAILABLE HERE</span>';
  return '<article class="tv-channel-card"><div class="tv-card-main"><div class="tv-channel-brand">'+brand+'</div><div class="tv-channel-info"><h3>'+esc(ch.name)+'</h3><p>'+esc(countryName(ch))+' <span>·</span> '+esc(langs.join(", ")||"Language not listed")+'</p></div></div><div class="tv-channel-tags">'+cats.map(function(c){return '<span>'+esc(c)+'</span>';}).join("")+'</div><div class="tv-card-status">'+qualityBadge+'</div><div class="tv-card-footer">'+action+'<span class="tv-card-caption">'+(ss.length?"Plays inside this website":"No authorised public in-page stream found")+'</span></div></article>';
 }).join("");
 var remaining=list.length-visibleCount;
 $("loadMoreChannels").classList.toggle("hidden",remaining<=0);
 $("loadMoreChannels").textContent=remaining>0?"Load more channels · "+remaining.toLocaleString()+" left":"All matching channels shown";
}
function setupQualityOptions(){
 var select=$("qualitySelect");select.innerHTML="";
 currentStreams.forEach(function(s,i){
  var label=s.quality?String(s.quality).toUpperCase():"Stream "+(i+1);
  if(s.title)label+=" · "+s.title;
  var op=document.createElement("option");op.value=String(i);op.textContent=label;select.appendChild(op);
 });
 select.classList.toggle("hidden",currentStreams.length<2);
}
function stopMedia(){
 video.pause();
 if(hls){hls.destroy();hls=null;}
 video.removeAttribute("src");video.load();
}
function setStream(index){
 var s=currentStreams[index];if(!s)return;
 stopMedia();
 $("playerLoading").classList.remove("hidden");
 $("playerHelp").textContent="Connecting · "+(s.quality||"quality not specified")+" · stream is served by the broadcaster.";
 if(/\.m3u8($|\?)/i.test(s.url)){
  if(window.Hls&&window.Hls.isSupported()){
   hls=new Hls({enableWorker:true,lowLatencyMode:false,capLevelToPlayerSize:true});
   hls.attachMedia(video);
   hls.on(Hls.Events.MEDIA_ATTACHED,function(){hls.loadSource(s.url);});
   hls.on(Hls.Events.MANIFEST_PARSED,function(){ $("playerLoading").classList.add("hidden");video.play().catch(function(){});});
   hls.on(Hls.Events.ERROR,function(_,data){if(data.fatal){$("playerLoading").classList.add("hidden");$("playerHelp").textContent="This public stream could not play in your browser. It may be offline or the broadcaster may not allow browser playback. No external website was opened.";stopMedia();}});
  }else if(video.canPlayType("application/vnd.apple.mpegurl")){video.src=s.url;video.play().catch(function(){});}
  else{$("playerLoading").classList.add("hidden");$("playerHelp").textContent="This device does not support this stream format.";}
 }else{video.src=s.url;video.play().catch(function(){});}
}
function openPlayer(id){
 var ch=channels.find(function(c){return c.id===id;});if(!ch)return;
 currentStreams=streamsFor(ch);
 if(!currentStreams.length){window.JMBToast("This channel has no authorised public stream for in-page playback.");return;}
 $("playerTitle").textContent=ch.name;
 $("playerMeta").textContent=countryName(ch)+" · "+(languageList(ch).join(", ")||"Language not listed");
 setupQualityOptions();
 $("playerLoading").classList.remove("hidden");
 dialog.showModal();
 setStream(0);
}
function closePlayer(){stopMedia();if(dialog.open)dialog.close();$("playerLoading").classList.add("hidden");}
async function getJson(path,required){
 try{var r=await fetch(API+path,{cache:"force-cache"});if(!r.ok)throw new Error("Could not load "+path);return await r.json();}
 catch(e){if(required)throw e;return [];}
}
function mapBy(list,key,transform){
 var map={};list.forEach(function(item){var id=item[key];if(!id)return;var value=transform?transform(item):item;if(!map[id])map[id]=[];map[id].push(value);});return map;
}
async function init(){
 try{
  var results=await Promise.all([
   getJson("channels.json",true),getJson("streams.json",true),getJson("logos.json",false),
   getJson("feeds.json",false),getJson("countries.json",false),getJson("categories.json",false),getJson("languages.json",false)
  ]);
  channels=results[0].filter(validChannel);
  streams=results[1].filter(function(s){return s&&s.channel&&s.url;});
  logos=mapBy(results[2].filter(function(l){return l&&l.in_use!==false&&isHttps(l.url);}),"channel");
  feedsByChannel=mapBy(results[3],"channel");
  results[4].forEach(function(c){if(c.code)countries[c.code]=c.name;});
  results[5].forEach(function(c){if(c.id)categories[c.id]=c.name;});
  results[6].forEach(function(l){if(l.code)languageNames[l.code]=l.name;});
  fillSelect("categoryFilter",Object.keys(categories).map(function(k){return categories[k];}),"All categories");
  fillSelect("languageFilter",Object.keys(languageNames).map(function(k){return languageNames[k];}),"All languages");
  fillSelect("countryFilter",Object.keys(countries).map(function(k){return countries[k];}),"All countries");
  render();
 }catch(e){
  status.textContent="The channel catalogue could not be loaded.";
  channelGrid.innerHTML='<div class="empty-state">JMB TV could not connect to its public channel directory. Check your internet connection and reload the page.</div>';
 }
}
["channelSearch","categoryFilter","languageFilter","countryFilter","availabilityFilter","sortFilter"].forEach(function(id){
 $(id).addEventListener(id==="channelSearch"?"input":"change",function(){visibleCount=90;render();});
});
$("loadMoreChannels").addEventListener("click",function(){visibleCount+=90;render();});
channelGrid.addEventListener("click",function(e){var button=e.target.closest("[data-play]");if(button)openPlayer(button.getAttribute("data-play"));});
$("programmeResults").addEventListener("click",function(e){var button=e.target.closest("[data-play]");if(button)openPlayer(button.getAttribute("data-play"));});
$("qualitySelect").addEventListener("change",function(){var n=Number(this.value);if(Number.isInteger(n))setStream(n);});
$("closePlayer").addEventListener("click",closePlayer);
dialog.addEventListener("click",function(e){if(e.target===dialog)closePlayer();});
dialog.addEventListener("close",function(){stopMedia();});
video.addEventListener("playing",function(){$("playerLoading").classList.add("hidden");});
video.addEventListener("error",function(){if(dialog.open){$("playerLoading").classList.add("hidden");$("playerHelp").textContent="The broadcaster stream is offline, blocked, or incompatible with this browser. Try another channel when available.";}});

/* Match the shared-site search shortcut on the standalone JMB TV app. */
var channelSearchInput = $("channelSearch");
if (channelSearchInput) {
  channelSearchInput.setAttribute("aria-keyshortcuts", "/");
  channelSearchInput.title = (channelSearchInput.title ? channelSearchInput.title + " · " : "") + "Press / to focus search";
  document.addEventListener("keydown", function(e) {
    if (e.defaultPrevented || e.isComposing || e.altKey || e.ctrlKey || e.metaKey || e.key !== "/") return;
    var target = e.target;
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName || ""))) return;
    e.preventDefault();
    channelSearchInput.focus();
  });
}

var q=new URLSearchParams(location.search).get("q");if(q)$("channelSearch").value=q;
init();
})();