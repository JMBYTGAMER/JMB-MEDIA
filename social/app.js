(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var google="https://news.google.com/rss/search?q=",cacheKey="jmb-social-headlines-v2";
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
var items=[],loading=false,requestNo=0;
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function safeUrl(s){try{var u=new URL(s);return (u.protocol==="https:"||u.protocol==="http:")?u.href:"";}catch(e){return "";}}
function nodeText(n,name){var a=n.getElementsByTagName(name);return a.length?(a[0].textContent||"").trim():"";}
async function fetchText(url,ms){
 var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},ms||9000);
 try{var r=await fetch(url,{signal:controller.signal,cache:"no-store",headers:{"Accept":"application/rss+xml, application/atom+xml, application/xml, text/xml, */*"}});
  if(!r.ok)throw new Error("HTTP "+r.status);return await r.text();
 }finally{clearTimeout(timer);}
}
function parse(text,source){
 var doc=new DOMParser().parseFromString(text,"text/xml");
 if(doc.querySelector("parsererror"))throw new Error("Invalid feed");
 var nodes=Array.from(doc.getElementsByTagName("item"));
 if(!nodes.length)nodes=Array.from(doc.getElementsByTagName("entry"));
 return nodes.slice(0,12).map(function(n){
  var links=Array.from(n.getElementsByTagName("link"));
  var chosen=links.find(function(l){return !l.getAttribute("rel")||l.getAttribute("rel")==="alternate";})||links[0];
  var link=chosen?(chosen.getAttribute("href")||chosen.textContent.trim()):"";
  var date=Date.parse(nodeText(n,"pubDate")||nodeText(n,"published")||nodeText(n,"updated"))||0;
  return {title:nodeText(n,"title").slice(0,220),link:safeUrl(link),date:date,source:source,kind:source.format};
 }).filter(function(x){return x.title&&x.link;});
}
async function fetchFeed(source){
 var attempts=[
  {url:source.feed,via:"publisher",timeout:9000},
  {url:"https://api.allorigins.win/raw?url="+encodeURIComponent(source.feed),via:"RSS relay",timeout:14000}
 ],last;
 for(var i=0;i<attempts.length;i++){
  try{var rows=parse(await fetchText(attempts[i].url,attempts[i].timeout),source);if(!rows.length)throw new Error("No headlines in feed");return rows;}
  catch(e){last=e;}
 }
 throw last||new Error("Feed unavailable");
}
function cached(){
 try{
  var saved=JSON.parse(localStorage.getItem(cacheKey)||"{}")||{},rows=[];
  sources.forEach(function(source){
   var group=saved[source.name];
   if(!group||!Array.isArray(group.items))return;
   group.items.forEach(function(x){var link=safeUrl(x.link);if(x.title&&link)rows.push({title:String(x.title).slice(0,220),link:link,date:Number(x.date)||0,source:source,kind:source.format,stale:true});});
  });
  return rows;
 }catch(e){return [];}
}
function store(source,rows){
 try{
  var all={};try{all=JSON.parse(localStorage.getItem(cacheKey)||"{}")||{};}catch(e){}
  all[source.name]={time:Date.now(),items:rows.map(function(x){return {title:x.title,link:x.link,date:x.date};})};
  localStorage.setItem(cacheKey,JSON.stringify(all));
 }catch(e){}
}
function fill(id,values){
 Array.from(new Set(values)).sort().forEach(function(v){$(id).insertAdjacentHTML("beforeend",'<option value="'+esc(v)+'">'+esc(v)+'</option>');});
}
function status(message){$("socialStatus").textContent=message;}
function renderSide(){
 $("videoDesk").innerHTML=[
  '<a class="side-link" href="https://www.youtube.com/@BBCNews" target="_blank" rel="noopener noreferrer">BBC News official YouTube channel <span>↗</span></a>',
  '<a class="side-link" href="https://www.youtube.com/@aljazeeraenglish" target="_blank" rel="noopener noreferrer">Al Jazeera English official YouTube channel <span>↗</span></a>'
 ].join("");
 $("audioDesk").innerHTML=[
  '<a class="side-link" href="https://www.aljazeera.com/podcasts/" target="_blank" rel="noopener noreferrer">Al Jazeera podcasts <span>↗</span></a>',
  '<a class="side-link" href="https://www.npr.org/podcasts/" target="_blank" rel="noopener noreferrer">NPR podcasts <span>↗</span></a>'
 ].join("");
}
function render(){
 var q=$("socialSearch").value.toLowerCase().trim(),format=$("formatFilter").value,region=$("regionFilter").value,source=$("sourceFilter").value;
 var rows=items.filter(function(x){return (!q||(x.title+" "+x.source.name).toLowerCase().indexOf(q)>=0)&&(!format||x.kind===format)&&(!region||x.source.region===region)&&(!source||x.source.name===source);});
 rows.sort(function(a,b){return b.date-a.date;});
 status(rows.length+" headlines · "+items.length+" saved or live items from "+sources.length+" sources"+(items.some(function(x){return x.stale;})?" · includes saved headlines":""));
 if(!rows.length){$("storyList").innerHTML='<div class="empty-state">No headlines match these filters. Try another search or refresh the feed.</div>';return;}
 $("storyList").innerHTML=rows.slice(0,100).map(function(x){
  var label=x.kind==="video"?"OFFICIAL VIDEO LINK":x.kind==="audio"?"OFFICIAL PODCAST LINK":"HEADLINE";
  var date=x.date?new Date(x.date).toLocaleString(undefined,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Latest";
  return '<article class="story"><div class="story-meta"><span>'+label+'</span><span>'+esc(x.source.name)+'</span><span>'+esc(date)+'</span></div><h3><a href="'+esc(x.link)+'" target="_blank" rel="noopener noreferrer">'+esc(x.title)+'</a></h3><div class="card-actions"><a class="btn small secondary" href="'+esc(x.link)+'" target="_blank" rel="noopener noreferrer">Open original source ↗</a></div></article>';
 }).join("");
}
async function refresh(){
 if(loading)return;loading=true;var id=++requestNo,button=$("socialRetry");
 if(button){button.disabled=true;button.textContent="Refreshing…";}status("Refreshing publisher headline feeds…");
 var results=await Promise.allSettled(sources.map(fetchFeed));
 if(id!==requestNo)return;
 var fresh=[];
 results.forEach(function(r,i){if(r.status==="fulfilled"){fresh=fresh.concat(r.value);store(sources[i],r.value);}});
 if(fresh.length){
  var unique=new Map();fresh.forEach(function(x){unique.set(x.link,x);});
  items=Array.from(unique.values()).sort(function(a,b){return b.date-a.date;}).slice(0,120);
  status(fresh.length+" fresh headline links received");
 }else if(items.length){status("Live feeds unavailable · showing your saved headline links");}
 else{status("Headline feeds could not be reached. Try again later.");}
 render();if(button){button.disabled=false;button.textContent="↻ Refresh";}loading=false;
}
async function init(){
 fill("regionFilter",sources.map(function(s){return s.region;}));fill("sourceFilter",sources.map(function(s){return s.name;}));
 items=cached();if(items.length){render();status("Showing saved headlines · checking sources…");}
 renderSide();
 $("socialRetry").addEventListener("click",refresh);
 ["socialSearch","formatFilter","regionFilter","sourceFilter"].forEach(function(id){$(id).addEventListener(id==="socialSearch"?"input":"change",render);});
 await refresh();
 if(!items.length)$("storyList").innerHTML='<div class="empty-state">News sources are unavailable right now. Visit an official publisher below and try refreshing later.</div>';
}
init();
})();