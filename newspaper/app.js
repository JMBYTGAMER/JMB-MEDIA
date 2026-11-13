(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var publishers=[
 {name:"Malayala Manorama",region:"Kerala",language:"Malayalam",url:"https://www.manoramaonline.com/"},
 {name:"Mathrubhumi",region:"Kerala",language:"Malayalam",url:"https://www.mathrubhumi.com/"},
 {name:"Deshabhimani",region:"Kerala",language:"Malayalam",url:"https://www.deshabhimani.com/"},
 {name:"Madhyamam",region:"Kerala",language:"Malayalam",url:"https://www.madhyamam.com/"},
 {name:"Kerala Kaumudi",region:"Kerala",language:"Malayalam",url:"https://keralakaumudi.com/"},
 {name:"The Hindu — Kerala",region:"India",language:"English",url:"https://www.thehindu.com/news/national/kerala/"},
 {name:"The Hindu",region:"India",language:"English",url:"https://www.thehindu.com/"},
 {name:"The Indian Express",region:"India",language:"English",url:"https://indianexpress.com/"},
 {name:"The Times of India",region:"India",language:"English",url:"https://timesofindia.indiatimes.com/"},
 {name:"BBC News Malayalam",region:"World",language:"Malayalam",url:"https://www.bbc.com/malayalam"},
 {name:"BBC News",region:"World",language:"English",url:"https://www.bbc.com/news"},
 {name:"Al Jazeera",region:"World",language:"English",url:"https://www.aljazeera.com/"},
 {name:"The Guardian",region:"World",language:"English",url:"https://www.theguardian.com/international"},
 {name:"Deutsche Welle",region:"World",language:"English",url:"https://www.dw.com/en/top-stories/s-9097"},
 {name:"NPR",region:"World",language:"English",url:"https://www.npr.org/sections/news/"}
];
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function fill(id,values){Array.from(new Set(values)).sort().forEach(function(v){$(id).insertAdjacentHTML("beforeend",'<option value="'+esc(v)+'">'+esc(v)+'</option>');});}
function render(){
 var q=$("publisherSearch").value.trim().toLowerCase(),region=$("publisherRegion").value,language=$("publisherLanguage").value;
 var rows=publishers.filter(function(p){return (!q||(p.name+" "+p.region+" "+p.language).toLowerCase().indexOf(q)>=0)&&(!region||p.region===region)&&(!language||p.language===language);});
 $("publisherStatus").textContent=rows.length+" publisher websites";
 $("publisherGrid").innerHTML=rows.length?rows.map(function(p){
  return '<a class="source-tile publisher-tile" href="'+esc(p.url)+'" target="_blank" rel="noopener noreferrer"><span class="publisher-type">PUBLISHER WEBSITE</span><b>'+esc(p.name)+'</b><span>'+esc(p.region)+' · '+esc(p.language)+'</span><span class="publisher-open">Visit publisher ↗</span></a>';
 }).join(""):'<div class="empty-state">No publisher matches that search.</div>';
}
fill("publisherRegion",publishers.map(function(p){return p.region;}));
fill("publisherLanguage",publishers.map(function(p){return p.language;}));
["publisherSearch","publisherRegion","publisherLanguage"].forEach(function(id){$(id).addEventListener(id==="publisherSearch"?"input":"change",render);});
render();
})();