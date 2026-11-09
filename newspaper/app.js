(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
function googleFeed(domain,lang,gl){return "https://news.google.com/rss/search?q="+encodeURIComponent("site:"+domain)+"&hl="+(lang||"en")+"&gl="+(gl||"US")+"&ceid="+(gl||"US")+":"+(lang||"en");}
var sources=[
{name:"Malayala Manorama",domain:"manoramaonline.com",region:"Kerala",language:"Malayalam",lang:"ml",gl:"IN",site:"https://www.manoramaonline.com/",feed:googleFeed("manoramaonline.com","ml","IN"),featured:true},
{name:"Mathrubhumi",domain:"mathrubhumi.com",region:"Kerala",language:"Malayalam",lang:"ml",gl:"IN",site:"https://www.mathrubhumi.com/",feed:googleFeed("mathrubhumi.com","ml","IN")},
{name:"Deshabhimani",domain:"deshabhimani.com",region:"Kerala",language:"Malayalam",lang:"ml",gl:"IN",site:"https://www.deshabhimani.com/",feed:googleFeed("deshabhimani.com","ml","IN")},
{name:"Madhyamam",domain:"madhyamam.com",region:"Kerala",language:"Malayalam",lang:"ml",gl:"IN",site:"https://www.madhyamam.com/",feed:googleFeed("madhyamam.com","ml","IN")},
{name:"Kerala Kaumudi",domain:"keralakaumudi.com",region:"Kerala",language:"Malayalam",lang:"ml",gl:"IN",site:"https://keralakaumudi.com/",feed:googleFeed("keralakaumudi.com","ml","IN")},
{name:"The Hindu — Kerala",domain:"thehindu.com",region:"India",language:"English",lang:"en",gl:"IN",site:"https://www.thehindu.com/news/national/kerala/",feed:"https://www.thehindu.com/news/national/kerala/feeder/default.rss"},
{name:"The Hindu — India",domain:"thehindu.com",region:"India",language:"English",lang:"en",gl:"IN",site:"https://www.thehindu.com/",feed:"https://www.thehindu.com/feeder/default.rss"},
{name:"The Indian Express",domain:"indianexpress.com",region:"India",language:"English",lang:"en",gl:"IN",site:"https://indianexpress.com/",feed:"https://indianexpress.com/feed/"},
{name:"The Times of India",domain:"timesofindia.indiatimes.com",region:"India",language:"English",lang:"en",gl:"IN",site:"https://timesofindia.indiatimes.com/",feed:googleFeed("timesofindia.indiatimes.com","en","IN")},
{name:"BBC News Malayalam",domain:"bbc.com/malayalam",region:"World",language:"Malayalam",lang:"ml",gl:"IN",site:"https://www.bbc.com/malayalam",feed:"https://feeds.bbci.co.uk/malayalam/rss.xml"},
{name:"BBC News",domain:"bbc.co.uk",region:"World",language:"English",lang:"en",gl:"US",site:"https://www.bbc.com/news",feed:"https://feeds.bbci.co.uk/news/rss.xml"},
{name:"Al Jazeera",domain:"aljazeera.com",region:"World",language:"English",lang:"en",gl:"US",site:"https://www.aljazeera.com/",feed:"https://www.aljazeera.com/xml/rss/all.xml"},
{name:"The Guardian",domain:"theguardian.com",region:"World",language:"English",lang:"en",gl:"US",site:"https://www.theguardian.com/international",feed:"https://www.theguardian.com/world/rss"},
{name:"Deutsche Welle",domain:"dw.com",region:"World",language:"English",lang:"en",gl:"US",site:"https://www.dw.com/en/top-stories/s-9097",feed:googleFeed("dw.com","en","US")},
{name:"NPR",domain:"npr.org",region:"World",language:"English",lang:"en",gl:"US",site:"https://www.npr.org/sections/news/",feed:"https://feeds.npr.org/1001/rss.xml"}
];
var allItems=[];
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function clean(s){var d=document.createElement("div");d.innerHTML=String(s||"");return (d.textContent||d.innerText||"").replace(/\s+/g," ").trim().slice(0,230);}
function xmlText(node,tag){var n=node.getElementsByTagName(tag)[0];return n?(n.textContent||"").trim():"";}
async function fetchFeed(url){
 var response;
 try{response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error("feed unavailable");return await response.text();}
 catch(first){var proxy="https://api.allorigins.win/raw?url="+encodeURIComponent(url);response=await fetch(proxy,{cache:"no-store"});if(!response.ok)throw first;return await response.text();}
}
function parseFeed(text,source){
 var doc=new DOMParser().parseFromString(text,"text/xml");if(doc.querySelector("parsererror"))throw new Error("Invalid RSS");
 return Array.from(doc.getElementsByTagName("item")).slice(0,12).map(function(n){
  var enclosure=n.getElementsByTagName("enclosure")[0];var url=enclosure?enclosure.getAttribute("url"):"";
  return {title:xmlText(n,"title"),link:xmlText(n,"link"),description:clean(xmlText(n,"description")),date:Date.parse(xmlText(n,"pubDate"))||0,source:source,media:url};
 }).filter(function(x){return x.title&&/^https?:\/\//i.test(x.link);});
}
function fill(id,values,label){var el=$(id);Array.from(new Set(values)).sort().forEach(function(v){el.insertAdjacentHTML("beforeend",'<option value="'+esc(v)+'">'+esc(v)+'</option>');});}
function render(){
 var q=$("newsSearch").value.toLowerCase().trim(),region=$("regionFilter").value,language=$("languageFilter").value,publisher=$("publisherFilter").value,sort=$("sortFilter").value;
 var rows=allItems.filter(function(x){var blob=(x.title+" "+x.description+" "+x.source.name).toLowerCase();return (!q||blob.indexOf(q)>=0)&&(!region||x.source.region===region)&&(!language||x.source.language===language)&&(!publisher||x.source.name===publisher);});
 rows.sort(function(a,b){return sort==="source"?a.source.name.localeCompare(b.source.name):b.date-a.date;});
 $("newsStatus").textContent=rows.length+" headlines · "+sources.length+" publications in the directory";
 if(!rows.length){$("newsGrid").innerHTML='<div class="empty-state">No headlines match your filters. Try another search or open a publisher website below.</div>';return;}
 $("newsGrid").innerHTML=rows.slice(0,90).map(function(x){
  var date=x.date?new Date(x.date).toLocaleString(undefined,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Latest update";
  return '<article class="media-card"><div class="card-top"><div class="avatar">📰</div><div style="min-width:0"><div class="card-title">'+esc(x.source.name)+'</div><div class="muted tiny">'+esc(x.source.region)+' · '+esc(x.source.language)+' · '+esc(date)+'</div></div></div><div class="card-description"><b style="color:#f4f6fa">'+esc(x.title)+'</b><p style="margin:8px 0 0">'+esc(x.description||"Open the original publisher for more details.")+'</p></div><div class="card-actions"><a class="btn small" href="'+esc(x.link)+'" target="_blank" rel="noopener">Read full story ↗</a><a class="btn small ghost" href="'+esc(x.source.site)+'" target="_blank" rel="noopener">Publisher ↗</a></div></article>';
 }).join("");
}
function renderSources(){
 $("publisherGrid").innerHTML=sources.map(function(s){return '<a class="source-tile" href="'+esc(s.site)+'" target="_blank" rel="noopener"><b>'+(s.featured?"★ ":"")+esc(s.name)+'</b><span>'+esc(s.region)+' · '+esc(s.language)+'<br>Official publication ↗</span></a>';}).join("");
}
async function init(){
 renderSources();
 fill("regionFilter",sources.map(function(s){return s.region;}));
 fill("languageFilter",sources.map(function(s){return s.language;}));
 fill("publisherFilter",sources.map(function(s){return s.name;}));
 var results=await Promise.allSettled(sources.map(async function(s){var raw=await fetchFeed(s.feed);return parseFeed(raw,s);}));
 results.forEach(function(r){if(r.status==="fulfilled")allItems=allItems.concat(r.value);});
 render();
 if(!allItems.length){$("newsStatus").textContent="News feeds could not be reached right now."; $("newsGrid").innerHTML='<div class="empty-state">Some publishers block browser-side feed access. Try the official publisher links above, or reload later.</div>';}
}
["newsSearch","regionFilter","languageFilter","publisherFilter","sortFilter"].forEach(function(id){$(id).addEventListener(id==="newsSearch"?"input":"change",render);});
init();
})();