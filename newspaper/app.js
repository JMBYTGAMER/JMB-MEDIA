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
var allItems=[],feedHealth={},cacheKey="jmb-newspaper-feed-cache-v3",lastUpdated=0,loading=false;
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function safeUrl(s){try{var u=new URL(s);return (u.protocol==="https:"||u.protocol==="http:")?u.href:"";}catch(e){return "";}}
function safeImage(s){try{var u=new URL(s);return u.protocol==="https:";}catch(e){return false;}}
function clean(s,max){var d=document.createElement("div");d.innerHTML=String(s||"");return (d.textContent||d.innerText||"").replace(/\\s+/g," ").trim().slice(0,max||700);}
function nodeText(node,tag){var n=node.getElementsByTagName(tag)[0];return n?(n.textContent||"").trim():"";}
function nodeFirst(node,tags){for(var i=0;i<tags.length;i++){var n=node.getElementsByTagName(tags[i])[0];if(n)return n;}return null;}
function setStatus(message){var el=$("newsStatus");if(el)el.textContent=message;}
async function timeoutFetch(url,ms){var controller=typeof AbortController!=="undefined"?new AbortController():null;var timer=controller?setTimeout(function(){controller.abort();},ms):null;try{var r=await fetch(url,{cache:"no-store",signal:controller?controller.signal:undefined,headers:{"Accept":"application/rss+xml, application/atom+xml, application/xml, text/xml, */*"}});if(!r.ok)throw new Error("HTTP "+r.status);return await r.text();}finally{if(timer)clearTimeout(timer);}}
async function fetchFeed(url){
 var failures=[];
 try{return {text:await timeoutFetch(url,7000),via:"publisher"};}catch(e){failures.push("direct: "+(e.message||"blocked"));}
 try{return {text:await timeoutFetch("https://proxy.cors.dev/"+url,14000),via:"feed relay"};}catch(e){failures.push("feed relay: "+(e.message||"failed"));}
 try{return {text:await timeoutFetch("https://api.allorigins.win/raw?url="+encodeURIComponent(url),14000),via:"fallback relay"};}catch(e){failures.push("fallback relay: "+(e.message||"failed"));}
 throw new Error(failures.join("; "));
}
function getAtomLink(node){var links=Array.from(node.getElementsByTagName("link"));var preferred=links.find(function(x){return !x.getAttribute("rel")||x.getAttribute("rel")==="alternate";})||links[0];return preferred?(preferred.getAttribute("href")||preferred.textContent||"").trim():"";}
function getFirstImage(node,markup){
 var media=nodeFirst(node,["media:thumbnail","media:content"]);var src=media?(media.getAttribute("url")||""):"";
 if(!src){var enclosure=node.getElementsByTagName("enclosure")[0];if(enclosure&&(enclosure.getAttribute("type")||"").indexOf("image/")===0)src=enclosure.getAttribute("url")||"";}
 if(!src&&markup){var doc=new DOMParser().parseFromString(String(markup),"text/html");var img=doc.querySelector("img[src]");if(img)src=img.getAttribute("src")||"";}
 return safeImage(src)?src:"";
}
function parseFeed(text,source){
 var doc=new DOMParser().parseFromString(text,"text/xml");if(doc.querySelector("parsererror"))throw new Error("The feed returned invalid XML");
 var nodes=Array.from(doc.getElementsByTagName("item")),atom=false;if(!nodes.length){nodes=Array.from(doc.getElementsByTagName("entry"));atom=true;}if(!nodes.length)throw new Error("No articles found");
 return nodes.slice(0,20).map(function(n){
  var title=nodeText(n,"title"),link=atom?getAtomLink(n):nodeText(n,"link");if(!safeUrl(link))return null;
  var desc=nodeText(n,atom?"summary":"description"),encoded=nodeFirst(n,["content:encoded","content","encoded"]),body=encoded?(encoded.textContent||"").trim():desc;
  var pub=nodeText(n,"pubDate")||nodeText(n,"published")||nodeText(n,"updated")||nodeText(n,"dc:date");
  return {title:title,link:safeUrl(link),description:clean(desc,900),content:body.slice(0,14000),date:Date.parse(pub)||0,source:source,image:getFirstImage(n,body+" "+desc),via:""};
 }).filter(function(x){return x&&x.title;});
}
function sanitizeNode(node){
 if(node.nodeType===3)return esc(node.nodeValue);if(node.nodeType!==1)return "";
 var tag=node.tagName.toLowerCase(),allowed=["p","br","strong","b","em","i","ul","ol","li","blockquote","h2","h3","a","img"];
 if(["script","style","iframe","object","form"].includes(tag))return "";
 if(!allowed.includes(tag))return Array.from(node.childNodes).map(sanitizeNode).join("");
 if(tag==="img"){var src=safeImage(node.getAttribute("src")||"");return src?'<img class="reader-inline-image" src="'+esc(src)+'" alt="'+esc((node.getAttribute("alt")||"").slice(0,140))+'" loading="lazy">':"";}
 var body=Array.from(node.childNodes).map(sanitizeNode).join("");
 if(tag==="a"){var href=safeUrl(node.getAttribute("href")||"");return href?'<a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+body+"</a>":body;}
 return "<"+tag+">"+body+"</"+tag+">";
}
function safeArticleHtml(raw){if(!raw)return "";var doc=new DOMParser().parseFromString("<div>"+String(raw)+"</div>","text/html");var root=doc.body.firstElementChild;return root?Array.from(root.childNodes).map(sanitizeNode).join(""):"";}
function storeFeed(source,items){try{var cache={};try{cache=JSON.parse(localStorage.getItem(cacheKey)||"{}")||{};}catch(e){}cache[source.name]={time:Date.now(),items:items.map(function(x){return {title:x.title,link:x.link,description:x.description,content:x.content,date:x.date,image:x.image};})};localStorage.setItem(cacheKey,JSON.stringify(cache));}catch(e){}}
function loadSaved(){
 try{var cache=JSON.parse(localStorage.getItem(cacheKey)||"{}")||{},restored=0,when=0;
  sources.forEach(function(s){var saved=cache[s.name];if(!saved||!Array.isArray(saved.items))return;var rows=saved.items.filter(function(x){return x&&x.title&&safeUrl(x.link);}).map(function(x){return {title:x.title,link:x.link,description:x.description||"",content:x.content||"",date:x.date||0,image:safeImage(x.image)?x.image:"",source:s,stale:true};});allItems=allItems.concat(rows);if(rows.length){restored++;when=Math.max(when,saved.time||0);}});
  return {publishers:restored,time:when};
 }catch(e){return {publishers:0,time:0};}
}
function fill(id,values){var el=$(id);if(!el)return;var old=el.value;Array.from(new Set(values)).sort().forEach(function(v){el.insertAdjacentHTML("beforeend",'<option value="'+esc(v)+'">'+esc(v)+'</option>');});if(Array.from(el.options).some(function(o){return o.value===old;}))el.value=old;}
function render(){
 var q=$("newsSearch").value.toLowerCase().trim(),region=$("regionFilter").value,language=$("languageFilter").value,publisher=$("publisherFilter").value,sort=$("sortFilter").value;
 var rows=allItems.filter(function(x){var blob=(x.title+" "+x.description+" "+x.source.name).toLowerCase();return (!q||blob.indexOf(q)>=0)&&(!region||x.source.region===region)&&(!language||x.source.language===language)&&(!publisher||x.source.name===publisher);});
 rows.sort(function(a,b){return sort==="source"?a.source.name.localeCompare(b.source.name):b.date-a.date;});
 if(!rows.length){$("newsGrid").innerHTML='<div class="empty-state news-empty"><div class="empty-icon">📰</div><b>No headlines loaded yet</b><p>Try refreshing the feeds. You can still open a newspaper from the publisher directory below.</p><button class="btn small" id="newsEmptyRetry" type="button">Retry headlines</button></div>';return;}
 $("newsStatus").textContent=rows.length+" stories · "+sources.length+" publications · "+(lastUpdated?"Updated "+new Date(lastUpdated).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"saved edition");
 $("newsGrid").innerHTML=rows.slice(0,90).map(function(x){var date=x.date?new Date(x.date).toLocaleString(undefined,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Latest update";var image=x.image&&safeImage(x.image)?'<img class="news-thumb" src="'+esc(x.image)+'" alt="" loading="lazy" onerror="this.remove()">':'<div class="news-thumb news-thumb-placeholder">📰</div>';return '<article class="media-card news-card"><div class="news-card-top">'+image+'<div class="news-card-meta"><span class="news-source">'+esc(x.source.name)+'</span><span class="muted tiny">'+esc(x.source.region)+' · '+esc(x.source.language)+'</span><span class="news-date">'+esc(date)+'</span></div></div><h3 class="news-headline">'+esc(x.title)+'</h3><p class="news-excerpt">'+esc(x.description||"Open this story in the JMB reader.")+'</p><div class="news-card-footer"><button class="btn small" data-read="'+allItems.indexOf(x)+'" type="button">Read on JMB <span>→</span></button><a class="btn small ghost" href="'+esc(x.link)+'" target="_blank" rel="noopener noreferrer">Original article ↗</a></div></article>';}).join("");
}
function openReader(index){
 var x=allItems[index];if(!x)return;var panel=$("articleReader"),article=safeArticleHtml(x.content||x.description||"");
 var image=x.image&&safeImage(x.image)?'<img class="reader-image" src="'+esc(x.image)+'" alt="" loading="lazy" onerror="this.remove()">':"";
 var date=x.date?new Date(x.date).toLocaleString(undefined,{dateStyle:"full",timeStyle:"short"}):"Latest update";
 $("readerContent").innerHTML='<div class="reader-kicker">JMB NEWSPAPER READER</div><div class="reader-toolbar"><span>READING VIEW</span><button id="readerShare" type="button">Share story ↗</button></div>'+image+'<div class="reader-source">'+esc(x.source.name)+' · '+esc(x.source.region)+' · '+esc(x.source.language)+'</div><h2>'+esc(x.title)+'</h2><div class="reader-date">'+esc(date)+'</div><article class="reader-article">'+(article||'<p>'+esc(x.description||"The publisher did not provide a readable article excerpt in its feed.")+'</p>')+'</article><div class="reader-note">This is content supplied in the publisher&#39;s RSS feed. Some publishers provide only a short preview. The complete report remains on the publisher&#39;s website.</div><div class="reader-actions"><a class="btn small" href="'+esc(x.link)+'" target="_blank" rel="noopener noreferrer">Continue to original article ↗</a><a class="btn small ghost" href="'+esc(x.source.site)+'" target="_blank" rel="noopener noreferrer">Publisher homepage ↗</a></div>';
 panel.hidden=false;panel.setAttribute("aria-hidden","false");document.body.classList.add("reader-open");panel.scrollIntoView({behavior:"smooth",block:"start"});
 var share=$("readerShare");if(share)share.addEventListener("click",async function(){try{if(navigator.share)await navigator.share({title:x.title,url:x.link});else{await navigator.clipboard.writeText(x.link);window.JMBToast("Story link copied");}}catch(e){if(e.name!=="AbortError")window.JMBToast("Could not share this story");}});
 $("readerClose").focus();
}
function closeReader(){var panel=$("articleReader");if(panel){panel.hidden=true;panel.setAttribute("aria-hidden","true");document.body.classList.remove("reader-open");}}
function renderSources(){$("publisherGrid").innerHTML=sources.map(function(s){return '<a class="source-tile publisher-tile" href="'+esc(s.site)+'" target="_blank" rel="noopener noreferrer"><span class="publisher-type">OFFICIAL PUBLICATION</span><b>'+(s.featured?"★ ":"")+esc(s.name)+'</b><span>'+esc(s.region)+' · '+esc(s.language)+'</span><span class="publisher-open">Open publisher ↗</span></a>';}).join("");}
function renderHealth(){var ok=Object.keys(feedHealth).filter(function(k){return feedHealth[k].ok;}).length;var el=$("newsHealth");if(el)el.textContent=ok+" of "+sources.length+" feeds updated";}
async function refreshFeeds(){
 if(loading)return;loading=true;var button=$("newsRetry");if(button){button.disabled=true;button.textContent="Refreshing…";}setStatus("Refreshing newspaper feeds…");
 var settled=await Promise.allSettled(sources.map(async function(s){var result=await fetchFeed(s.feed),items=parseFeed(result.text,s);items.forEach(function(x){x.via=result.via;x.stale=false;});storeFeed(s,items);feedHealth[s.name]={ok:true,via:result.via,count:items.length};return items;}));
 var fresh=[];settled.forEach(function(r,i){if(r.status==="fulfilled")fresh=fresh.concat(r.value);else feedHealth[sources[i].name]={ok:false,error:r.reason&&r.reason.message||"Feed unavailable",count:0};});
 if(fresh.length){var byLink=new Map();fresh.forEach(function(x){byLink.set(x.link,x);});allItems.forEach(function(x){if(!byLink.has(x.link))byLink.set(x.link,x);});var usage={};allItems=Array.from(byLink.values()).sort(function(a,b){return b.date-a.date;}).filter(function(item){if(item.date&&item.date<Date.now()-30*86400000)return false;var key=item.source.name;usage[key]=(usage[key]||0)+1;return usage[key]<=20;});lastUpdated=Date.now();setStatus(fresh.length+" fresh stories · "+Object.keys(feedHealth).filter(function(k){return feedHealth[k].ok;}).length+" feeds connected");}
 else if(allItems.length)setStatus("Showing saved headlines · live feeds are temporarily unavailable");else setStatus("Could not connect to newspaper feeds");
 render();renderHealth();if(button){button.disabled=false;button.textContent="↻ Refresh";}loading=false;
}
function init(){
 renderSources();fill("regionFilter",sources.map(function(s){return s.region;}));fill("languageFilter",sources.map(function(s){return s.language;}));fill("publisherFilter",sources.map(function(s){return s.name;}));
 var saved=loadSaved();if(saved.publishers){lastUpdated=saved.time;allItems.sort(function(a,b){return b.date-a.date;});render();setStatus("Showing saved headlines · checking for new editions…");}
 $("newsRetry").addEventListener("click",refreshFeeds);
 $("newsGrid").addEventListener("click",function(e){var b=e.target.closest("[data-read]");if(b)openReader(Number(b.getAttribute("data-read")));if(e.target.closest("#newsEmptyRetry"))refreshFeeds();});
 $("readerClose").addEventListener("click",closeReader);$("articleReader").addEventListener("click",function(e){if(e.target===this)closeReader();});document.addEventListener("keydown",function(e){if(e.key==="Escape")closeReader();});
 $("manoramaOnJmb").addEventListener("click",function(){$("publisherFilter").value="Malayala Manorama";render();$("newsGrid").scrollIntoView({behavior:"smooth",block:"start"});});
 ["newsSearch","regionFilter","languageFilter","publisherFilter","sortFilter"].forEach(function(id){$(id).addEventListener(id==="newsSearch"?"input":"change",render);});
 render();refreshFeeds();
}
init();
})();