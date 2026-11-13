(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var featured=[
 {id:"asianet-news",name:"Asianet News",label:"Malayalam · Official YouTube live player",channelId:"UCf8w5m0YsRa8MHQ5bwSGmbw",source:"https://www.youtube.com/@asianetnews/live",authority:"Verified official YouTube channel"},
 {id:"dd-news",name:"DD News",label:"India · Prasar Bharati",channelId:"UCKwucPzHZ7zCUI7fI-Wo1g",source:"https://www.youtube.com/@DDNewsOfficial/live",authority:"Prasar Bharati channel listing"},
 {id:"dd-national",name:"DD National",label:"India · Doordarshan",channelId:"UCSjPe5kinQtwcyHcFJyyMfw",source:"https://www.youtube.com/DoordarshanNational/live",authority:"Prasar Bharati channel listing"}
];
var API="https://iptv-org.github.io/api/",channels=[],countries={},categories={},current=null,visible=60,loading=false;
function esc(v){return String(v||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function monogram(v){return String(v||"TV").split(/\s+/).filter(Boolean).slice(0,2).map(function(x){return x.charAt(0);}).join("").toUpperCase()||"TV";}
function featuredCard(x){
 return '<button class="tv-featured-card" type="button" data-watch="'+esc(x.id)+'"><span class="tv-featured-icon">'+esc(monogram(x.name))+'</span><span class="tv-featured-text"><b>'+esc(x.name)+'</b><small>'+esc(x.label)+'</small></span><span class="tv-featured-status">LIVE PLAYER</span></button>';
}
function renderFeatured(){$("featuredChannels").innerHTML=featured.map(featuredCard).join("");$("featuredCount").textContent=String(featured.length).padStart(2,"0");}
function playerUrl(feed){
 var url=new URL("https://www.youtube-nocookie.com/embed/live_stream");
 url.searchParams.set("channel",feed.channelId);
 url.searchParams.set("playsinline","1");
 url.searchParams.set("rel","0");
 url.searchParams.set("modestbranding","1");
 url.searchParams.set("origin","https://media.jmbhost.qzz.io");
 return url.href;
}
function stopPlayer(){
 var frame=$("officialPlayer");frame.src="about:blank";frame.hidden=true;
 $("playerPlaceholder").hidden=false;
}
function play(feed){
 if(!feed)return;
 current=feed;
 var frame=$("officialPlayer");
 $("playerPlaceholder").hidden=true;
 frame.title=feed.name+" — official YouTube live player";
 frame.src=playerUrl(feed);
 frame.hidden=false;
 $("playerState").textContent="OFFICIAL PLAYER LOADED";
 $("playerQuality").textContent="YOUTUBE EMBED";
 $("nowChannel").textContent=feed.name;
 $("nowSource").textContent=feed.authority+" · playback controlled by YouTube";
 $("openSource").disabled=false;
 document.querySelectorAll("[data-watch]").forEach(function(btn){btn.classList.toggle("active",btn.getAttribute("data-watch")===feed.id);});
}
$("featuredChannels").addEventListener("click",function(e){
 var b=e.target.closest("[data-watch]");if(!b)return;
 play(featured.find(function(x){return x.id===b.getAttribute("data-watch");}));
});
$("openSource").addEventListener("click",function(){
 if(current&&current.source)window.open(current.source,"_blank","noopener,noreferrer");
});
function fill(id,values,label,map){
 var el=$(id),old=el.value,items=Array.from(new Set(values.filter(Boolean))).sort(function(a,b){return String(map&&map[a]||a).localeCompare(String(map&&map[b]||b));});
 el.innerHTML='<option value="">'+esc(label)+'</option>'+items.map(function(v){return '<option value="'+esc(v)+'">'+esc(map&&map[v]||v)+'</option>';}).join("");
 if(items.indexOf(old)>=0)el.value=old;
}
function safeWebsite(raw){try{var u=new URL(raw);return u.protocol==="https:"&&!u.username&&!u.password?u.href:"";}catch(e){return "";}}
function playableFor(ch){return featured.find(function(x){return /asianet/i.test(ch.name||"")&&x.id==="asianet-news"||/dd news/i.test(ch.name||"")&&x.id==="dd-news"||/doordarshan national|dd national/i.test(ch.name||"")&&x.id==="dd-national";})||null;}
function renderDirectory(){
 var q=$("channelSearch").value.trim().toLowerCase(),country=$("countryFilter").value,category=$("categoryFilter").value;
 var rows=channels.filter(function(ch){
  var text=[ch.name,ch.network,ch.alt_names||[],countries[ch.country]||ch.country,(ch.categories||[]).map(function(x){return categories[x]||x;})].join(" ").toLowerCase();
  return (!q||text.indexOf(q)>=0)&&(!country||ch.country===country)&&(!category||(ch.categories||[]).indexOf(category)>=0);
 });
 rows.sort(function(a,b){return a.name.localeCompare(b.name);});
 $("directoryStatus").textContent=rows.length.toLocaleString()+" matching channels · "+featured.length+" official in-page players configured";
 var show=rows.slice(0,visible);
 $("channelGrid").innerHTML=show.length?show.map(function(ch){
  var feed=playableFor(ch),name=ch.name||"TV channel",meta=(countries[ch.country]||ch.country||"Country not listed")+" · "+(ch.network||((ch.categories||[]).map(function(x){return categories[x]||x;}).slice(0,1).join(", "))||"Television");
  return '<article class="tv-directory-card"><div class="tv-directory-card-top"><span class="tv-directory-monogram">'+esc(monogram(name))+'</span><div><h3>'+esc(name)+'</h3><p>'+esc(meta)+'</p></div></div><div class="tv-directory-card-footer"><button class="btn small '+(feed?"":"secondary")+'" type="button" data-watch="'+(feed?esc(feed.id):"")+'" '+(feed?"":"disabled")+'>'+(feed?"▶ Watch in JMB TV":"Official player not verified yet")+'</button></div></article>';
 }).join(""):'<div class="empty-state">No channels match the search.</div>';
 $("loadMoreChannels").hidden=rows.length<=visible;
}
async function getJson(path){var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},12000);try{var r=await fetch(API+path,{signal:controller.signal,cache:"no-store"});if(!r.ok)throw new Error("Channel directory request failed: "+r.status);return await r.json();}finally{clearTimeout(timer);}}
async function load(){
 if(loading)return;loading=true;$("directoryRefresh").disabled=true;$("directoryRefresh").textContent="Refreshing…";
 try{
  var r=await Promise.all([getJson("channels.json"),getJson("countries.json"),getJson("categories.json"),getJson("blocklist.json")]);
  countries={};categories={};
  r[1].forEach(function(x){countries[x.code]=x.name;});
  r[2].forEach(function(x){categories[x.id]=x.name;});
  var blocked=new Set(r[3].map(function(x){return x.channel;}));
  channels=r[0].filter(function(ch){return ch&&ch.name&&ch.id&&!ch.is_nsfw&&!ch.closed&&!ch.replaced_by&&!blocked.has(ch.id);});
  fill("countryFilter",channels.map(function(ch){return ch.country;}),"All countries",countries);
  fill("categoryFilter",Array.from(new Set(channels.reduce(function(a,ch){return a.concat(ch.categories||[]);},[]))),"All categories",categories);
  channels.sort(function(a,b){return a.name.localeCompare(b.name);});
  renderDirectory();
 }catch(error){
  $("directoryStatus").textContent="Channel directory temporarily unavailable.";
  $("channelGrid").innerHTML='<div class="empty-state">Could not load the channel catalogue. The featured official players remain available above.</div>';
 }finally{loading=false;$("directoryRefresh").disabled=false;$("directoryRefresh").textContent="↻ Refresh";}
}
["channelSearch","countryFilter","categoryFilter"].forEach(function(id){$(id).addEventListener(id==="channelSearch"?"input":"change",function(){visible=60;renderDirectory();});});
$("directoryRefresh").addEventListener("click",load);
$("loadMoreChannels").addEventListener("click",function(){visible+=60;renderDirectory();});
renderFeatured();load();
})();