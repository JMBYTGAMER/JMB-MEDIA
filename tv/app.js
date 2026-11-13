(function(){
  "use strict";
  var $=function(id){return document.getElementById(id);};
  var API="https://iptv-org.github.io/api/";
  var PLAYLIST="https://iptv-org.github.io/iptv/index.m3u";
  var PAGE_SIZE=60;
  var state={all:[],filtered:[],shown:0,current:null,hls:null,streamIndex:0,playerTimer:null,favOnly:false,loading:false};
  var favourites=new Set();
  try{favourites=new Set(JSON.parse(localStorage.getItem("jmbtv-favourites")||"[]"));}catch(e){}
  var channelMap=new Map(),feedMap=new Map(),countryMap=new Map(),languageMap=new Map(),categoryMap=new Map(),logoMap=new Map(),blocked=new Set();

  function escapeHTML(value){
    return String(value==null?"":value).replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch];
    });
  }
  function readAttr(line,name){
    var match=line.match(new RegExp("(?:^|\\s)"+name+"=\"([^\"]*)\"","i"));
    return match?match[1].trim():"";
  }
  function unique(list){return Array.from(new Set(list.filter(Boolean))).sort(function(a,b){return String(a).localeCompare(String(b));});}
  function getJSON(url){return fetch(url,{mode:"cors",cache:"default"}).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json();});}
  function getText(url){return fetch(url,{mode:"cors",cache:"default"}).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.text();});}
  function baseChannelId(id){return String(id||"").split("@")[0].trim();}
  function parsePlaylist(text){
    var result=[],current=null;
    text.split(/\r?\n/).forEach(function(raw){
      var line=raw.trim();
      if(line.indexOf("#EXTINF:")===0){
        var comma=line.lastIndexOf(",");
        current={
          name:comma>=0?line.slice(comma+1).trim():(readAttr(line,"tvg-name")||"Unknown channel"),
          id:readAttr(line,"tvg-id"),
          logo:readAttr(line,"tvg-logo"),
          countryHint:readAttr(line,"tvg-country"),
          languageHint:readAttr(line,"tvg-language"),
          categoryHint:readAttr(line,"group-title"),
          qualityHint:readAttr(line,"tvg-quality")||readAttr(line,"quality")||readAttr(line,"resolution")
        };
      }else if(current&&line&&line.charAt(0)!=="#"){
        if(/^https?:\/\//i.test(line)) {
          current.url=line;
          result.push(current);
        }
        current=null;
      }
    });
    return result;
  }
  function qualityScore(value){
    var s=String(value||"").toLowerCase();
    if(/2160|4k|uhd/.test(s))return 6;
    if(/1440/.test(s))return 5.5;
    if(/1080|fhd/.test(s))return 5;
    if(/720|hd/.test(s))return 4;
    if(/576/.test(s))return 3;
    if(/480|sd/.test(s))return 2;
    return 0;
  }
  function streamScore(item){
    var score=qualityScore(item.qualityHint||item.name);
    if(/^https:/i.test(item.url))score+=1;
    if(/\.m3u8?(?:$|[?#])/i.test(item.url))score+=.25;
    return score;
  }
  function inferCountry(meta,item,feed,id){
    var code=(meta&&meta.country)||item.countryHint||"";
    if(!code&&feed&&Array.isArray(feed.broadcast_area)){
      var area=feed.broadcast_area.find(function(x){return /^c\/[A-Z]{2}$/i.test(x);});
      if(area)code=area.slice(2);
      if(!code){
        var subdivision=feed.broadcast_area.find(function(x){return /^s\/[A-Z]{2}-/i.test(x);});
        if(subdivision)code=subdivision.slice(2,4);
      }
    }
    if(!code&&id){
      var suffix=baseChannelId(id).match(/\.([a-z]{2})$/i);
      if(suffix&&countryMap.has(suffix[1].toUpperCase()))code=suffix[1];
    }
    code=String(code||"").toUpperCase();
    return /^[A-Z]{2}$/.test(code)?code:"";
  }
  function isAdult(item,meta){
    var categories=(meta&&meta.categories)||[];
    var text=[item.name,item.categoryHint||"",categories.join(" ")].join(" ").toLowerCase();
    return !!(meta&&meta.is_nsfw)||/\b(adult|xxx|porn|pornography|erotic|explicit|sex\s*tv)\b/i.test(text);
  }
  function configureMetadata(channels,feeds,logos,countries,languages,categories,blocklist){
    channelMap=new Map((channels||[]).map(function(x){return [x.id,x];}));
    feedMap=new Map();
    (feeds||[]).forEach(function(feed){
      var id=baseChannelId(feed.channel);
      if(!id)return;
      var previous=feedMap.get(id);
      if(!previous||(feed.is_main&&!previous.is_main))feedMap.set(id,feed);
    });
    countryMap=new Map((countries||[]).map(function(x){return [String(x.code||"").toUpperCase(),x];}));
    languageMap=new Map((languages||[]).map(function(x){return [x.code,x.name];}));
    categoryMap=new Map((categories||[]).map(function(x){return [x.id,x.name];}));
    logoMap=new Map();
    (logos||[]).forEach(function(item){
      var id=baseChannelId(item.channel);
      if(!id||!item.url||!/^https:\/\//i.test(item.url))return;
      var old=logoMap.get(id);
      if(!old||(item.in_use&&!old.in_use))logoMap.set(id,item);
    });
    blocked=new Set((blocklist||[]).map(function(x){return baseChannelId(x.channel);}).filter(Boolean));
  }
  function buildChannels(entries){
    var grouped=new Map();
    entries.forEach(function(item){
      var id=baseChannelId(item.id);
      var meta=(id&&channelMap.get(id))||(item.id&&channelMap.get(item.id))||null;
      if((id&&blocked.has(id))||(meta&&(meta.is_nsfw||meta.closed||meta.replaced_by))||isAdult(item,meta))return;
      var key=id||("name:"+item.name.trim().toLowerCase().replace(/\s+/g," "));
      if(!key||!item.url)return;
      var row=grouped.get(key);
      if(!row){
        var feed=feedMap.get(id)||null;
        var countryCode=inferCountry(meta,item,feed,id);
        var country=countryMap.get(countryCode);
        var cats=(meta&&meta.categories&&meta.categories.length?meta.categories:[])
          .map(function(x){return categoryMap.get(x)||String(x).replace(/[-_]/g," ").replace(/\b\w/g,function(c){return c.toUpperCase();});});
        if(!cats.length)cats=(item.categoryHint||"").split(/[;,]/).map(function(x){return x.trim();}).filter(Boolean);
        var langs=(feed&&feed.languages||[]).map(function(x){return languageMap.get(x)||x;});
        if(!langs.length&&item.languageHint)langs=item.languageHint.split(/[;,]/).map(function(x){return x.trim();}).filter(Boolean);
        var logo=(logoMap.get(id)&&logoMap.get(id).url)||item.logo||"";
        if(!/^https:\/\//i.test(logo))logo="";
        row={
          key:key,id:id,name:(meta&&meta.name)||item.name||"Unknown channel",
          countryCode:countryCode,countryName:(country&&country.name)||countryCode||"Country not listed",
          flag:(country&&country.flag)||"",categories:unique(cats),languages:unique(langs),
          quality:(feed&&feed.format)||item.qualityHint||"",logo:logo,streams:[],network:(meta&&meta.network)||""
        };
        grouped.set(key,row);
      }
      if(!row.streams.some(function(x){return x.url===item.url;})){
        row.streams.push({url:item.url,quality:item.qualityHint||"",score:streamScore(item)});
      }
      if((!row.quality||row.quality==="")&&(item.qualityHint))row.quality=item.qualityHint;
      if(!row.logo&&item.logo&&/^https:\/\//i.test(item.logo))row.logo=item.logo;
      if(!row.countryCode){
        var feed=feedMap.get(id)||null, meta2=(id&&channelMap.get(id))||null;
        var code=inferCountry(meta2,item,feed,id), country2=countryMap.get(code);
        if(code){row.countryCode=code;row.countryName=(country2&&country2.name)||code;row.flag=(country2&&country2.flag)||"";}
      }
      if(!row.languages.length&&item.languageHint)row.languages=unique(item.languageHint.split(/[;,]/).map(function(x){return x.trim();}));
      if(!row.categories.length&&item.categoryHint)row.categories=unique(item.categoryHint.split(/[;,]/).map(function(x){return x.trim();}));
    });
    var result=Array.from(grouped.values());
    result.forEach(function(row){
      row.streams.sort(function(a,b){return b.score-a.score;});
      if(!row.quality&&row.streams.length)row.quality=row.streams[0].quality;
      if(!row.categories.length)row.categories=["Other"];
    });
    return result.sort(function(a,b){return a.name.localeCompare(b.name);});
  }
  function updateCounts(){
    $("channelCount").textContent=state.all.length.toLocaleString();
    var countries=unique(state.all.map(function(x){return x.countryCode;}));
    $("countryCount").textContent=countries.length
      ? countries.length.toLocaleString()+" countries represented"
      : "Country details not supplied by the source";
    $("favouritesCount").textContent=favourites.size.toLocaleString();
  }
  function fillSelect(element,values,label,formatter){
    var old=element.value;
    element.innerHTML="";
    var first=document.createElement("option");first.value="";first.textContent=label;element.appendChild(first);
    values.forEach(function(value){
      var option=document.createElement("option");option.value=value;option.textContent=formatter?formatter(value):value;element.appendChild(option);
    });
    if(values.indexOf(old)>=0)element.value=old;
  }
  function updateFilters(){
    fillSelect($("countryFilter"),unique(state.all.map(function(x){return x.countryCode;})),"Every country",function(code){
      var item=countryMap.get(code);return (item&&item.flag?item.flag+" ":"")+((item&&item.name)||code);
    });
    fillSelect($("languageFilter"),unique(state.all.reduce(function(a,x){return a.concat(x.languages);},[])),"Every language");
    fillSelect($("categoryFilter"),unique(state.all.reduce(function(a,x){return a.concat(x.categories);},[])),"Every category");
  }
  function cardHTML(channel,index){
    var initials=channel.name.split(/\s+/).slice(0,2).map(function(x){return x.charAt(0);}).join("").toUpperCase();
    var detail=[channel.countryName,channel.languages.slice(0,1)[0]||channel.categories[0]||""].filter(Boolean);
    var saved=favourites.has(channel.key);
    var quality=channel.quality||"FORMAT N/A";
    return '<article class="channel-card" data-channel="'+escapeHTML(channel.key)+'" tabindex="0" role="button" aria-label="Play '+escapeHTML(channel.name)+'" style="animation-delay:'+Math.min(index,20)*13+'ms">'+
      '<div class="logo-stage"><span class="logo-fallback">'+escapeHTML(initials||"TV")+'</span>'+
      (channel.logo?'<img class="channel-logo" src="'+escapeHTML(channel.logo)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" alt="'+escapeHTML(channel.name)+' logo">':"")+
      '<span class="play-hover">▶ WATCH</span></div>'+
      '<h3 class="channel-name" title="'+escapeHTML(channel.name)+'">'+escapeHTML(channel.name)+'</h3>'+
      '<div class="channel-meta">'+detail.map(function(x){return "<span>"+escapeHTML(x)+"</span>";}).join("")+'</div>'+
      '<div class="card-bottom"><span class="format-tag'+(channel.quality?"":" muted")+'">'+escapeHTML(quality)+'</span>'+
      '<button class="card-favourite'+(saved?" saved":"")+'" data-favourite="'+escapeHTML(channel.key)+'" type="button" aria-label="'+(saved?"Remove from":"Add to")+' favourites" aria-pressed="'+saved+'">'+(saved?"♥":"♡")+'</button></div></article>';
  }
  function render(){
    var query=$("searchInput").value.trim().toLowerCase();
    var country=$("countryFilter").value,language=$("languageFilter").value,category=$("categoryFilter").value,sort=$("sortFilter").value;
    var rows=state.all.filter(function(x){
      var haystack=[x.name,x.network,x.countryName,x.countryCode,x.categories.join(" "),x.languages.join(" ")].join(" ").toLowerCase();
      return (!query||haystack.indexOf(query)>=0)&&(!country||x.countryCode===country)&&
        (!language||x.languages.indexOf(language)>=0)&&(!category||x.categories.indexOf(category)>=0)&&
        (!state.favOnly||favourites.has(x.key));
    });
    rows.sort(function(a,b){
      if(sort==="country")return a.countryName.localeCompare(b.countryName)||a.name.localeCompare(b.name);
      if(sort==="quality")return qualityScore(b.quality)-qualityScore(a.quality)||a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
    state.filtered=rows;state.shown=0;$("channelGrid").innerHTML="";
    $("emptyState").hidden=rows.length>0;
    $("emptyState").querySelector("h3").textContent=state.favOnly?"No saved favourites yet":"Nothing matched your search";
    $("emptyState").querySelector("p").textContent=state.favOnly?"Tap the heart on any channel to save it here.":"Try another word or reset your filters.";
    $("resultCount").textContent=rows.length.toLocaleString()+" of "+state.all.length.toLocaleString()+" channels";
    $("favouritesToggle").setAttribute("aria-pressed",String(state.favOnly));
    $("favouritesToggle").querySelector(".heart").textContent=state.favOnly?"♥":"♡";
    renderMore();
  }
  function renderMore(){
    var next=state.filtered.slice(state.shown,state.shown+PAGE_SIZE);
    $("channelGrid").insertAdjacentHTML("beforeend",next.map(cardHTML).join(""));
    state.shown+=next.length;
    $("loadMore").hidden=state.shown>=state.filtered.length;
    $("loadMore").textContent=state.shown>=state.filtered.length?"All channels shown":"Show more channels ↓";
    $("resultCount").textContent=state.filtered.length.toLocaleString()+" of "+state.all.length.toLocaleString()+" channels · showing "+state.shown.toLocaleString();
    $("channelGrid").querySelectorAll("img.channel-logo").forEach(function(img){
      img.addEventListener("error",function(){img.remove();},{once:true});
    });
  }
  function saveFavourites(){
    try{localStorage.setItem("jmbtv-favourites",JSON.stringify(Array.from(favourites)));}catch(e){}
    updateCounts();
  }
  function safeStreamURL(raw){
    try{
      var url=new URL(raw);
      if(url.protocol!=="http:"&&url.protocol!=="https:")return null;
      if(url.username||url.password)return null;
      var host=url.hostname.toLowerCase();
      if(host==="localhost"||host.endsWith(".local")||host==="127.0.0.1"||host==="0.0.0.0"||host==="169.254.169.254"||/^10\./.test(host)||/^192\.168\./.test(host)||/^172\.(1[6-9]|2\d|3[01])\./.test(host))return null;
      if(location.protocol==="https:"&&url.protocol==="http:")url.protocol="https:";
      return url.href;
    }catch(e){return null;}
  }
  function stopVideo(){
    clearTimeout(state.playerTimer);
    var video=$("liveVideo");
    video.onerror=null;video.onplaying=null;video.oncanplay=null;
    if(state.hls){state.hls.destroy();state.hls=null;}
    video.pause();video.removeAttribute("src");video.load();
    $("playerLoading").hidden=true;
  }
  function setPlayerError(message){
    clearTimeout(state.playerTimer);
    $("playerLoading").hidden=true;
    $("playerError").hidden=false;
    $("playerErrorText").textContent=message;
    $("retryButton").textContent=state.current&&state.streamIndex<state.current.streams.length-1?"Try another listed source":"Retry this channel";
  }
  function playSource(index){
    if(!state.current)return;
    stopVideo();
    state.streamIndex=index;
    var channel=state.current;
    var stream=channel.streams[index];
    var source=safeStreamURL(stream&&stream.url);
    $("playerError").hidden=true;
    $("playerLoading").hidden=false;
    $("playerTitle").textContent=channel.name;
    var details=[channel.countryName,channel.languages[0]||channel.categories[0]||"",stream&&stream.quality||channel.quality].filter(Boolean);
    $("playerDescription").textContent=details.join(" · ")+(channel.streams.length>1?" · Source "+(index+1)+" of "+channel.streams.length:"");
    if(!source){setPlayerError("This entry does not contain a safe, valid web stream address.");return;}
    var video=$("liveVideo");
    state.playerTimer=setTimeout(function(){
      if(state.current===channel&&video.readyState<2)setPlayerError("The stream did not start. Its host may be offline, region-limited or may not support browser playback.");
    },22000);
    video.onplaying=function(){clearTimeout(state.playerTimer);$("playerLoading").hidden=true;$("playerError").hidden=true;};
    video.oncanplay=function(){if(video.readyState>=2)$("playerLoading").hidden=true;};
    video.onerror=function(){
      if(state.current===channel)setPlayerError("Your browser could not load this source. It may be offline, restricted or reject direct browser connections.");
    };
    var isHLS=/\.m3u8?(?:$|[?#])/i.test(source);
    if(isHLS&&window.Hls&&Hls.isSupported()){
      var hls=new Hls({enableWorker:true,lowLatencyMode:false,maxBufferLength:35,backBufferLength:20,capLevelToPlayerSize:true});
      state.hls=hls;
      hls.on(Hls.Events.ERROR,function(event,data){
        if(data&&data.fatal&&state.current===channel){
          setPlayerError(data.type===Hls.ErrorTypes.NETWORK_ERROR
            ?"The stream host did not send a playable stream. Try another listed source, or come back later."
            :"This stream format is not supported by the browser or the source rejected playback.");
        }
      });
      hls.on(Hls.Events.MANIFEST_PARSED,function(){
        video.play().catch(function(){$("playerLoading").hidden=true;});
      });
      hls.loadSource(source);hls.attachMedia(video);
    }else{
      if(isHLS&&!video.canPlayType("application/vnd.apple.mpegurl")){
        setPlayerError("This browser does not support HLS playback. Try another browser or another listed source.");return;
      }
      video.src=source;
      video.play().catch(function(){
        $("playerLoading").hidden=true;
        if(video.error)setPlayerError("This browser could not start the channel. Try another listed source.");
      });
    }
  }
  function playChannel(key){
    var channel=state.all.find(function(x){return x.key===key;});
    if(!channel)return;
    state.current=channel;state.streamIndex=0;
    $("playerPanel").hidden=false;
    playSource(0);
    $("playerPanel").scrollIntoView({behavior:"smooth",block:"start"});
    try{
      var url=new URL(location.href);url.searchParams.set("channel",channel.id||channel.name);
      history.replaceState({}, "",url.pathname+url.search+url.hash);
    }catch(e){}
  }
  function closePlayer(){
    stopVideo();state.current=null;$("playerPanel").hidden=true;
    try{var url=new URL(location.href);url.searchParams.delete("channel");history.replaceState({}, "",url.pathname+url.search+url.hash);}catch(e){}
  }
  function toggleFavourite(key){
    if(favourites.has(key))favourites.delete(key);else favourites.add(key);
    saveFavourites();
    if(state.favOnly)render();else{
      var item=$("channelGrid").querySelector('[data-favourite="'+CSS.escape(key)+'"]');
      if(item){var saved=favourites.has(key);item.classList.toggle("saved",saved);item.textContent=saved?"♥":"♡";item.setAttribute("aria-pressed",String(saved));item.setAttribute("aria-label",saved?"Remove from favourites":"Add to favourites");}
    }
  }
  function loadDirectory(){
    if(state.loading)return;
    state.loading=true;
    $("channelGrid").innerHTML='<div class="loading-card"></div><div class="loading-card"></div><div class="loading-card"></div><div class="loading-card"></div><div class="loading-card"></div><div class="loading-card"></div>';
    $("resultCount").textContent="Loading public channel list…";
    $("channelCount").textContent="…";$("countryCount").textContent="Getting country data";
    var requests=[
      getText(PLAYLIST),
      getJSON(API+"channels.json"),
      getJSON(API+"feeds.json"),
      getJSON(API+"logos.json"),
      getJSON(API+"countries.json"),
      getJSON(API+"languages.json"),
      getJSON(API+"categories.json"),
      getJSON(API+"blocklist.json")
    ];
    Promise.allSettled(requests).then(function(results){
      state.loading=false;
      if(results[0].status!=="fulfilled")throw results[0].reason||new Error("The channel playlist could not be loaded.");
      var data=results.map(function(result){return result.status==="fulfilled"?result.value:[];});
      configureMetadata(data[1],data[2],data[3],data[4],data[5],data[6],data[7]);
      var raw=parsePlaylist(data[0]);
      state.all=buildChannels(raw);
      if(!state.all.length)throw new Error("No usable channels were found in the public playlist.");
      updateFilters();updateCounts();render();
      var requested=new URLSearchParams(location.search).get("channel");
      if(requested){
        var found=state.all.find(function(x){return x.id===requested||x.name.toLowerCase()===requested.toLowerCase();});
        if(found)playChannel(found.key);
      }
    }).catch(function(error){
      state.loading=false;
      $("channelGrid").innerHTML="";
      $("emptyState").hidden=false;
      $("emptyState").querySelector("h3").textContent="The channel guide could not load";
      $("emptyState").querySelector("p").textContent=(error&&error.message)||"Check your internet connection and try again.";
      $("resultCount").textContent="Channel directory unavailable";
    });
  }

  $("channelGrid").addEventListener("click",function(event){
    var favButton=event.target.closest("[data-favourite]");
    if(favButton){event.stopPropagation();toggleFavourite(favButton.getAttribute("data-favourite"));return;}
    var card=event.target.closest("[data-channel]");
    if(card)playChannel(card.getAttribute("data-channel"));
  });
  $("channelGrid").addEventListener("keydown",function(event){
    if((event.key==="Enter"||event.key===" ")&&event.target.matches("[data-channel]")){
      event.preventDefault();playChannel(event.target.getAttribute("data-channel"));
    }
  });
  ["searchInput","countryFilter","languageFilter","categoryFilter","sortFilter"].forEach(function(id){
    $(id).addEventListener(id==="searchInput"?"input":"change",render);
  });
  function resetFilters(){
    $("searchInput").value="";$("countryFilter").value="";$("languageFilter").value="";
    $("categoryFilter").value="";$("sortFilter").value="name";state.favOnly=false;render();
  }
  $("clearFilters").addEventListener("click",resetFilters);
  $("emptyReset").addEventListener("click",resetFilters);
  $("loadMore").addEventListener("click",renderMore);
  $("favouritesToggle").addEventListener("click",function(){state.favOnly=!state.favOnly;render();});
  $("retryButton").addEventListener("click",function(){
    if(!state.current)return;
    if(state.streamIndex<state.current.streams.length-1)playSource(state.streamIndex+1);
    else playSource(state.streamIndex);
  });
  $("closePlayer").addEventListener("click",closePlayer);
  $("fullscreenButton").addEventListener("click",function(){
    var video=$("liveVideo");
    if(video.requestFullscreen)video.requestFullscreen().catch(function(){});
    else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();
  });
  $("shareButton").addEventListener("click",function(){
    if(!state.current)return;
    var url=new URL(location.href);url.searchParams.set("channel",state.current.id||state.current.name);
    var share={title:state.current.name+" — JMB TV",text:"Watch "+state.current.name+" on JMB TV",url:url.href};
    if(navigator.share)navigator.share(share).catch(function(){});
    else if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url.href).then(function(){$("shareButton").textContent="✓ Link copied";}).catch(function(){});
    else window.prompt("Copy this channel link",url.href);
  });
  $("themeToggle").addEventListener("click",function(){
    var next=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";
    document.documentElement.setAttribute("data-theme",next);
    $("themeToggle").textContent=next==="dark"?"☼":"◐";
    try{localStorage.setItem("jmbtv-theme",next);}catch(e){}
  });
  $("year").textContent=new Date().getFullYear();
  var theme="light";try{theme=localStorage.getItem("jmbtv-theme")||"light";}catch(e){}
  document.documentElement.setAttribute("data-theme",theme);$("themeToggle").textContent=theme==="dark"?"☼":"◐";
  document.addEventListener("keydown",function(event){
    if(event.key==="/"&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){
      event.preventDefault();$("searchInput").focus();
    }
    if(event.key==="Escape"&&!$("playerPanel").hidden)closePlayer();
  });
  if("serviceWorker" in navigator)window.addEventListener("load",function(){navigator.serviceWorker.register("./sw.js").catch(function(){});});
  updateCounts();
  loadDirectory();
})();