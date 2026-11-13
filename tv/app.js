(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var API="https://iptv-org.github.io/api/";
var featured=[
 {id:"AsianetNews.in",name:"Asianet News",channelId:"UCf8w5m0YsRa8MHQ5bwSGmbw",country:"IN",language:"Malayalam",category:"News",quality:"Official YouTube live player",sourceName:"Asianet News verified YouTube channel",aliases:["asianet news","asianetnews"]},
 {id:"DDNews.in",name:"DD News",channelId:"UCKwucPzHZ7zCUI7fI-Wo1g",country:"IN",language:"Hindi / English",category:"News",quality:"Official YouTube live player",sourceName:"Prasar Bharati channel directory",aliases:["dd news"]},
 {id:"DDNational.in",name:"DD National",channelId:"UCSjPe5kinQtwcyHcFJyyMfw",country:"IN",language:"Hindi",category:"General",quality:"Official YouTube live player",sourceName:"Prasar Bharati channel directory",aliases:["dd national","doordarshan national"]},
 {id:"DDMalayalam.in",name:"DD Malayalam",channelId:"UC4--pPs1CVZvs6OuuhfjdwQ",country:"IN",language:"Malayalam",category:"General",quality:"Official YouTube live player",sourceName:"Prasar Bharati channel directory",aliases:["dd malayalam"]},
 {id:"KeralaDDNews.in",name:"Kerala DD News",channelId:"UC-GEJA8oiKOg6l2__7F6BhQ",country:"IN",language:"Malayalam",category:"News",quality:"Official YouTube live player",sourceName:"Prasar Bharati channel directory",aliases:["kerala dd news"]},
 {id:"DDBharati.in",name:"DD Bharati",channelId:"UCIAnlTV3O9NYWMI-DwYZaWg",country:"IN",language:"Hindi",category:"Culture",quality:"Official YouTube live player",sourceName:"Prasar Bharati channel directory",aliases:["dd bharati"]},
 {id:"DDBanglaNews.in",name:"DD Bangla News",channelId:"UCe4GERYkwpMUJWZpxOiATYA",country:"IN",language:"Bengali",category:"News",quality:"Official YouTube live player",sourceName:"Prasar Bharati channel directory",aliases:["dd bangla news"]},
 {id:"DDSahyadriNews.in",name:"DD Sahyadri News",channelId:"UCbcCOCo2JeLRK48puKro1pQ",country:"IN",language:"Marathi",category:"News",quality:"Official YouTube live player",sourceName:"Prasar Bharati channel directory",aliases:["dd sahyadri news"]},
 {id:"DDKisan.in",name:"DD Kisan",channelId:"UCnDfmcUyhgJp6xC1LmBLfUg",country:"IN",language:"Hindi",category:"Education",quality:"Official YouTube live player",sourceName:"Prasar Bharati channel directory",aliases:["dd kisan"]}
];
var channels=[],countryNames={},categoryNames={},languageNames={},logoMap={},feedMap={},current=null,visible=72,loading=false,loadToken=0;
var savedPage=1;
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function normalize(s){return String(s||"").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();}
function monogram(name){return String(name||"TV").split(/\s+/).filter(Boolean).slice(0,2).map(function(s){return s.slice(0,1);}).join("").toUpperCase()||"TV";}
function httpsUrl(raw){try{var u=new URL(raw);return u.protocol==="https:"&&!u.username&&!u.password?u.href:"";}catch(e){return "";}}
function countryLabel(code){return countryNames[code]||code||"Worldwide";}
function languageLabel(code){return languageNames[code]||code||"Language not listed";}
function feedInfo(channelId){return feedMap[channelId]||null;}
function playableFor(ch){
 var tokens=[ch.id,ch.name].concat(ch.alt_names||[]).map(normalize);
 return featured.find(function(f){
  return tokens.some(function(t){return t===normalize(f.id)||t===normalize(f.name)||f.aliases.some(function(a){return t===normalize(a)});});
 })||null;
}
function channelLogo(ch){
 var logos=logoMap[ch.id]||[];
 if(!logos.length)return "";
 var pick=logos.find(function(x){return x.in_use&&httpsUrl(x.url);})||logos.find(function(x){return httpsUrl(x.url);});
 return pick?httpsUrl(pick.url):"";
}
function channelQuality(ch){
 var info=feedInfo(ch.id);
 if(!info||!info.formats.length)return "Quality not listed";
 var formats=info.formats.slice().sort(function(a,b){
  function score(v){var m=String(v).match(/(\d{3,4})/);return m?Number(m[1]):0;}
  return score(b)-score(a);
 });
 return formats[0];
}
function channelLanguages(ch){
 var info=feedInfo(ch.id);
 var list=info&&info.languages.length?info.languages:(ch.languages||[]);
 return list.slice(0,2).map(languageLabel).join(", ")||"Language not listed";
}
function cardHtml(ch){
 var play=playableFor(ch),logo=channelLogo(ch),country=countryLabel(ch.country),quality=channelQuality(ch),lang=channelLanguages(ch);
 var badge=play?'<span class="tv-playable-badge">IN-PAGE PLAYER</span>':'<span class="tv-listing-badge">CHANNEL LISTING</span>';
 var image=logo?'<img src="'+esc(logo)+'" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="tv-card-fallback" hidden>'+esc(monogram(ch.name))+'</span>':'<span class="tv-card-fallback">'+esc(monogram(ch.name))+'</span>';
 return '<button class="tv-channel-card" type="button" data-channel="'+esc(ch.id)+'" aria-label="Select '+esc(ch.name)+'"><span class="tv-card-main"><span class="tv-channel-logo">'+image+'</span><span class="tv-card-copy"><b>'+esc(ch.name)+'</b><small>'+esc(country)+' · '+esc(lang)+'</small></span>'+badge+'</span><span class="tv-card-details"><span>'+esc(quality)+'</span><span>'+esc((ch.categories||[]).slice(0,2).map(function(x){return categoryNames[x]||x;}).join(" · ")||"TV")+'</span></span></button>';
}
function featuredHtml(f){
 var ch=channels.find(function(x){return x.id===f.id;});
 var logo=ch?channelLogo(ch):"";
 var image=logo?'<img src="'+esc(logo)+'" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden>'+esc(monogram(f.name))+'</span>':'<span>'+esc(monogram(f.name))+'</span>';
 return '<button class="tv-featured-card" type="button" data-featured="'+esc(f.id)+'"><span class="tv-featured-icon">'+image+'</span><span class="tv-featured-text"><b>'+esc(f.name)+'</b><small>'+esc(f.language)+' · '+esc(f.quality)+'</small></span><span class="tv-featured-status">PLAY</span></button>';
}
function renderFeatured(){
 $("featuredChannels").innerHTML=featured.map(featuredHtml).join("");
 $("featuredCount").textContent=String(featured.length).padStart(2,"0");
}
function playerUrl(feed){
 var url=new URL("https://www.youtube-nocookie.com/embed/live_stream");
 url.searchParams.set("channel",feed.channelId);
 url.searchParams.set("playsinline","1");
 url.searchParams.set("rel","0");
 url.searchParams.set("modestbranding","1");
 url.searchParams.set("origin",location.origin);
 return url.href;
}
function clearPlayer(){
 var frame=$("officialPlayer");frame.src="about:blank";frame.hidden=true;
 $("playerPlaceholder").hidden=false;
}
function showNotPlayable(ch){
 current=null;clearPlayer();
 $("playerState").textContent="PLAYER NOT CONFIGURED";
 $("playerQuality").textContent="DIRECTORY ENTRY";
 $("nowChannel").textContent=ch.name;
 $("nowSource").textContent=countryLabel(ch.country)+" · "+channelLanguages(ch);
 $("playerMessage").textContent="This channel is in the worldwide catalogue, but JMB does not yet have a verified official in-page live player for it. It will not load a random third-party stream.";
 $("stopPlayer").disabled=true;
 document.querySelectorAll(".tv-channel-card,.tv-featured-card").forEach(function(b){b.classList.remove("active");});
}
function play(feed,ch){
 if(!feed||!feed.channelId){showNotPlayable(ch||{name:"Channel"});return;}
 current=feed;
 var frame=$("officialPlayer");
 $("playerPlaceholder").hidden=true;
 frame.title=feed.name+" official live player";
 frame.src=playerUrl(feed);
 frame.hidden=false;
 $("playerState").textContent="OFFICIAL PLAYER REQUESTED";
 $("playerQuality").textContent="YOUTUBE PLAYER";
 $("nowChannel").textContent=feed.name;
 $("nowSource").textContent=feed.language+" · "+feed.quality;
 $("playerMessage").textContent="The official YouTube player is loading. If the broadcaster is not live or has disabled embedding, the original platform will show its availability message.";
 $("stopPlayer").disabled=false;
 document.querySelectorAll(".tv-channel-card,.tv-featured-card").forEach(function(b){
  b.classList.toggle("active",b.getAttribute("data-featured")===feed.id||b.getAttribute("data-channel")===ch.id);
 });
}
function selectChannel(ch){
 if(!ch)return;
 var feed=playableFor(ch);
 if(feed){play(feed,ch);return;}
 showNotPlayable(ch);
}
function selectFeatured(id){
 var feed=featured.find(function(x){return x.id===id;});
 if(!feed)return;
 var ch=channels.find(function(x){return playableFor(x)&&playableFor(x).id===id;})||{id:feed.id,name:feed.name,country:feed.country,categories:[feed.category]};
 play(feed,ch);
}
function fillSelect(id,values,label,map){
 var el=$(id),old=el.value,unique=Array.from(new Set(values.filter(Boolean))).sort(function(a,b){return String(map&&map[a]||a).localeCompare(String(map&&map[b]||b));});
 el.innerHTML='<option value="">'+esc(label)+'</option>'+unique.map(function(v){return '<option value="'+esc(v)+'">'+esc(map&&map[v]||v)+'</option>';}).join("");
 if(unique.indexOf(old)>=0)el.value=old;
}
function filteredChannels(){
 var q=normalize($("channelSearch").value),country=$("countryFilter").value,category=$("categoryFilter").value,language=$("languageFilter").value;
 return channels.filter(function(ch){
  var feed=feedInfo(ch.id);
  var blob=normalize([ch.name,ch.id,ch.network,(ch.alt_names||[]).join(" "),(ch.owners||[]).join(" "),countryLabel(ch.country),(ch.categories||[]).map(function(x){return categoryNames[x]||x;}).join(" "),(feed?feed.languages:[]).map(languageLabel).join(" ")].join(" "));
  var langOk=!language||(feed&&feed.languages.indexOf(language)>=0)||(ch.languages||[]).indexOf(language)>=0;
  return (!q||blob.indexOf(q)>=0)&&(!country||ch.country===country)&&(!category||(ch.categories||[]).indexOf(category)>=0)&&langOk;
 });
}
function renderDirectory(){
 var rows=filteredChannels();
 $("directoryStatus").textContent=rows.length.toLocaleString()+" matching channels · "+channels.length.toLocaleString()+" worldwide catalogue entries · "+featured.length+" verified player sources configured";
 var shown=rows.slice(0,visible);
 $("channelGrid").innerHTML=shown.length?shown.map(cardHtml).join(""):'<div class="empty-state">No channels match these filters. Try a different search or clear the filters.</div>';
 $("loadMoreChannels").hidden=rows.length<=visible;
}
async function fetchJson(path){
 var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},18000);
 try{
  var r=await fetch(API+path,{signal:controller.signal,cache:"no-store",headers:{"Accept":"application/json"}});
  if(!r.ok)throw new Error(path+" returned "+r.status);
  return await r.json();
 }finally{clearTimeout(timer);}
}
function consumeData(data){
 var rawChannels=data[0],logos=data[1],feeds=data[2],countries=data[3],categories=data[4],languages=data[5],blocked=data[6];
 countryNames={};categoryNames={};languageNames={};logoMap={};feedMap={};
 countries.forEach(function(x){if(x.code)countryNames[x.code]=x.name;});
 categories.forEach(function(x){if(x.id)categoryNames[x.id]=x.name;});
 languages.forEach(function(x){if(x.code)languageNames[x.code]=x.name;});
 logos.forEach(function(x){if(x.channel&&x.url){if(!logoMap[x.channel])logoMap[x.channel]=[];logoMap[x.channel].push(x);}});
 feeds.forEach(function(x){
  if(!x.channel)return;
  if(!feedMap[x.channel])feedMap[x.channel]={formats:[],languages:[]};
  if(x.format)feedMap[x.channel].formats.push(x.format);
  (x.languages||[]).forEach(function(lang){if(lang&&!feedMap[x.channel].languages.includes(lang))feedMap[x.channel].languages.push(lang);});
 });
 var blockedIds=new Set(blocked.map(function(x){return x.channel;}).filter(Boolean));
 channels=rawChannels.filter(function(ch){
  return ch&&ch.id&&ch.name&&!ch.is_nsfw&&!ch.closed&&!ch.replaced_by&&!blockedIds.has(ch.id);
 }).sort(function(a,b){return a.name.localeCompare(b.name);});
 fillSelect("countryFilter",channels.map(function(x){return x.country;}),"All countries",countryNames);
 fillSelect("categoryFilter",Array.from(new Set(channels.reduce(function(out,x){return out.concat(x.categories||[]);},[]))),"All categories",categoryNames);
 var allLanguages=[];
 Object.keys(feedMap).forEach(function(id){allLanguages=allLanguages.concat(feedMap[id].languages);});
 fillSelect("languageFilter",allLanguages,"All languages",languageNames);
 renderFeatured();renderDirectory();
}
async function load(){
 if(loading)return;loading=true;var token=++loadToken;
 $("directoryRefresh").disabled=true;$("directoryRefresh").textContent="Loading…";
 $("directoryStatus").textContent="Loading global channel, logo, feed and language data…";
 try{
  var result=await Promise.all([
   fetchJson("channels.json"),fetchJson("logos.json"),fetchJson("feeds.json"),fetchJson("countries.json"),fetchJson("categories.json"),fetchJson("languages.json"),fetchJson("blocklist.json")
  ]);
  if(token!==loadToken)return;
  consumeData(result);
  $("playerMessage").textContent="Worldwide channel catalogue loaded. Choose a card to select it.";
 }catch(error){
  $("directoryStatus").textContent="Could not load the worldwide catalogue.";
  $("channelGrid").innerHTML='<div class="empty-state"><b>Channel catalogue unavailable</b><p>Check your connection and press Refresh. The approved featured player list is still available.</p></div>';
  renderFeatured();
  $("playerMessage").textContent="The catalogue could not be reached. Featured official players can still be selected.";
 }finally{
  if(token===loadToken){loading=false;$("directoryRefresh").disabled=false;$("directoryRefresh").textContent="↻ Refresh";}
 }
}
$("featuredChannels").addEventListener("click",function(e){
 var b=e.target.closest("[data-featured]");if(b)selectFeatured(b.getAttribute("data-featured"));
});
$("channelGrid").addEventListener("click",function(e){
 var b=e.target.closest("[data-channel]");if(!b)return;
 var ch=channels.find(function(x){return x.id===b.getAttribute("data-channel");});
 if(ch)selectChannel(ch);
});
$("stopPlayer").addEventListener("click",function(){
 clearPlayer();current=null;
 $("playerState").textContent="PLAYER STOPPED";$("playerQuality").textContent="SELECT A CHANNEL";
 $("nowChannel").textContent="No channel selected";$("nowSource").textContent="Select a channel card below.";
 $("playerMessage").textContent="Player stopped.";
 $("stopPlayer").disabled=true;
 document.querySelectorAll(".tv-channel-card,.tv-featured-card").forEach(function(b){b.classList.remove("active");});
});
["countryFilter","categoryFilter","languageFilter"].forEach(function(id){$(id).addEventListener("change",function(){visible=72;renderDirectory();});});
$("channelSearch").addEventListener("input",function(){visible=72;renderDirectory();});
$("loadMoreChannels").addEventListener("click",function(){visible+=72;renderDirectory();});
$("directoryRefresh").addEventListener("click",load);
$("clearFilters").addEventListener("click",function(){
 $("channelSearch").value="";$("countryFilter").value="";$("categoryFilter").value="";$("languageFilter").value="";visible=72;renderDirectory();
});
var params=new URLSearchParams(location.search);if(params.has("q"))$("channelSearch").value=params.get("q");
renderFeatured();load();
})();