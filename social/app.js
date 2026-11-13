(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var sources=[
 {name:"Malayala Manorama",region:"Kerala",kind:"text",url:"https://www.manoramaonline.com/"},
 {name:"Mathrubhumi",region:"Kerala",kind:"text",url:"https://www.mathrubhumi.com/"},
 {name:"Deshabhimani",region:"Kerala",kind:"text",url:"https://www.deshabhimani.com/"},
 {name:"Madhyamam",region:"Kerala",kind:"text",url:"https://www.madhyamam.com/"},
 {name:"The Hindu",region:"India",kind:"text",url:"https://www.thehindu.com/"},
 {name:"The Indian Express",region:"India",kind:"text",url:"https://indianexpress.com/"},
 {name:"The Times of India",region:"India",kind:"text",url:"https://timesofindia.indiatimes.com/"},
 {name:"BBC News Malayalam",region:"World",kind:"text",url:"https://www.bbc.com/malayalam"},
 {name:"BBC News",region:"World",kind:"text",url:"https://www.bbc.com/news"},
 {name:"Al Jazeera",region:"World",kind:"text",url:"https://www.aljazeera.com/"},
 {name:"The Guardian",region:"World",kind:"text",url:"https://www.theguardian.com/international"},
 {name:"Deutsche Welle",region:"World",kind:"text",url:"https://www.dw.com/en/top-stories/s-9097"},
 {name:"NPR",region:"World",kind:"text",url:"https://www.npr.org/"},
 {name:"BBC News — YouTube",region:"World",kind:"video",url:"https://www.youtube.com/@BBCNews"},
 {name:"Al Jazeera English — YouTube",region:"World",kind:"video",url:"https://www.youtube.com/@aljazeeraenglish"},
 {name:"The Take — Al Jazeera",region:"World",kind:"audio",url:"https://www.aljazeera.com/podcasts/"},
 {name:"NPR Podcasts",region:"World",kind:"audio",url:"https://www.npr.org/podcasts/"}
];
function esc(v){return String(v||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function fill(id,values){Array.from(new Set(values)).sort().forEach(function(v){$(id).insertAdjacentHTML("beforeend",'<option value="'+esc(v)+'">'+esc(v)+'</option>');});}
function card(s){var label=s.kind==="text"?"NEWS PUBLISHER":s.kind==="video"?"OFFICIAL VIDEO CHANNEL":"PODCAST / AUDIO";return '<a class="source-tile" href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer"><span class="publisher-type">'+label+'</span><b>'+esc(s.name)+'</b><span>'+esc(s.region)+' · Source website</span><span class="publisher-open">Visit original source ↗</span></a>';}
function render(){
 var q=$("socialSearch").value.trim().toLowerCase(),kind=$("formatFilter").value,region=$("regionFilter").value,source=$("sourceFilter").value;
 var rows=sources.filter(function(s){return (!q||(s.name+" "+s.region).toLowerCase().indexOf(q)>=0)&&(!kind||s.kind===kind)&&(!region||s.region===region)&&(!source||s.name===source);});
 $("socialStatus").textContent=rows.length+" source websites · no articles or media copied into JMB";
 $("storyList").innerHTML=rows.length?rows.map(card).join(""):'<div class="empty-state">No source matches that search.</div>';
}
fill("regionFilter",sources.map(function(s){return s.region;}));fill("sourceFilter",sources.map(function(s){return s.name;}));
["socialSearch","formatFilter","regionFilter","sourceFilter"].forEach(function(id){$(id).addEventListener(id==="socialSearch"?"input":"change",render);});
$("videoDesk").innerHTML=sources.filter(function(s){return s.kind==="video";}).map(card).join("");
$("audioDesk").innerHTML=sources.filter(function(s){return s.kind==="audio";}).map(card).join("");
render();
})();