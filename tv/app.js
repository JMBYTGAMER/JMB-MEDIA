(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var API="https://iptv-org.github.io/api/",channels=[],countries={},categories={},visible=60,loading=false;
function esc(v){return String(v||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function safeSite(value){try{var u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password?u.href:"";}catch(e){return "";}}
function monogram(name){return String(name||"TV").split(/\s+/).filter(Boolean).slice(0,2).map(function(s){return s.slice(0,1);}).join("").toUpperCase()||"TV";}
async function fetchJson(path){var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},12000);try{var r=await fetch(API+path,{signal:controller.signal,cache:"no-store",headers:{"Accept":"application/json"}});if(!r.ok)throw new Error("Directory request failed: "+r.status);return await r.json();}finally{clearTimeout(timer);}}
function fill(id,values,label,displayMap){var el=$(id),old=el.value,unique=Array.from(new Set(values.filter(Boolean))).sort(function(a,b){return String(displayMap&&displayMap[a]||a).localeCompare(String(displayMap&&displayMap[b]||b));});el.innerHTML='<option value="">'+esc(label)+'</option>'+unique.map(function(v){return '<option value="'+esc(v)+'">'+esc(displayMap&&displayMap[v]||v)+'</option>';}).join("");if(unique.indexOf(old)>=0)el.value=old;}
function terms(ch){return [ch.name].concat(ch.alt_names||[],ch.network||[],ch.owners||[],(ch.categories||[]).map(function(id){return categories[id]||id;}),countries[ch.country]||ch.country||"").join(" ").toLowerCase();}
function matches(ch,q){if(!q)return true;var n=q.toLowerCase().trim();if(/\bbigg?\s*boss\b/.test(n))return /asianet/i.test(ch.name+" "+(ch.alt_names||[]).join(" ")+" "+(ch.network||""));return terms(ch).indexOf(n)>=0;}
function filtered(){var q=$("channelSearch").value.trim(),country=$("countryFilter").value,category=$("categoryFilter").value,rows=channels.filter(function(ch){return matches(ch,q)&&(!country||ch.country===country)&&(!category||(ch.categories||[]).indexOf(category)>=0);});rows.sort(function(a,b){if($("sortFilter").value==="country"){var c=(countries[a.country]||a.country||"").localeCompare(countries[b.country]||b.country||"");if(c)return c;}return a.name.localeCompare(b.name);});return rows;}
function render(){
 var q=$("channelSearch").value.trim(),rows=filtered();
 $("directoryStatus").textContent=rows.length.toLocaleString()+" matching channels · "+channels.length.toLocaleString()+" directory entries";
 $("programmeNotice").hidden=!/\bbigg?\s*boss\b/i.test(q);
 if(!$("programmeNotice").hidden)$("programmeNotice").textContent="Programme match: Asianet is a possible broadcaster listing. This does not confirm that a programme is currently available. Check the broadcaster's own schedule.";
 var show=rows.slice(0,visible);
 $("channelGrid").innerHTML=show.length?show.map(function(ch){
  var site=safeSite(ch.website),country=countries[ch.country]||ch.country||"Country not listed",tags=[country].concat((ch.categories||[]).slice(0,2).map(function(id){return categories[id]||id;}));
  return '<article class="tv-channel-card"><div class="tv-channel-top"><div class="tv-channel-monogram" aria-hidden="true">'+esc(monogram(ch.name))+'</div><div class="tv-channel-name">'+esc(ch.name)+'<div class="tv-channel-meta">'+esc(ch.network||"Television channel")+'</div></div></div><div class="tv-channel-tags">'+tags.map(function(tag){return "<span>"+esc(tag)+"</span>";}).join("")+'</div><div class="tv-channel-action">'+(site?'<a href="'+esc(site)+'" target="_blank" rel="noopener noreferrer">Visit listed broadcaster website ↗</a>':'<span class="tv-no-site">No secure website listed</span>')+'</div></article>';
 }).join(""):'<div class="empty-state"><b>No matching channels</b><p>Try another spelling or clear one of the filters.</p></div>';
 $("loadMoreChannels").hidden=rows.length<=visible;
}
async function load(){if(loading)return;loading=true;$("directoryRefresh").disabled=true;$("directoryRefresh").textContent="Refreshing…";$("directoryStatus").textContent="Checking channel and removal lists…";$("channelGrid").innerHTML='<div class="loading-state">Loading channel records <span class="loading-dot"></span></div>';
 try{
  var r=await Promise.all([fetchJson("channels.json"),fetchJson("blocklist.json"),fetchJson("countries.json"),fetchJson("categories.json")]);
  countries={};categories={};r[2].forEach(function(x){if(x.code)countries[x.code]=x.name;});r[3].forEach(function(x){if(x.id)categories[x.id]=x.name;});
  var blocked=new Set(r[1].map(function(x){return x.channel;}).filter(Boolean));
  channels=r[0].filter(function(ch){return ch&&ch.id&&ch.name&&!ch.is_nsfw&&!ch.closed&&!ch.replaced_by&&!blocked.has(ch.id)&&safeSite(ch.website);});
  fill("countryFilter",channels.map(function(ch){return ch.country; }),"All countries",countries);
  fill("categoryFilter",Array.from(new Set(channels.reduce(function(all,ch){return all.concat(ch.categories||[]);},[]))),"All categories",categories);
  channels.sort(function(a,b){return a.name.localeCompare(b.name);});visible=60;render();
 }catch(error){$("directoryStatus").textContent="The channel directory is temporarily unavailable.";$("channelGrid").innerHTML='<div class="empty-state"><b>Could not load channel data</b><p>Check your connection and try again. JMB TV does not use third-party stream proxies as a fallback.</p><button class="btn small" type="button" id="retryChannelLoad">Try again</button></div>';var retry=$("retryChannelLoad");if(retry)retry.addEventListener("click",load);}
 finally{loading=false;$("directoryRefresh").disabled=false;$("directoryRefresh").textContent="↻ Refresh";}
}
$("channelSearch").addEventListener("input",function(){visible=60;render();});["countryFilter","categoryFilter","sortFilter"].forEach(function(id){$(id).addEventListener("change",function(){visible=60;render();});});$("loadMoreChannels").addEventListener("click",function(){visible+=60;render();});$("directoryRefresh").addEventListener("click",load);
var initial=new URLSearchParams(location.search).get("q");if(initial)$("channelSearch").value=initial;load();
})();