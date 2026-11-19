(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
function googleFeed(domain,lang,gl){return "https://news.google.com/rss/search?q="+encodeURIComponent(domain)+"&hl="+(lang||"ml")+"&gl="+(gl||"IN")+"&ceid="+(gl||"IN")+":"+(lang||"ml");}
function googleQueryFeed(query,lang,gl){return "https://news.google.com/rss/search?q="+encodeURIComponent(query)+"&hl="+(lang||"ml")+"&gl="+(gl||"IN")+"&ceid="+(gl||"IN")+":"+(lang||"ml");}
var sources=[
 {name:"Malayala Manorama",domain:"manoramaonline.com",region:"Kerala",language:"Malayalam",lang:"ml",gl:"IN",country:"IN",state:"Kerala",site:"https://www.manoramaonline.com/",feed:googleFeed("site:manoramaonline.com Kerala","ml","IN"),featured:true},
 {name:"Mathrubhumi",domain:"mathrubhumi.com",region:"Kerala",language:"Malayalam",lang:"ml",gl:"IN",country:"IN",state:"Kerala",site:"https://www.mathrubhumi.com/",feed:googleFeed("site:mathrubhumi.com Kerala","ml","IN")},
 {name:"Deshabhimani",domain:"deshabhimani.com",region:"Kerala",language:"Malayalam",lang:"ml",gl:"IN",country:"IN",state:"Kerala",site:"https://www.deshabhimani.com/",feed:googleFeed("site:deshabhimani.com Kerala","ml","IN")},
 {name:"Madhyamam",domain:"madhyamam.com",region:"Kerala",language:"Malayalam",lang:"ml",gl:"IN",country:"IN",state:"Kerala",site:"https://www.madhyamam.com/",feed:googleFeed("site:madhyamam.com Kerala","ml","IN")},
 {name:"Kerala Kaumudi",domain:"keralakaumudi.com",region:"Kerala",language:"Malayalam",lang:"ml",gl:"IN",country:"IN",state:"Kerala",site:"https://keralakaumudi.com/",feed:googleFeed("site:keralakaumudi.com Kerala","ml","IN")},
 {name:"Janabhoomi Kerala",domain:"janabhoominews.com",region:"Kerala",language:"Malayalam",lang:"ml",gl:"IN",country:"IN",state:"Kerala",site:"https://janabhoominews.com/",feed:"https://janabhoominews.com/rss/category/kerala"},
 {name:"Oneindia Malayalam",domain:"malayalam.oneindia.com",region:"Kerala",language:"Malayalam",lang:"ml",gl:"IN",country:"IN",state:"Kerala",site:"https://malayalam.oneindia.com/",feed:"https://malayalam.oneindia.com/rss/feeds/oneindia-malayalam-fb.xml"},
 {name:"The Hindu — Kerala",domain:"thehindu.com",region:"Kerala",language:"English",lang:"en",gl:"IN",country:"IN",state:"Kerala",site:"https://www.thehindu.com/news/national/kerala/",feed:"https://www.thehindu.com/news/national/kerala/feeder/default.rss"},
 {name:"The Indian Express — Kerala",domain:"indianexpress.com",region:"Kerala",language:"English",lang:"en",gl:"IN",country:"IN",state:"Kerala",site:"https://indianexpress.com/section/india/kerala/",feed:"https://indianexpress.com/section/india/kerala/feed/"},
 {name:"BBC News Malayalam",domain:"bbc.com/malayalam",region:"World",language:"Malayalam",lang:"ml",gl:"IN",country:"GB",site:"https://www.bbc.com/malayalam",feed:"https://feeds.bbci.co.uk/malayalam/rss.xml"},
 {name:"The Hindu — India",domain:"thehindu.com",region:"India",language:"English",lang:"en",gl:"IN",country:"IN",site:"https://www.thehindu.com/",feed:"https://www.thehindu.com/feeder/default.rss"},
 {name:"The Indian Express",domain:"indianexpress.com",region:"India",language:"English",lang:"en",gl:"IN",country:"IN",site:"https://indianexpress.com/",feed:"https://indianexpress.com/feed/"},
 {name:"The Times of India",domain:"timesofindia.indiatimes.com",region:"India",language:"English",lang:"en",gl:"IN",country:"IN",site:"https://timesofindia.indiatimes.com/",feed:googleFeed("site:timesofindia.indiatimes.com","en","IN")},
 {name:"BBC News",domain:"bbc.co.uk",region:"World",language:"English",lang:"en",gl:"GB",country:"GB",site:"https://www.bbc.com/news",feed:"https://feeds.bbci.co.uk/news/rss.xml"},
 {name:"Al Jazeera",domain:"aljazeera.com",region:"World",language:"English",lang:"en",gl:"US",country:"QA",site:"https://www.aljazeera.com/",feed:"https://www.aljazeera.com/xml/rss/all.xml"},
 {name:"The Guardian",domain:"theguardian.com",region:"World",language:"English",lang:"en",gl:"GB",country:"GB",site:"https://www.theguardian.com/international",feed:"https://www.theguardian.com/world/rss"},
 {name:"Deutsche Welle",domain:"dw.com",region:"World",language:"English",lang:"en",gl:"US",country:"DE",site:"https://www.dw.com/en/top-stories/s-9097",feed:googleFeed("site:dw.com","en","US")},
 {name:"NPR",domain:"npr.org",region:"World",language:"English",lang:"en",gl:"US",country:"US",site:"https://www.npr.org/sections/news/",feed:"https://feeds.npr.org/1001/rss.xml"}
];
var KERALA_DISTRICTS=[
 "Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam","Idukki","Ernakulam","Thrissur","Palakkad","Malappuram","Kozhikode","Wayanad","Kannur","Kasaragod"
];
var DISTRICT_CITIES={
 "Thiruvananthapuram":["Thiruvananthapuram","Neyyattinkara","Attingal","Nedumangad","Varkala"],
 "Kollam":["Kollam","Punalur","Kottarakkara","Karunagappally","Paravur","Anchal"],
 "Pathanamthitta":["Pathanamthitta","Thiruvalla","Adoor","Ranni","Pandalam"],
 "Alappuzha":["Alappuzha","Cherthala","Kayamkulam","Mavelikkara","Haripad"],
 "Kottayam":["Kottayam","Changanassery","Pala","Vaikom","Ettumanoor"],
 "Idukki":["Painavu","Thodupuzha","Munnar","Adimali","Kattappana"],
 "Ernakulam":["Kochi","Aluva","Perumbavoor","Muvattupuzha","North Paravur"],
 "Thrissur":["Thrissur","Chalakudy","Irinjalakuda","Guruvayur","Kodungallur"],
 "Palakkad":["Palakkad","Ottapalam","Shoranur","Mannarkkad","Chittur"],
 "Malappuram":["Malappuram","Manjeri","Tirur","Ponnani","Perinthalmanna"],
 "Kozhikode":["Kozhikode","Vadakara","Koyilandy","Feroke","Ramanattukara"],
 "Wayanad":["Kalpetta","Sulthan Bathery","Mananthavady","Vythiri"],
 "Kannur":["Kannur","Thalassery","Payyannur","Mattannur","Iritty"],
 "Kasaragod":["Kasaragod","Kanhangad","Nileshwar","Uppala"]
};
var INDIA_STATES=["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"];
var COUNTRY_OPTIONS=[["IN","India"],["AE","United Arab Emirates"],["GB","United Kingdom"],["US","United States"],["CA","Canada"],["AU","Australia"],["SG","Singapore"],["QA","Qatar"],["SA","Saudi Arabia"],["KW","Kuwait"],["OM","Oman"],["BH","Bahrain"],["MY","Malaysia"],["NZ","New Zealand"],["ZA","South Africa"],["FR","France"],["DE","Germany"],["IT","Italy"],["ES","Spain"],["JP","Japan"],["KR","South Korea"],["LK","Sri Lanka"],["NP","Nepal"],["BD","Bangladesh"],["PK","Pakistan"],["NG","Nigeria"],["KE","Kenya"],["BR","Brazil"]];
var cacheKey="jmb-newspaper-edition-cache-v4",allItems=[],activeFeeds=[],feedHealth={},lastUpdated=0,loading=false,currentPage=1,pageSize=8,editionLocation="Kerala";
function esc(s){return String(s||"").replace(/[&<>\"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function safeUrl(s){var raw=String(s||"").trim();if(!raw)return "";try{var u=new URL(raw);return (u.protocol==="https:"||u.protocol==="http:")&&!u.username&&!u.password?u.href:"";}catch(e){return "";}}
function safeImage(s){var raw=String(s||"").trim();if(!raw)return false;try{var u=new URL(raw);return u.protocol==="https:"&&!u.username&&!u.password;}catch(e){return false;}}
function clean(s,max){var d=new DOMParser().parseFromString(String(s||""),"text/html");return (d.body.textContent||"").replace(/\s+/g," ").trim().slice(0,max||700);}
function nodeText(node,tag){var n=node.getElementsByTagName(tag)[0];return n?(n.textContent||"").trim():"";}
function nodeFirst(node,tags){for(var i=0;i<tags.length;i++){var n=node.getElementsByTagName(tags[i])[0];if(n)return n;}return null;}
function setStatus(message){var el=$("newsStatus");if(el)el.textContent=message;}
async function timeoutFetch(url,ms){
 var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},ms);
 try{var r=await fetch(url,{cache:"no-store",signal:controller.signal,headers:{"Accept":"application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, */*"}});if(!r.ok)throw new Error("HTTP "+r.status);return await r.text();}
 finally{clearTimeout(timer);}
}
function getAtomLink(node){var links=Array.from(node.getElementsByTagName("link"));var preferred=links.find(function(x){return !x.getAttribute("rel")||x.getAttribute("rel")==="alternate";})||links[0];return preferred?(preferred.getAttribute("href")||preferred.textContent||"").trim():"";}
function getFirstImage(node,markup){
 var media=nodeFirst(node,["media:thumbnail","media:content"]),src=media?(media.getAttribute("url")||""):"";
 if(!src){var enclosure=node.getElementsByTagName("enclosure")[0];if(enclosure&&(enclosure.getAttribute("type")||"").indexOf("image/")===0)src=enclosure.getAttribute("url")||"";}
 if(!src&&markup){var doc=new DOMParser().parseFromString(String(markup),"text/html"),img=doc.querySelector("img[src]");if(img)src=img.getAttribute("src")||"";}
 return safeImage(src)?src:"";
}
function parseFeed(text,source){
 var doc=new DOMParser().parseFromString(text,"text/xml");if(doc.querySelector("parsererror"))throw new Error("The feed returned invalid XML");
 var nodes=Array.from(doc.getElementsByTagName("item")),atom=false;if(!nodes.length){nodes=Array.from(doc.getElementsByTagName("entry"));atom=true;}if(!nodes.length)throw new Error("No articles found");
 return nodes.slice(0,24).map(function(n){
  var title=nodeText(n,"title"),link=atom?getAtomLink(n):nodeText(n,"link");if(!safeUrl(link))return null;
  var desc=nodeText(n,atom?"summary":"description"),encoded=nodeFirst(n,["content:encoded","content","encoded"]),body=encoded?(encoded.textContent||"").trim():desc;
  var pub=nodeText(n,"pubDate")||nodeText(n,"published")||nodeText(n,"updated")||nodeText(n,"dc:date");
  var excerpt=clean(desc||body,620);
  return {title:clean(title,260),link:safeUrl(link),description:excerpt,date:Date.parse(pub)||0,source:source,image:getFirstImage(n,body+" "+desc),stale:false};
 }).filter(function(x){return x&&x.title;});
}
function parseJsonFeed(text,source){
 var data=JSON.parse(text);if(data.status&&data.status!=="ok")throw new Error(data.message||"RSS service returned an error");
 var rows=Array.isArray(data.items)?data.items:[];
 if(!rows.length)throw new Error("No stories in feed");
 return rows.slice(0,24).map(function(x){
  var link=safeUrl(x.link||x.url),title=clean(x.title,260);if(!link||!title)return null;
  return {title:title,link:link,description:clean(x.description||x.content||"",620),date:Date.parse(x.pubDate||x.published||"")||0,source:source,image:safeImage(x.thumbnail)?x.thumbnail:getFirstImage({getElementsByTagName:function(){return []; }},x.description||x.content||""),stale:false};
 }).filter(Boolean);
}
async function fetchFeed(url,source){
 var attempts=[
  {url:url,via:"publisher",timeout:8000},
  {url:"https://proxy.cors.dev/"+url,via:"feed relay",timeout:12000},
  {url:"https://api.allorigins.win/raw?url="+encodeURIComponent(url),via:"fallback relay",timeout:12000},
  {url:"https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent(url),via:"RSS converter",timeout:12000,json:true}
 ],failures=[];
 for(var i=0;i<attempts.length;i++){
  try{var text=await timeoutFetch(attempts[i].url,attempts[i].timeout);var items=attempts[i].json?parseJsonFeed(text,source):(function(){try{return parseFeed(text,source);}catch(e){return parseJsonFeed(text,source);}})();if(items.length)return {items:items,via:attempts[i].via};}
  catch(e){failures.push(attempts[i].via+": "+(e.message||"failed"));}
 }
 throw new Error(failures.join("; "));
}
function storeFeed(source,items){
 try{
  var cache={};try{cache=JSON.parse(localStorage.getItem(cacheKey)||"{}")||{};}catch(e){}
  cache[source.name]={time:Date.now(),meta:{name:source.name,region:source.region,language:source.language,site:source.site,feed:source.feed},items:items.map(function(x){return {title:x.title,link:x.link,description:x.description,date:x.date,image:x.image};})};
  localStorage.setItem(cacheKey,JSON.stringify(cache));
 }catch(e){}
}
function loadSaved(feeds){
 var restored=[],when=0;
 try{
  var cache=JSON.parse(localStorage.getItem(cacheKey)||"{}")||{};
  (feeds||[]).forEach(function(source){
   var saved=cache[source.name];if(!saved||!Array.isArray(saved.items))return;
   var rows=saved.items.filter(function(x){return x&&x.title&&safeUrl(x.link);}).map(function(x){return {title:x.title,link:safeUrl(x.link),description:clean(x.description,620),date:x.date||0,source:source,image:safeImage(x.image)?x.image:"",stale:true};});
   restored=restored.concat(rows);when=Math.max(when,saved.time||0);
  });
 }catch(e){}
 return {items:restored,publishers:new Set(restored.map(function(x){return x.source.name;})).size,time:when};
}
function fill(id,values){var el=$(id);if(!el)return;var old=el.value;Array.from(new Set(values)).sort().forEach(function(v){if(!Array.from(el.options).some(function(o){return o.value===v;}))el.insertAdjacentHTML("beforeend",'<option value="'+esc(v)+'">'+esc(v)+'</option>');});if(Array.from(el.options).some(function(o){return o.value===old;}))el.value=old;}
function syncPublisherOptions(){
 var el=$("publisherFilter"),old=el.value;
 var names=Array.from(new Set(activeFeeds.map(function(x){return x.name;}))).sort();
 el.innerHTML='<option value="">All publishers</option>'+names.map(function(x){return '<option value="'+esc(x)+'">'+esc(x)+'</option>';}).join("");
 if(names.indexOf(old)>=0)el.value=old;
}
function readLocationPrefs(){try{return JSON.parse(localStorage.getItem("jmb-newspaper-location-v1")||"{}")||{};}catch(e){return {};}}
function saveLocationPrefs(){try{localStorage.setItem("jmb-newspaper-location-v1",JSON.stringify({country:$("countryFilter").value,state:$("stateFilter").value,district:$("districtFilter").value,city:$("cityFilter").value}));}catch(e){}}
function rebuildStateOptions(preferred){
 var country=$("countryFilter").value;
 var options=country==="IN"?["Kerala"].concat(INDIA_STATES.filter(function(x){return x!=="Kerala";})):[];
 $("stateOptions").innerHTML=options.map(function(x){return '<option value="'+esc(x)+'"></option>';}).join("");
 $("stateFilter").value=preferred!==undefined?preferred:(country==="IN"?"Kerala":"");
 $("stateFilter").placeholder=country==="IN"?"Choose or type an Indian state":"Type a state, province or region";
}
function buildLocationOptions(){
 var prefs=readLocationPrefs(),country=$("countryFilter");
 country.innerHTML=COUNTRY_OPTIONS.map(function(x){return '<option value="'+x[0]+'">'+esc(x[1])+'</option>';}).join("");
 country.value=COUNTRY_OPTIONS.some(function(x){return x[0]===prefs.country;})?prefs.country:"IN";
 rebuildStateOptions(prefs.state!==undefined?prefs.state:undefined);
 $("districtFilter").value=prefs.district||"";
 updateDistrictOptions();
 $("cityFilter").value=prefs.city||"";
 updateCityOptions();
}
function updateDistrictOptions(){
 var state=$("stateFilter").value,district=$("districtFilter");
 var list=state==="Kerala"?KERALA_DISTRICTS:[];
 $("districtOptions").innerHTML=list.map(function(x){return '<option value="'+esc(x)+'"></option>';}).join("");
 district.disabled=false;
 district.placeholder=list.length?"Choose or type a Kerala district":"Type a district or locality";
}
function updateCityOptions(){
 var district=$("districtFilter").value,city=$("cityFilter");
 var list=district?(DISTRICT_CITIES[district]||[]):$("stateFilter").value==="Kerala"?Array.from(new Set([].concat.apply([],Object.keys(DISTRICT_CITIES).map(function(k){return DISTRICT_CITIES[k];})))):[];
 $("cityOptions").innerHTML=list.map(function(x){return '<option value="'+esc(x)+'"></option>';}).join("");
 city.disabled=false;
 city.placeholder=list.length?"Choose or type a city":"Type a city or town";
}
function countryLanguage(){
 var code=$("countryFilter").value||"IN",lang=$("languageFilter").value;
 if(lang==="Malayalam")return "ml";if(lang==="Hindi")return "hi";if(lang==="English")return "en";
 return code==="IN"&&$("stateFilter").value==="Kerala"?"ml":"en";
}
function locationDescription(){
 var country=COUNTRY_OPTIONS.find(function(x){return x[0]===$("countryFilter").value;});
 var state=$("stateFilter").value,district=$("districtFilter").value,city=$("cityFilter").value;
 if(country&&country[0]==="IN")return [city,district,state||"India"].filter(Boolean).join(", ");
 return [city,state,country?country[1]:"India"].filter(Boolean).join(", ");
}
function makeActiveFeeds(){
 var code=$("countryFilter").value||"IN",state=$("stateFilter").value,district=$("districtFilter").value,city=$("cityFilter").value;
 var lang=countryLanguage(),rows=[];
 if(code==="IN"&&state==="Kerala"){
  rows=sources.filter(function(s){return s.state==="Kerala";});
  if(district==="Kollam")rows.push({name:"Janabhoomi · Kollam",region:"Kollam",language:"Malayalam",lang:"ml",gl:"IN",country:"IN",state:"Kerala",site:"https://janabhoominews.com/kerala/kollam-3",feed:"https://janabhoominews.com/rss/category/kollam-3"});
 }else if(code==="IN"){
  rows=sources.filter(function(s){return s.country==="IN"&&(s.region==="India"||s.state==="Kerala");});
 }else{
  rows=sources.filter(function(s){return s.country===code||s.region==="World";}).slice(0,7);
 }
 var label=city||district||state||(COUNTRY_OPTIONS.find(function(x){return x[0]===code;})||[code,code])[1];
 var query=[label,"latest news"].join(" ")+(lang==="ml"?" Malayalam":"");
 rows.push({name:"Google News · "+label,region:label,language:lang==="ml"?"Malayalam":lang==="hi"?"Hindi":"English",lang:lang,gl:code,country:code,state:state,site:"https://news.google.com/",feed:googleQueryFeed(query,lang,code)});
 var seen=new Set();return rows.filter(function(x){if(seen.has(x.name))return false;seen.add(x.name);return true;}).slice(0,12);
}
function editionDate(){return new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});}
function updateEditionMeta(){
 var place=locationDescription();
 editionLocation=place;
 $("editionDate").textContent=editionDate();
 $("editionPlace").textContent=place.toUpperCase()+" EDITION";
 $("editionLocation").textContent=place;
}
function currentRows(){
 var q=$("newsSearch").value.toLowerCase().trim(),language=$("languageFilter").value,publisher=$("publisherFilter").value,sort=$("sortFilter").value;
 var rows=allItems.filter(function(x){var blob=(x.title+" "+x.description+" "+x.source.name+" "+x.source.region).toLowerCase();return (!q||blob.indexOf(q)>=0)&&(!language||x.source.language===language)&&(!publisher||x.source.name===publisher);});
 rows.sort(function(a,b){if(sort==="source")return a.source.name.localeCompare(b.source.name);return (b.date||0)-(a.date||0);});
 return rows;
}
function pagerMarkup(total){
 var pages=Math.max(1,Math.ceil(total/pageSize)),start=Math.max(1,Math.min(pages-6,currentPage-3)),end=Math.min(pages,start+6);
 var html='<button type="button" data-page="'+Math.max(1,currentPage-1)+'" '+(currentPage<=1?"disabled":"")+'>← Previous</button>';
 for(var n=start;n<=end;n++)html+='<button type="button" data-page="'+n+'" class="'+(n===currentPage?"is-current":"")+'" aria-current="'+(n===currentPage?"page":"false")+'">'+n+'</button>';
 html+='<button type="button" data-page="'+Math.min(pages,currentPage+1)+'" '+(currentPage>=pages?"disabled":"")+'>Next →</button>';
 return html;
}
function storyCard(x,lead,index){
 var date=x.date?new Date(x.date).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Latest update";
 var image=x.image&&safeImage(x.image)?'<img class="'+(lead?"news-thumb newspaper-lead-image":"news-thumb")+'" src="'+esc(x.image)+'" alt="" loading="lazy" onerror="this.remove()">':'<div class="news-thumb news-thumb-placeholder">📰</div>';
 var summary=esc((x.description||"The publisher has shared this headline. Open the original report for the complete article.").slice(0,lead?540:300));
 return '<article class="media-card news-card newspaper-story'+(lead?" newspaper-lead":"")+'"><div class="news-card-top">'+image+'<div class="news-card-meta"><span class="news-source">'+esc(x.source.name)+'</span><span class="muted tiny">'+esc(x.source.region)+" · "+esc(x.source.language)+'</span><span class="news-date">'+esc(date)+'</span></div></div><h3 class="news-headline">'+esc(x.title)+'</h3><p class="news-excerpt">'+summary+'</p><div class="news-card-footer"><button class="btn small" data-read="'+allItems.indexOf(x)+'" type="button">Read on JMB <span>→</span></button><a class="btn small ghost" href="'+esc(x.link)+'" target="_blank" rel="noopener noreferrer">Original article ↗</a></div></article>';
}
function render(){
 var rows=currentRows(),pages=Math.max(1,Math.ceil(rows.length/pageSize));
 currentPage=Math.max(1,Math.min(currentPage,pages));
 var start=(currentPage-1)*pageSize,visible=rows.slice(start,start+pageSize);
 var label=currentPage===1?"Front page":(currentPage===2?"Inside the edition":"More headlines");
 $("editionPageTitle").textContent=label;
 $("editionPageCounter").textContent="PAGE "+currentPage+" / "+pages;
 $("editionSummary").textContent=visible.length+" stories on this page · "+rows.length+" matching headlines in this edition";
 $("editionPageNumber").textContent=String(currentPage).padStart(2,"0");
 $("editionPageDate").textContent=editionDate();
 $("editionPagerTop").innerHTML=pagerMarkup(rows.length);
 $("editionPagerBottom").innerHTML=pagerMarkup(rows.length);
 $("newsStatus").textContent=rows.length+" stories · "+activeFeeds.length+" active feeds"+(lastUpdated?" · refreshed "+new Date(lastUpdated).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):"");
 if(!visible.length){
  $("newsGrid").innerHTML='<div class="empty-state news-empty"><div class="empty-icon">📰</div><b>No stories in this edition yet</b><p>Try a different district or city, clear a filter, or refresh the live feeds.</p><button class="btn small" id="newsEmptyRetry" type="button">Refresh edition</button></div>';
 }else{
  var lead=visible[0],others=visible.slice(1);
  $("newsGrid").innerHTML=storyCard(lead,true,0)+(others.length?'<div class="newspaper-column-grid">'+others.map(function(x,i){return storyCard(x,false,i+1);}).join("")+'</div>':"");
 }
 $("newsHealth").textContent=Object.keys(feedHealth).filter(function(k){return feedHealth[k].ok;}).length+" feeds updated";
}
function renderSources(){
 $("publisherGrid").innerHTML=sources.map(function(s){return '<a class="source-tile publisher-tile" href="'+esc(s.site)+'" target="_blank" rel="noopener noreferrer"><span class="publisher-type">OFFICIAL PUBLICATION</span><b>'+(s.featured?"★ ":"")+esc(s.name)+'</b><span>'+esc(s.region)+' · '+esc(s.language)+'</span><span class="publisher-open">Open publisher ↗</span></a>';}).join("");
}
function storeActiveCache(source,items){
 try{var cache={};try{cache=JSON.parse(localStorage.getItem(cacheKey)||"{}")||{};}catch(e){}cache[source.name]={time:Date.now(),meta:{name:source.name,region:source.region,language:source.language,site:source.site,feed:source.feed},items:items.map(function(x){return {title:x.title,link:x.link,description:x.description,date:x.date,image:x.image};})};localStorage.setItem(cacheKey,JSON.stringify(cache));}catch(e){}
}
function restoreActiveCache(){
 var saved=loadSaved(activeFeeds);allItems=saved.items;lastUpdated=saved.time||0;
 if(saved.publishers) setStatus("Restored "+saved.publishers+" saved feeds · checking for new Kerala headlines…");
}
function renderHealth(){
 var ok=Object.keys(feedHealth).filter(function(k){return feedHealth[k].ok;}).length;
 $("newsHealth").textContent=ok+" of "+activeFeeds.length+" feeds updated";
}
async function refreshFeeds(){
 if(loading)return;loading=true;
 var button=$("newsRetry");if(button){button.disabled=true;button.textContent="Refreshing…";}
 setStatus("Refreshing the latest stories for "+editionLocation+"…");
 var settled=await Promise.allSettled(activeFeeds.map(async function(source){
  var result=await fetchFeed(source.feed,source),items=result.items;
  items.forEach(function(x){x.via=result.via;x.stale=false;});
  storeActiveCache(source,items);feedHealth[source.name]={ok:true,via:result.via,count:items.length};
  return items;
 }));
 var fresh=[];
 settled.forEach(function(r,i){if(r.status==="fulfilled")fresh=fresh.concat(r.value);else feedHealth[activeFeeds[i].name]={ok:false,error:r.reason&&r.reason.message||"Feed unavailable",count:0};});
 if(fresh.length){
  var byLink=new Map();fresh.forEach(function(x){byLink.set(x.link,x);});
  allItems.forEach(function(x){if(!byLink.has(x.link))byLink.set(x.link,x);});
  allItems=Array.from(byLink.values()).sort(function(a,b){return (b.date||0)-(a.date||0);}).filter(function(item){return !item.date||item.date>Date.now()-30*86400000;}).slice(0,160);
  lastUpdated=Date.now();currentPage=1;
  setStatus(fresh.length+" fresh stories · "+Object.keys(feedHealth).filter(function(k){return feedHealth[k].ok;}).length+" feeds connected");
 }else if(allItems.length)setStatus("Showing the saved "+editionLocation+" edition · live feeds are temporarily unavailable");
 else setStatus("Could not connect to the selected news feeds. Try again or change location.");
 render();renderHealth();
 if(button){button.disabled=false;button.textContent=fresh.length?"↻ Refresh edition":"↻ Try again";}
 loading=false;
}
async function changeLocation(){
 currentPage=1;saveLocationPrefs();feedHealth={};activeFeeds=makeActiveFeeds();syncPublisherOptions();updateEditionMeta();restoreActiveCache();render();
 await refreshFeeds();
}
function openReader(index){
 var x=allItems[index];if(!x)return;
 var panel=$("articleReader"),date=x.date?new Date(x.date).toLocaleString("en-IN",{dateStyle:"full",timeStyle:"short"}):"Latest update";
 var image=x.image&&safeImage(x.image)?'<img class="reader-image" src="'+esc(x.image)+'" alt="" loading="lazy" onerror="this.remove()">':"";
 $("readerContent").innerHTML='<div class="reader-kicker">JMB DAILY · STORY READER</div><div class="reader-toolbar"><span>PAGE '+currentPage+' · '+esc(editionLocation)+'</span><button id="readerShare" type="button">Share ↗</button></div>'+image+'<div class="reader-source">'+esc(x.source.name)+' · '+esc(x.source.region)+' · '+esc(x.source.language)+'</div><h2>'+esc(x.title)+'</h2><div class="reader-date">'+esc(date)+'</div><article class="reader-article"><p>'+esc(x.description||"The publisher supplied a headline but no preview text for this story.")+'</p></article><div class="reader-note">This JMB reading page shows the headline and short preview supplied by the publisher’s feed. The publisher’s original report may contain additional details, images and updates.</div><div class="reader-actions"><a class="btn small" href="'+esc(x.link)+'" target="_blank" rel="noopener noreferrer">Continue to original article ↗</a><a class="btn small ghost" href="'+esc(x.source.site)+'" target="_blank" rel="noopener noreferrer">Publisher homepage ↗</a></div>';
 panel.hidden=false;panel.setAttribute("aria-hidden","false");document.body.classList.add("reader-open");panel.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
 var share=$("readerShare");if(share)share.addEventListener("click",async function(){try{if(navigator.share)await navigator.share({title:x.title,url:x.link});else{await navigator.clipboard.writeText(x.link);window.JMBToast("Story link copied");}}catch(e){if(e.name!=="AbortError")window.JMBToast("Could not share this story");}});
 $("readerClose").focus();
}
function closeReader(){var panel=$("articleReader");if(panel){panel.hidden=true;panel.setAttribute("aria-hidden","true");document.body.classList.remove("reader-open");}}
function init(){
 buildLocationOptions();renderSources();activeFeeds=makeActiveFeeds();updateEditionMeta();restoreActiveCache();
 fill("languageFilter",["Malayalam","English","Hindi"]);
 syncPublisherOptions();
 var query=new URLSearchParams(location.search).get("q");if(query)$("newsSearch").value=query.slice(0,120);
 $("newsRetry").addEventListener("click",refreshFeeds);
 $("newsGrid").addEventListener("click",function(e){var b=e.target.closest("[data-read]");if(b)openReader(Number(b.getAttribute("data-read")));if(e.target.closest("#newsEmptyRetry"))refreshFeeds();});
 function pagerClick(e){var b=e.target.closest("[data-page]");if(!b||b.disabled)return;currentPage=Number(b.getAttribute("data-page"))||1;render();$("editionPageTop").scrollIntoView({behavior:"smooth",block:"start"});}
 $("editionPagerTop").addEventListener("click",pagerClick);$("editionPagerBottom").addEventListener("click",pagerClick);
 $("readerClose").addEventListener("click",closeReader);$("articleReader").addEventListener("click",function(e){if(e.target===this)closeReader();});document.addEventListener("keydown",function(e){if(e.key==="Escape")closeReader();});
 $("manoramaOnJmb").addEventListener("click",function(){$("publisherFilter").value="Malayala Manorama";currentPage=1;render();$("editionPageTop").scrollIntoView({behavior:"smooth",block:"start"});});
 ["newsSearch","publisherFilter","sortFilter"].forEach(function(id){$(id).addEventListener(id==="newsSearch"?"input":"change",function(){currentPage=1;render();});});
 $("languageFilter").addEventListener("change",changeLocation);
 $("countryFilter").addEventListener("change",function(){
  rebuildStateOptions();
  $("districtFilter").value="";$("cityFilter").value="";
  updateDistrictOptions();updateCityOptions();changeLocation();
 });
 $("stateFilter").addEventListener("change",function(){
  $("districtFilter").value="";$("cityFilter").value="";
  updateDistrictOptions();updateCityOptions();changeLocation();
 });
 $("districtFilter").addEventListener("change",function(){$("cityFilter").value="";updateCityOptions();changeLocation();});
 $("cityFilter").addEventListener("change",changeLocation);
 render();refreshFeeds();
}
var activeFeeds=[];
init();
})();