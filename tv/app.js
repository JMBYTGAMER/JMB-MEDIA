(function(){
"use strict";
var API="https://iptv-org.github.io/api/";
var $=function(id){return document.getElementById(id);};
var channels=[],streams=[],hls=null,visibleCount=180,video=$("tvVideo"),dialog=$("playerDialog"),channelGrid=$("channelGrid"),status=$("channelStatus"),programmeSection=$("programmeSection");
var programmes=[
{keys:["bigg boss malayalam","big boss malayalam","bigboss malayalam"],title:"Bigg Boss Malayalam",channels:["Asianet"],note:"Check the official broadcaster and authorised streaming service. Plans and availability vary by region.",links:[{label:"Asianet official site",url:"https://www.asianet.in/"},{label:"JioHotstar",url:"https://www.jiohotstar.com/"}]},
{keys:["bigg boss tamil","big boss tamil"],title:"Bigg Boss Tamil",channels:["Star Vijay"],note:"Use the official broadcaster or authorised streaming service. A subscription may be needed.",links:[{label:"JioHotstar",url:"https://www.jiohotstar.com/"}]},
{keys:["bigg boss hindi","big boss hindi"],title:"Bigg Boss Hindi",channels:["Colors TV"],note:"Use the official broadcaster or authorised streaming service. A subscription may be needed.",links:[{label:"Colors TV",url:"https://www.colorstv.com/"},{label:"JioHotstar",url:"https://www.jiohotstar.com/"}]},
{keys:["bigg boss","big boss"],title:"Bigg Boss — editions",channels:["Asianet","Star Vijay","Colors TV","Star Maa","Colors Kannada"],note:"Choose the language edition and check the official broadcaster. Live episodes and replay access can require a paid plan.",links:[{label:"JioHotstar",url:"https://www.jiohotstar.com/"}]}
];
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function safeUrl(s){try{var u=new URL(s);return u.protocol==="https:"||u.protocol==="http:"?u.href:"#";}catch(e){return "#";}}
function norm(s){return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();}
function fillSelect(id,values){var el=$(id),old=el.value,unique=Array.from(new Set(values.filter(Boolean))).sort(function(a,b){return String(a).localeCompare(String(b));});el.innerHTML='<option value="">All '+(id==="categoryFilter"?"categories":id==="languageFilter"?"languages":"countries")+'</option>'+unique.map(function(v){return '<option value="'+esc(v)+'">'+esc(v)+'</option>';}).join("");if(unique.indexOf(old)>=0)el.value=old;}
function officialStream(channel,stream){
 if(!channel.website||!stream.url)return false;
 try{var a=new URL(channel.website),b=new URL(stream.url);if(b.protocol!=="https:")return false;var ah=a.hostname.toLowerCase().replace(/^www\./,""),bh=b.hostname.toLowerCase().replace(/^www\./,"");return ah===bh||bh.endsWith("."+ah)||ah.endsWith("."+bh);}catch(e){return false;}
}
function streamFor(ch){return streams.find(function(s){return s.channel===ch.id&&!((s.labels||[]).some(function(l){return /geo.?blocked/i.test(l);}))&&officialStream(ch,s);});}
function showProgramMatches(q){
 var term=norm(q),found=programmes.filter(function(p){return p.keys.some(function(k){return term.length>2&&(term.indexOf(k)>=0||k.indexOf(term)>=0);});});
 if(!term||!found.length){programmeSection.classList.add("hidden");$("programmeResults").innerHTML="";return;}
 programmeSection.classList.remove("hidden");
 $("programmeResults").innerHTML=found.map(function(p){return '<article class="program-card"><h3>🎬 '+esc(p.title)+'</h3><p><b>Broadcasters:</b> '+esc(p.channels.join(" · "))+'<br>'+esc(p.note)+'</p><div class="card-actions">'+p.links.map(function(l){return '<a class="btn small secondary" href="'+safeUrl(l.url)+'" target="_blank" rel="noopener">'+esc(l.label)+' ↗</a>';}).join("")+'</div></article>';}).join("");
}
function render(){
 var q=norm($("channelSearch").value),cat=$("categoryFilter").value,lang=$("languageFilter").value,country=$("countryFilter").value,sort=$("sortFilter").value;
 showProgramMatches($("channelSearch").value);
 var list=channels.filter(function(ch){
  if(ch.is_nsfw===true)return false;
  var match=q.length<2||norm([ch.name].concat(ch.alt_names||[]).join(" ")).indexOf(q)>=0;
  return match&&(!cat||(ch.categories||[]).indexOf(cat)>=0)&&(!lang||(ch.languages||[]).indexOf(lang)>=0)&&(!country||ch.country===country);
 });
 list.sort(function(a,b){return sort==="country"?String(a.country||"").localeCompare(String(b.country||""))||a.name.localeCompare(b.name):a.name.localeCompare(b.name);});
 status.textContent=list.length.toLocaleString()+" channels found · "+channels.length.toLocaleString()+" non-mature public listings";
 if(!list.length){$("loadMoreChannels").classList.add("hidden");channelGrid.innerHTML='<div class="empty-state">No channels match those filters. Try a broader search or open the official broadcaster from the programme finder.</div>';return;}
 channelGrid.innerHTML=list.slice(0,visibleCount).map(function(ch){
  var s=streamFor(ch),cats=(ch.categories||[]).slice(0,2),langs=(ch.languages||[]).slice(0,2),site=safeUrl(ch.website);
  var initials=ch.name.split(/\s+/).slice(0,2).map(function(w){return w[0]||"";}).join("").toUpperCase();
  var button=s?'<button class="btn small" data-watch="'+esc(ch.id)+'">▶ Watch public stream</button>':(site!=="#"?'<a class="btn small secondary" href="'+site+'" target="_blank" rel="noopener">Official site ↗</a>':'<span class="tag">Official link not listed</span>');
  return '<article class="media-card"><div class="card-top"><div class="avatar">'+esc(initials)+'</div><div style="min-width:0"><div class="card-title">'+esc(ch.name)+'</div><div class="muted tiny">'+esc(ch.country||"Worldwide")+' · '+esc(langs.join(", ")||"Language not listed")+'</div></div></div><div class="tag-row">'+cats.map(function(c){return '<span class="tag">'+esc(c)+'</span>';}).join("")+'<span class="tag">Public listing</span></div><div class="card-description">'+(ch.website?'Broadcaster website available.':'No official website is listed in the directory.')+(s?' A secure public stream matched the broadcaster website.':' Playback is not enabled for unverified third-party stream links.')+'</div><div class="card-actions">'+button+(site!=="#"?'<a class="btn small ghost" href="'+site+'" target="_blank" rel="noopener">Website ↗</a>':"")+'</div></article>';
 }).join("");
 $("loadMoreChannels").classList.toggle("hidden",list.length<=visibleCount);
 $("loadMoreChannels").textContent="Load more channels ("+(list.length-visibleCount).toLocaleString()+" remaining) ↓";
}
function openPlayer(channelId){
 var ch=channels.find(function(c){return c.id===channelId;}),s=ch&&streamFor(ch);
 if(!ch||!s){window.JMBToast("No verified public stream is listed for this channel.");return;}
 $("playerTitle").textContent=ch.name;$("playerHelp").textContent="Public HTTPS stream linked to the broadcaster's own domain. Regional availability may apply.";
 if(hls){hls.destroy();hls=null;}video.pause();video.removeAttribute("src");video.load();
 if(window.Hls&&window.Hls.isSupported()&&/\.m3u8($|\?)/i.test(s.url)){
  hls=new Hls();hls.loadSource(s.url);hls.attachMedia(video);hls.on(Hls.Events.ERROR,function(_,data){if(data.fatal){$("playerHelp").textContent="This stream could not be played in this browser. Open the broadcaster's official website instead.";hls.destroy();hls=null;}});
 }else{video.src=s.url;}
 dialog.showModal();video.play().catch(function(){});
}
function closePlayer(){video.pause();if(hls){hls.destroy();hls=null;}video.removeAttribute("src");video.load();if(dialog.open)dialog.close();}
async function init(){
 try{
  var res=await Promise.all([fetch(API+"channels.json"),fetch(API+"streams.json")]);
  if(!res[0].ok||!res[1].ok)throw new Error("The channel directory is temporarily unavailable.");
  var data=await Promise.all(res.map(function(r){return r.json();}));
  channels=data[0].filter(function(ch){return ch.is_nsfw!==true;});streams=data[1].filter(function(s){return s.url&&s.channel;});
  fillSelect("categoryFilter",channels.flatMap(function(c){return c.categories||[];}));fillSelect("languageFilter",channels.flatMap(function(c){return c.languages||[];}));fillSelect("countryFilter",channels.map(function(c){return c.country;}));render();
 }catch(e){status.textContent="Could not load the live channel catalogue.";channelGrid.innerHTML='<div class="empty-state">'+esc(e.message)+' Check your connection, or browse official broadcaster websites from the programme finder.</div>';}
}
["channelSearch","categoryFilter","languageFilter","countryFilter","sortFilter"].forEach(function(id){$(id).addEventListener(id==="channelSearch"?"input":"change",function(){visibleCount=180;render();});});
$("loadMoreChannels").addEventListener("click",function(){visibleCount+=180;render();});
channelGrid.addEventListener("click",function(e){var b=e.target.closest("[data-watch]");if(b)openPlayer(b.getAttribute("data-watch"));});
$("closePlayer").addEventListener("click",closePlayer);dialog.addEventListener("click",function(e){if(e.target===dialog)closePlayer();});
var q=new URLSearchParams(location.search).get("q");if(q)$("channelSearch").value=q;
init();
})();