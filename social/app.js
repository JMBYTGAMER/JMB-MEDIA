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
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function clean(s){var d=new DOMParser().parseFromString(String(s||""),"text/html");return (d.body.textContent||"").replace(/\\s+/g," ").trim().slice(0,240);}
function safeUrl(s){try{var u=new URL(s);return (u.protocol==="https:"||u.protocol==="http:")&&!u.username&&!u.password?u.href:"";}catch(e){return "";}}
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
 var q=$("socialSearch").value.toLowerCase().trim(),format=$("formatFilter").value,region=$("regionFilter").value,source=$("sourceFilter").value;
 var rows=items.filter(function(x){var blob=(x.title+" "+x.description+" "+x.source.name).toLowerCase();return (!q||blob.indexOf(q)>=0)&&(!format||x.kind===format)&&(!region||x.source.region===region)&&(!source||x.source.name===source);});
 rows.sort(function(a,b){return b.date-a.date;});
 $("socialStatus").textContent=rows.length+" updates · "+items.length+" loaded from "+sources.length+" feeds";
 if(!rows.length){$("storyList").innerHTML='<div class="empty-state">No updates match your filters. Try another word or select all formats.</div>';return;}
 $("storyList").innerHTML=rows.slice(0,100).map(function(x){
  var label=x.kind==="video"?"VIDEO":x.kind==="audio"?"AUDIO":"TEXT",date=x.date?new Date(x.date).toLocaleString(undefined,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Latest";
  var media=x.kind==="video"&&x.thumb?'<a href="'+esc(x.link)+'" target="_blank" rel="noopener"><img src="'+esc(x.thumb)+'" alt="" loading="lazy" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin:9px 0"></a>':"";
  var audio=x.kind==="audio"&&x.media?'<audio controls preload="none" src="'+esc(x.media)+'" style="width:100%;margin:9px 0"></audio>':"";
  return '<article class="story"><div class="story-meta"><span>'+label+'</span><span>'+esc(x.source.name)+'</span><span>'+esc(date)+'</span></div><h3><a href="'+esc(x.link)+'" target="_blank" rel="noopener">'+esc(x.title)+'</a></h3>'+media+(x.description?'<p>'+esc(x.description)+'</p>':"")+audio+'<div class="card-actions"><a class="btn small secondary" href="'+esc(x.link)+'" target="_blank" rel="noopener">'+(x.kind==="video"?"Watch at source ↗":x.kind==="audio"?"Open episode ↗":"Read at source ↗")+'</a></div></article>';
 }).join("");
}
async function init(){
 fill("regionFilter",sources.map(function(s){return s.region;}));fill("sourceFilter",sources.map(function(s){return s.name;}));
 var results=await Promise.allSettled(sources.map(async function(s){return parse(await fetchFeed(s.feed),s);}));
 results.forEach(function(r){if(r.status==="fulfilled")items=items.concat(r.value);});
 render();renderSide();
 if(!items.length){$("socialStatus").textContent="News feeds are unavailable."; $("storyList").innerHTML='<div class="empty-state">The live feeds could not be reached. Open an official publisher or video link in this section and reload later.</div>';}
}
["socialSearch","formatFilter","regionFilter","sourceFilter"].forEach(function(id){$(id).addEventListener(id==="socialSearch"?"input":"change",render);});
init();
})();