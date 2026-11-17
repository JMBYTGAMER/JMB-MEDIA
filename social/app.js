(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var google="https://news.google.com/rss/search?q=";
function siteFeed(site,lang,gl){return google+encodeURIComponent("site:"+site)+"&hl="+lang+"&gl="+gl+"&ceid="+gl+":"+lang;}
var sources=[
{name:"Malayala Manorama",region:"Kerala",format:"text",feed:siteFeed("manoramaonline.com","ml","IN"),site:"https://www.manoramaonline.com/"},
{name:"BBC News Malayalam",region:"World",format:"text",feed:"https://feeds.bbci.co.uk/malayalam/rss.xml",site:"https://www.bbc.com/malayalam"},
{name:"The Hindu",region:"India",format:"text",feed:"https://www.thehindu.com/feeder/default.rss",site:"https://www.thehindu.com/"},
{name:"BBC News World",region:"World",format:"text",feed:"https://feeds.bbci.co.uk/news/world/rss.xml",site:"https://www.bbc.com/news"},
{name:"Al Jazeera English",region:"World",format:"text",feed:"https://www.aljazeera.com/xml/rss/all.xml",site:"https://www.aljazeera.com/"},
{name:"BBC News — YouTube",region:"World",format:"video",feed:"https://www.youtube.com/feeds/videos.xml?channel_id=UC16niRr50-MSBwiO3YDb3RA",site:"https://www.youtube.com/@BBCNews"},
{name:"Al Jazeera English — YouTube",region:"World",format:"video",feed:"https://www.youtube.com/feeds/videos.xml?channel_id=UCNye-wNBqNL5ZzHSJj3l8Bg",site:"https://www.youtube.com/@aljazeeraenglish"},
{name:"The Take — Al Jazeera podcast",region:"World",format:"audio",feed:"https://www.omnycontent.com/d/playlist/9c074afa-3313-47e8-b802-a9f900789975/09af2160-238f-48b2-b20b-ad4b00ebd8e7/b86dddc1-67a5-41c2-a13c-ad4b00ebd8f5/podcast.rss",site:"https://www.aljazeera.com/podcasts/"},
{name:"NPR News",region:"World",format:"text",feed:"https://feeds.npr.org/1001/rss.xml",site:"https://www.npr.org/sections/news/"}
];
var items=[];
var SOCIAL_CACHE_KEY="jmb-social-feed-cache-v1";
var SOCIAL_SAVED_KEY="jmb-social-saved-stories-v1";
var savedStories=[];
function safeUrl(value){
 try{
  var u=new URL(String(value||""),location.href);
  if((u.protocol!=="https:"&&u.protocol!=="http:")||u.username||u.password)return "";
  return u.href;
 }catch(e){return "";}
}
function loadSavedStories(){
 try{
  var saved=JSON.parse(localStorage.getItem(SOCIAL_SAVED_KEY)||"[]");
  if(!Array.isArray(saved))return [];
  return saved.map(function(x){
   var source=sources.find(function(s){return s.name===x.sourceName;});
   var link=safeUrl(x.link);
   if(!source||!x.title||!link)return null;
   return {title:String(x.title).slice(0,300),link:link,description:String(x.description||"").slice(0,240),date:Number(x.date)||0,source:source,kind:x.kind||source.format||"text",media:safeUrl(x.media||""),thumb:safeUrl(x.thumb||""),videoId:String(x.videoId||"")};
  }).filter(Boolean).slice(0,200);
 }catch(e){return [];}
}
function saveSavedStories(){
 try{
  localStorage.setItem(SOCIAL_SAVED_KEY,JSON.stringify(savedStories.slice(0,200).map(function(x){
   return {title:x.title,link:x.link,description:x.description,date:x.date,sourceName:x.source.name,kind:x.kind,media:x.media,thumb:x.thumb,videoId:x.videoId};
  })));
 }catch(e){}
}
function isSaved(link){return savedStories.some(function(x){return x.link===link;});}
function syncSavedFilter(){
 var select=$("savedFilter");
 if(!select)return;
 var option=select.querySelector('option[value="saved"]');
 if(option)option.textContent="Saved stories ("+savedStories.length+")";
}
function toggleSaved(link){
 var item=items.find(function(x){return x.link===link;})||savedStories.find(function(x){return x.link===link;});
 if(!item)return;
 var index=savedStories.findIndex(function(x){return x.link===link;});
 if(index>=0){savedStories.splice(index,1);}else{savedStories.unshift(item);savedStories=savedStories.slice(0,200);}
 saveSavedStories();syncSavedFilter();render();
 if(window.JMBToast)window.JMBToast(index>=0?"Story removed from saved":"Story saved on this device");
}
function loadSocialCache(){
 try{
  var saved=JSON.parse(localStorage.getItem(SOCIAL_CACHE_KEY)||"[]");
  if(!Array.isArray(saved))return [];
  return saved.map(function(x){
   var source=sources.find(function(s){return s.name===x.sourceName;});
   if(!source||!x.title||!safeUrl(x.link))return null;
   return {title:x.title,link:x.link,description:x.description||"",date:Number(x.date)||0,source:source,kind:x.kind||source.format||"text",media:safeUrl(x.media||""),thumb:safeUrl(x.thumb||""),videoId:x.videoId||""};
  }).filter(Boolean);
 }catch(e){return [];}
}
function saveSocialCache(){
 try{
  localStorage.setItem(SOCIAL_CACHE_KEY,JSON.stringify(items.slice(0,120).map(function(x){
   return {title:x.title,link:x.link,description:x.description,date:x.date,sourceName:x.source.name,kind:x.kind,media:x.media,thumb:x.thumb,videoId:x.videoId};
  })));
 }catch(e){}
}
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function clean(s){var d=new DOMParser().parseFromString(String(s||""),"text/html");return (d.body.textContent||"").replace(/\s+/g," ").trim().slice(0,240);}
function nodeText(node,name){var a=node.getElementsByTagName(name);return a.length?(a[0].textContent||"").trim():"";}
function firstAttr(node,name,attrName){var a=node.getElementsByTagName(name);return a.length?a[0].getAttribute(attrName)||"":"";}
async function timeoutText(url,ms){
 var ctl=new AbortController(),timer=setTimeout(function(){ctl.abort();},ms);
 try{var r=await fetch(url,{cache:"no-store",signal:ctl.signal,headers:{"Accept":"application/rss+xml, application/atom+xml, application/xml, text/xml, */*"}});if(!r.ok)throw new Error("Feed request failed (HTTP "+r.status+")");return await r.text();}
 finally{clearTimeout(timer);}
}
async function fetchFeed(url){
 try{return await timeoutText(url,9000);}
 catch(e){return await timeoutText("https://api.allorigins.win/raw?url="+encodeURIComponent(url),12000);}
}
function parse(text,source){
 var doc=new DOMParser().parseFromString(text,"text/xml");if(doc.querySelector("parsererror"))throw new Error("Invalid feed");
 var nodes=Array.from(doc.getElementsByTagName("item"));if(!nodes.length)nodes=Array.from(doc.getElementsByTagName("entry"));
 return nodes.slice(0,12).map(function(n){
  var enc=n.getElementsByTagName("enclosure")[0],mediaUrl=enc?enc.getAttribute("url")||"":"",mime=enc?enc.getAttribute("type")||"":"";
  var links=Array.from(n.getElementsByTagName("link")),linkNode=links.find(function(l){return l.getAttribute("rel")==="alternate"||!l.getAttribute("rel");})||links[0];
  var link=linkNode?(linkNode.getAttribute("href")||linkNode.textContent.trim()):"";
  var vid=nodeText(n,"yt:videoId");if(!vid&&source.format==="video"){var m=link.match(/[?&]v=([^&]+)/);if(m)vid=m[1];}
  var thumb=firstAttr(n,"media:thumbnail","url");if(vid&&!thumb)thumb="https://i.ytimg.com/vi/"+vid+"/hqdefault.jpg";
  var kind=source.format||(mime.indexOf("audio")===0?"audio":mime.indexOf("video")===0?"video":"text");
  if(mime.indexOf("audio")===0)kind="audio";if(mime.indexOf("video")===0)kind="video";
  var date=Date.parse(nodeText(n,"pubDate")||nodeText(n,"published")||nodeText(n,"updated"))||0;
  return {title:nodeText(n,"title"),link:safeUrl(link),description:clean(nodeText(n,"description")||nodeText(n,"summary")||nodeText(n,"content")),date:date,source:source,kind:kind,media:safeUrl(mediaUrl),thumb:safeUrl(thumb),videoId:vid};
 }).filter(function(x){return x.title&&/^https?:\/\//i.test(x.link);});
}
function fill(id,values){Array.from(new Set(values)).sort().forEach(function(v){$(id).insertAdjacentHTML("beforeend",'<option value="'+esc(v)+'">'+esc(v)+'</option>');});}
function renderSide(){
 var vids=items.filter(function(x){return x.kind==="video";}).slice(0,5),audios=items.filter(function(x){return x.kind==="audio";}).slice(0,4);
 $("videoDesk").innerHTML=vids.length?vids.map(function(x){return '<a class="side-link" href="'+esc(x.link)+'" target="_blank" rel="noopener">'+esc(x.title)+' <span>▶ ↗</span></a>';}).join(""):'<a class="side-link" href="https://www.youtube.com/@BBCNews" target="_blank" rel="noopener">BBC News official videos <span>↗</span></a><a class="side-link" href="https://www.youtube.com/@aljazeeraenglish" target="_blank" rel="noopener">Al Jazeera English videos <span>↗</span></a>';
 $("audioDesk").innerHTML=audios.length?audios.map(function(x){return '<div class="news-item"><b class="tiny">'+esc(x.source.name)+'</b><p style="margin:5px 0 8px">'+esc(x.title)+'</p>'+(x.media?'<audio controls preload="none" style="width:100%" src="'+esc(x.media)+'"></audio>':'<a class="section-link" target="_blank" rel="noopener" href="'+esc(x.link)+'">Listen ↗</a>')+'</div>';}).join(""):'<a class="side-link" href="https://www.aljazeera.com/podcasts/" target="_blank" rel="noopener">Al Jazeera podcasts <span>↗</span></a><a class="side-link" href="https://www.npr.org/podcasts/" target="_blank" rel="noopener">NPR podcasts <span>↗</span></a>';
}
function render(){
 var q=$("socialSearch").value.toLowerCase().trim(),format=$("formatFilter").value,region=$("regionFilter").value,source=$("sourceFilter").value,savedOnly=$("savedFilter")&&$("savedFilter").value==="saved";
 var rows=items.filter(function(x){var blob=(x.title+" "+x.description+" "+x.source.name).toLowerCase();return (!q||blob.indexOf(q)>=0)&&(!format||x.kind===format)&&(!region||x.source.region===region)&&(!source||x.source.name===source)&&(!savedOnly||isSaved(x.link));});
 rows.sort(function(a,b){return b.date-a.date;});
 $("socialStatus").textContent=rows.length+" updates · "+items.length+" loaded · "+savedStories.length+" saved";
 if(!rows.length){$("storyList").innerHTML='<div class="empty-state">'+(savedOnly?'No saved stories yet. Tap “Save” on any story to keep it here on this device.':'No updates match your filters. Try another word or select all formats.')+'</div>';return;}
 $("storyList").innerHTML=rows.slice(0,100).map(function(x){
  var label=x.kind==="video"?"VIDEO":x.kind==="audio"?"AUDIO":"TEXT",date=x.date?new Date(x.date).toLocaleString(undefined,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Latest";
  var media=x.kind==="video"&&x.thumb?'<a href="'+esc(x.link)+'" target="_blank" rel="noopener"><img src="'+esc(x.thumb)+'" alt="" loading="lazy" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin:9px 0"></a>':"";
  var audio=x.kind==="audio"&&x.media?'<audio controls preload="none" src="'+esc(x.media)+'" style="width:100%;margin:9px 0"></audio>':"";
  var saved=isSaved(x.link);
  return '<article class="story"><div class="story-meta"><span>'+label+'</span><span>'+esc(x.source.name)+'</span><span>'+esc(date)+'</span></div><h3><a href="'+esc(x.link)+'" target="_blank" rel="noopener">'+esc(x.title)+'</a></h3>'+media+(x.description?'<p>'+esc(x.description)+'</p>':"")+audio+'<div class="story-actions"><a class="btn small secondary" href="'+esc(x.link)+'" target="_blank" rel="noopener">'+(x.kind==="video"?"Watch at source ↗":x.kind==="audio"?"Open episode ↗":"Read at source ↗")+'</a><button class="story-save" type="button" data-save-story="'+esc(x.link)+'" aria-pressed="'+(saved?"true":"false")+'" aria-label="'+(saved?"Remove saved story":"Save story")+'">'+(saved?"★ Saved":"☆ Save")+'</button></div></article>';
 }).join("");
}
async function refreshNews(){
 if(window.__jmbSocialLoading)return;
 window.__jmbSocialLoading=true;
 var button=$("socialRetry");
 if(button){button.disabled=true;button.textContent="Refreshing…";}
 $("socialStatus").textContent=items.length?"Checking publishers for fresh updates…":"Connecting to publisher feeds…";
 var results=await Promise.allSettled(sources.map(async function(s){return parse(await fetchFeed(s.feed),s);}));
 var fresh=[];results.forEach(function(r){if(r.status==="fulfilled")fresh=fresh.concat(r.value);});
 if(fresh.length){
  var unique=new Map();fresh.forEach(function(x){if(x.link&&!unique.has(x.link))unique.set(x.link,x);});
  savedStories.forEach(function(x){if(!unique.has(x.link))unique.set(x.link,x);});
  items=Array.from(unique.values()).sort(function(a,b){return b.date-a.date;}).slice(0,160);
  saveSocialCache();syncSavedFilter();render();renderSide();
  $("socialStatus").textContent=items.length+" live updates · saved for your next visit";
 }else if(items.length){
  render();renderSide();
  $("socialStatus").textContent="Offline edition · showing "+items.length+" saved updates";
 }else{
  $("socialStatus").textContent="News feeds are unavailable.";
  $("storyList").innerHTML='<div class="empty-state"><strong>Could not load the world desk.</strong><p>Check your connection or try refreshing. You can still open the official source links in the side panels.</p><button id="socialEmptyRetry" class="btn small secondary" type="button">Try again</button></div>';
 }
 if(button){button.disabled=false;button.textContent=fresh.length?"↻ Refresh news":"↻ Try again";}
 window.__jmbSocialLoading=false;
}
async function init(){
 var initialQuery=new URLSearchParams(location.search).get("q");if(initialQuery) $("socialSearch").value=initialQuery.slice(0,120);
 fill("regionFilter",sources.map(function(s){return s.region;}));fill("sourceFilter",sources.map(function(s){return s.name;}));
 savedStories=loadSavedStories();
 items=loadSocialCache();
 savedStories.forEach(function(x){if(!items.some(function(y){return y.link===x.link;}))items.push(x);});
 items.sort(function(a,b){return b.date-a.date;});
 syncSavedFilter();
 if(items.length){render();renderSide();$("socialStatus").textContent="Showing your saved news edition · checking live sources…";}
 await refreshNews();
}
$("socialRetry").addEventListener("click",refreshNews);
$("storyList").addEventListener("click",function(e){
 var save=e.target.closest("[data-save-story]");
 if(save){toggleSaved(save.getAttribute("data-save-story"));return;}
 if(e.target.closest("#socialEmptyRetry"))refreshNews();
});
window.addEventListener("online",function(){if(!window.__jmbSocialLoading)refreshNews();});

["socialSearch","formatFilter","regionFilter","sourceFilter","savedFilter"].forEach(function(id){if($(id))$(id).addEventListener(id==="socialSearch"?"input":"change",render);});
init();
})();