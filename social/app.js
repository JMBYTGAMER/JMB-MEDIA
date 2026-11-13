(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var google="https://news.google.com/rss/search?q=";
var cacheKey="jmb-social-feed-cache-v1";
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
var items=[],health={},lastUpdated=0,loading=false,requestId=0;
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function clean(s){var d=document.createElement("div");d.innerHTML=String(s||"");return (d.textContent||d.innerText||"").replace(/\s+/g," ").trim().slice(0,240);}
function nodeText(node,name){var a=node.getElementsByTagName(name);return a.length?(a[0].textContent||"").trim():"";}
function firstAttr(node,name,attrName){var a=node.getElementsByTagName(name);return a.length?a[0].getAttribute(attrName)||"":"";}
function validUrl(value){try{var u=new URL(value);return u.protocol==="https:"||u.protocol==="http:"?u.href:"";}catch(e){return "";}}
async function fetchText(url,ms){
 var controller=typeof AbortController!=="undefined"?new AbortController():null;
 var timer=controller?setTimeout(function(){controller.abort();},ms):null;
 try{var r=await fetch(url,{cache:"no-store",signal:controller?controller.signal:undefined,headers:{"Accept":"application/rss+xml, application/atom+xml, application/xml, text/xml, */*"}});
  if(!r.ok)throw new Error("HTTP "+r.status);return await r.text();
 }finally{if(timer)clearTimeout(timer);}
}
function parse(text,source){
 var doc=new DOMParser().parseFromString(text,"text/xml");
 if(doc.querySelector("parsererror"))throw new Error("Invalid feed");
 var nodes=Array.from(doc.getElementsByTagName("item"));
 if(!nodes.length)nodes=Array.from(doc.getElementsByTagName("entry"));
 if(!nodes.length)throw new Error("No stories in feed");
 return nodes.slice(0,12).map(function(n){
  var enc=n.getElementsByTagName("enclosure")[0],mediaUrl=enc?enc.getAttribute("url")||"":"",mime=enc?enc.getAttribute("type")||"":"";
  var links=Array.from(n.getElementsByTagName("link"));
  var linkNode=links.find(function(l){return l.getAttribute("rel")==="alternate"||!l.getAttribute("rel");})||links[0];
  var link=linkNode?(linkNode.getAttribute("href")||linkNode.textContent.trim()):"";
  var vid=nodeText(n,"yt:videoId");
  if(!vid&&source.format==="video"){var m=link.match(/[?&]v=([^&]+)/);if(m)vid=m[1];}
  var thumb=firstAttr(n,"media:thumbnail","url");
  if(vid&&!thumb)thumb="https://i.ytimg.com/vi/"+vid+"/hqdefault.jpg";
  var kind=source.format||(mime.indexOf("audio")===0?"audio":mime.indexOf("video")===0?"video":"text");
  if(mime.indexOf("audio")===0)kind="audio";
  if(mime.indexOf("video")===0)kind="video";
  var date=Date.parse(nodeText(n,"pubDate")||nodeText(n,"published")||nodeText(n,"updated"))||0;
  return {title:nodeText(n,"title"),link:validUrl(link),description:clean(nodeText(n,"description")||nodeText(n,"summary")||nodeText(n,"content")),date:date,source:source,kind:kind,media:validUrl(mediaUrl),thumb:validUrl(thumb),videoId:vid};
 }).filter(function(x){return x.title&&x.link;});
}
async function fetchFeed(source){
 var target=source.feed;
 var attempts=[
  {url:target,via:"publisher",timeout:8000},
  {url:"https://proxy.cors.dev/"+target,via:"feed relay",timeout:14000},
  {url:"https://api.allorigins.win/raw?url="+encodeURIComponent(target),via:"fallback relay",timeout:14000}
 ];
 var errors=[];
 for(var i=0;i<attempts.length;i++){
  try{
   var text=await fetchText(attempts[i].url,attempts[i].timeout);
   var rows=parse(text,source);
   if(!rows.length)throw new Error("Empty feed");
   return {items:rows,via:attempts[i].via};
  }catch(e){errors.push(attempts[i].via+" "+(e.message||"failed"));}
 }
 throw new Error(errors.join(" · "));
}
function readCache(){
 try{return JSON.parse(localStorage.getItem(cacheKey)||"{}")||{};}catch(e){return {};}
}
function saveSource(source,rows,via){
 try{
  var cache=readCache();
  cache[source.name]={time:Date.now(),via:via,items:rows.map(function(x){return {title:x.title,link:x.link,description:x.description,date:x.date,kind:x.kind,media:x.media,thumb:x.thumb,videoId:x.videoId};})};
  localStorage.setItem(cacheKey,JSON.stringify(cache));
 }catch(e){}
}
function restoreCache(){
 var cache=readCache(),restored=0,latest=0,rows=[];
 sources.forEach(function(source){
  var saved=cache[source.name];
  if(!saved||!Array.isArray(saved.items))return;
  var count=0;
  saved.items.forEach(function(x){
   var link=validUrl(x.link);if(!link||!x.title)return;
   rows.push({title:x.title,link:link,description:x.description||"",date:Number(x.date)||0,source:source,kind:x.kind||source.format,media:validUrl(x.media||""),thumb:validUrl(x.thumb||""),videoId:x.videoId||"",stale:true});
   count++;
  });
  if(count){restored++;latest=Math.max(latest,Number(saved.time)||0);}
 });
 return {rows:rows,publishers:restored,time:latest};
}
function fill(id,values){Array.from(new Set(values)).sort().forEach(function(v){$(id).insertAdjacentHTML("beforeend",'<option value="'+esc(v)+'">'+esc(v)+'</option>');});}
function status(message){var el=$("socialStatus");if(el)el.textContent=message;}
function renderSide(){
 var vids=items.filter(function(x){return x.kind==="video";}).slice(0,5);
 var audios=items.filter(function(x){return x.kind==="audio";}).slice(0,4);
 $("videoDesk").innerHTML=vids.length?vids.map(function(x){return '<a class="side-link" href="'+esc(x.link)+'" target="_blank" rel="noopener noreferrer">'+esc(x.title)+' <span>▶ ↗</span></a>';}).join(""):'<a class="side-link" href="https://www.youtube.com/@BBCNews" target="_blank" rel="noopener noreferrer">BBC News official videos <span>↗</span></a><a class="side-link" href="https://www.youtube.com/@aljazeeraenglish" target="_blank" rel="noopener noreferrer">Al Jazeera English videos <span>↗</span></a>';
 $("audioDesk").innerHTML=audios.length?audios.map(function(x){return '<div class="news-item"><b class="tiny">'+esc(x.source.name)+'</b><p style="margin:5px 0 8px">'+esc(x.title)+'</p>'+(x.media?'<audio controls preload="none" style="width:100%" src="'+esc(x.media)+'"></audio>':'<a class="section-link" target="_blank" rel="noopener noreferrer" href="'+esc(x.link)+'">Listen ↗</a>')+'</div>';}).join(""):'<a class="side-link" href="https://www.aljazeera.com/podcasts/" target="_blank" rel="noopener noreferrer">Al Jazeera podcasts <span>↗</span></a><a class="side-link" href="https://www.npr.org/podcasts/" target="_blank" rel="noopener noreferrer">NPR podcasts <span>↗</span></a>';
}
function render(){
 var q=$("socialSearch").value.toLowerCase().trim(),format=$("formatFilter").value,region=$("regionFilter").value,source=$("sourceFilter").value;
 var rows=items.filter(function(x){var blob=(x.title+" "+x.description+" "+x.source.name).toLowerCase();return (!q||blob.indexOf(q)>=0)&&(!format||x.kind===format)&&(!region||x.source.region===region)&&(!source||x.source.name===source);});
 rows.sort(function(a,b){return b.date-a.date;});
 status(rows.length+" updates · "+items.length+" loaded from "+sources.length+" feeds"+(items.some(function(x){return x.stale;})?" · includes saved headlines":""));
 if(!rows.length){$("storyList").innerHTML='<div class="empty-state">No updates match your filters. Try another word or select all formats.</div>';return;}
 $("storyList").innerHTML=rows.slice(0,100).map(function(x){
  var label=x.kind==="video"?"VIDEO":x.kind==="audio"?"AUDIO":"TEXT";
  var date=x.date?new Date(x.date).toLocaleString(undefined,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Latest";
  var media=x.kind==="video"&&x.thumb?'<a href="'+esc(x.link)+'" target="_blank" rel="noopener noreferrer"><img src="'+esc(x.thumb)+'" alt="" loading="lazy" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin:9px 0" onerror="this.remove()"></a>':"";
  var audio=x.kind==="audio"&&x.media?'<audio controls preload="none" src="'+esc(x.media)+'" style="width:100%;margin:9px 0"></audio>':"";
  return '<article class="story"><div class="story-meta"><span>'+label+'</span><span>'+esc(x.source.name)+'</span><span>'+esc(date)+'</span></div><h3><a href="'+esc(x.link)+'" target="_blank" rel="noopener noreferrer">'+esc(x.title)+'</a></h3>'+media+(x.description?'<p>'+esc(x.description)+'</p>':"")+audio+'<div class="card-actions"><a class="btn small secondary" href="'+esc(x.link)+'" target="_blank" rel="noopener noreferrer">'+(x.kind==="video"?"Watch at source ↗":x.kind==="audio"?"Open episode ↗":"Read at source ↗")+'</a></div></article>';
 }).join("");
}
async function refresh(){
 if(loading)return;loading=true;var id=++requestId,button=$("socialRetry");
 if(button){button.disabled=true;button.textContent="Refreshing…";}
 status("Refreshing trusted news feeds…");
 var settled=await Promise.allSettled(sources.map(async function(source){
  var result=await fetchFeed(source);
  saveSource(source,result.items,result.via);
  health[source.name]={ok:true,via:result.via,count:result.items.length};
  return result.items;
 }));
 if(id!==requestId){loading=false;return;}
 var fresh=[];
 settled.forEach(function(result,index){
  if(result.status==="fulfilled")fresh=fresh.concat(result.value);
  else health[sources[index].name]={ok:false,error:result.reason&&result.reason.message||"Unavailable",count:0};
 });
 if(fresh.length){
  var byLink=new Map();fresh.forEach(function(x){byLink.set(x.link,x);});
  items.forEach(function(x){if(!byLink.has(x.link))byLink.set(x.link,x);});
  items=Array.from(byLink.values()).sort(function(a,b){return b.date-a.date;}).filter(function(x){return !x.date||x.date>Date.now()-14*86400000;}).slice(0,150);
  lastUpdated=Date.now();items.forEach(function(x){if(!x.stale)x.stale=false;});
  status(fresh.length+" fresh updates · "+Object.keys(health).filter(function(k){return health[k].ok;}).length+" feeds connected");
 }else if(items.length){
  status("Live feeds are temporarily unavailable · showing your saved edition");
 }else{
  status("News feeds could not be reached right now");
 }
 render();renderSide();
 if(button){button.disabled=false;button.textContent="↻ Refresh";}
 loading=false;
}
async function init(){
 fill("regionFilter",sources.map(function(s){return s.region;}));fill("sourceFilter",sources.map(function(s){return s.name;}));
 var saved=restoreCache();
 if(saved.rows.length){
  items=saved.rows;lastUpdated=saved.time;
  status("Showing saved headlines · checking publishers for new updates…");
  render();renderSide();
 }
 $("socialRetry").addEventListener("click",refresh);
 ["socialSearch","formatFilter","regionFilter","sourceFilter"].forEach(function(id){$(id).addEventListener(id==="socialSearch"?"input":"change",render);});
 await refresh();
 if(!items.length){
  $("storyList").innerHTML='<div class="empty-state">The live news feeds could not be reached. Check your connection or open an official publisher below, then try Refresh.</div>';
 }
}
init();
})();