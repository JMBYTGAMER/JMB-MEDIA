(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };
  var PLAYLIST = "https://iptv-org.github.io/iptv/index.m3u";
  var API = "https://iptv-org.github.io/api/";
  var PAGE_SIZE = 60;
  var state = { all: [], filtered: [], shown: 0, current: null, hls: null, favOnly: false, loading: false };
  var favs = new Set();
  try { favs = new Set(JSON.parse(localStorage.getItem("jmbtv-favourites") || "[]")); } catch(e) {}
  var channelMap = new Map(), feedMap = new Map(), countryMap = new Map(), languageMap = new Map(), categoryMap = new Map(), logoMap = new Map(), blocked = new Set();

  function esc(value){
    return String(value == null ? "" : value).replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch];
    });
  }
  function attr(line,key){
    var match = line.match(new RegExp("(?:^|\\s)" + key + "=\"([^\"]*)\"","i"));
    return match ? match[1].trim() : "";
  }
  function unique(items){
    return Array.from(new Set(items.filter(Boolean))).sort(function(a,b){ return String(a).localeCompare(String(b)); });
  }
  function fetchData(url){
    return fetch(url,{cache:"default",mode:"cors"}).then(function(response){
      if(!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    });
  }
  function fetchText(url){
    return fetch(url,{cache:"default",mode:"cors"}).then(function(response){
      if(!response.ok) throw new Error("HTTP " + response.status);
      return response.text();
    });
  }
  function parseM3U(text){
    var result = [], current = null;
    text.split(/\r?\n/).forEach(function(raw){
      var line = raw.trim();
      if(line.indexOf("#EXTINF:") === 0){
        var comma = line.lastIndexOf(",");
        current = {
          name: comma >= 0 ? line.slice(comma + 1).trim() : (attr(line,"tvg-name") || "Unknown channel"),
          tvgName: attr(line,"tvg-name"),
          tvgId: attr(line,"tvg-id"),
          logo: attr(line,"tvg-logo"),
          countryHint: attr(line,"tvg-country"),
          languageHint: attr(line,"tvg-language"),
          qualityHint: attr(line,"tvg-quality") || attr(line,"quality") || attr(line,"resolution"),
          categories: attr(line,"group-title").split(";").map(function(x){return x.trim();}).filter(Boolean)
        };
      } else if(current && line && line.charAt(0) !== "#"){
        current.url = line;
        if(/^https?:\/\//i.test(line)) result.push(current);
        current = null;
      }
    });
    return result;
  }
  function looksAdult(channel, meta){
    var text = [channel.name,(channel.categories || []).join(" "),meta && (meta.categories || []).join(" ")].join(" ").toLowerCase();
    return !!(meta && meta.is_nsfw) || /\b(adult|xxx|porn|pornography|erotic|sex\s*tv|explicit)\b/i.test(text);
  }
  function resolveMetadata(items, channels, feeds, logos, countries, languages, categories, blocklist){
    channelMap = new Map((channels || []).map(function(x){ return [x.id,x]; }));
    countryMap = new Map((countries || []).map(function(x){ return [x.code,x]; }));
    languageMap = new Map((languages || []).map(function(x){ return [x.code,x.name]; }));
    categoryMap = new Map((categories || []).map(function(x){ return [x.id,x.name]; }));
    blocked = new Set((blocklist || []).map(function(x){ return x.channel; }).filter(Boolean));
    feedMap = new Map();
    (feeds || []).forEach(function(feed){
      if(!feed.channel) return;
      var previous = feedMap.get(feed.channel);
      if(!previous || feed.is_main) feedMap.set(feed.channel,feed);
    });
    logoMap = new Map();
    (logos || []).forEach(function(item){
      if(!item.channel || !item.url || !/^https:\/\//i.test(item.url)) return;
      var previous = logoMap.get(item.channel);
      if(!previous || item.in_use) logoMap.set(item.channel,item);
    });

    var seen = new Set(), result = [];
    items.forEach(function(item){
      var meta = channelMap.get(item.tvgId) || null;
      if(blocked.has(item.tvgId) || (meta && (meta.is_nsfw || meta.closed || meta.replaced_by)) || looksAdult(item,meta)) return;
      var key = (item.tvgId || item.name) + "|" + item.url;
      if(seen.has(key)) return;
      seen.add(key);
      var feed = feedMap.get(item.tvgId) || null;
      var countryCode = (meta && meta.country) || item.countryHint || "";
      var country = countryMap.get(countryCode);
      var cats = (meta && meta.categories && meta.categories.length ? meta.categories : item.categories).map(function(id){
        return categoryMap.get(id) || id.replace(/[-_]/g," ").replace(/\b\w/g,function(ch){return ch.toUpperCase();});
      });
      if(!cats.length) cats = ["Uncategorized"];
      var langs = (feed && feed.languages || []).map(function(code){ return languageMap.get(code) || code; });
      if(!langs.length && item.languageHint) langs = item.languageHint.split(/[;,]/).map(function(x){return x.trim();}).filter(Boolean);
      var logoItem = logoMap.get(item.tvgId);
      var logo = logoItem && logoItem.url || item.logo;
      if(!/^https:\/\//i.test(logo || "")) logo = "";
      var quality = item.qualityHint || (feed && feed.format) || "";
      if(!quality){
        var match = (item.name + " " + item.url).match(/\b(4k|2160p|1080p|1080i|720p|576p|480p|uhd|fhd|hd|sd)\b/i);
        if(match) quality = match[1].toUpperCase();
      }
      var code = countryCode || "";
      result.push({
        key:key, name:(meta && meta.name) || item.name || item.tvgName || "Unknown channel",
        url:item.url, tvgId:item.tvgId, logo:logo, countryCode:code,
        countryName:country && country.name || code || "Country not listed",
        flag:country && country.flag || "", categories:cats, categoryIds:(meta && meta.categories) || [],
        languages:unique(langs), quality:quality, feedName:feed && feed.name || ""
      });
    });
    return result;
  }
  function fillSelect(select, values, firstLabel, mapFn){
    var prior = select.value;
    select.innerHTML = "";
    var first = document.createElement("option");
    first.value = ""; first.textContent = firstLabel; select.appendChild(first);
    values.forEach(function(value){
      var option = document.createElement("option");
      option.value = value;
      option.textContent = mapFn ? mapFn(value) : value;
      select.appendChild(option);
    });
    if(values.indexOf(prior) >= 0) select.value = prior;
  }
  function updateFilters(){
    var countries = unique(state.all.map(function(c){return c.countryCode;}));
    var cats = unique(state.all.reduce(function(a,c){return a.concat(c.categories);},[]));
    var langs = unique(state.all.reduce(function(a,c){return a.concat(c.languages);},[]));
    fillSelect($("countryFilter"),countries,"All countries",function(code){
      var c = countryMap.get(code); return (c && c.flag ? c.flag + " " : "") + ((c && c.name) || code);
    });
    fillSelect($("categoryFilter"),cats,"All categories");
    fillSelect($("languageFilter"),langs,"All languages");
  }
  function updateStats(){
    $("channelCount").textContent = state.all.length.toLocaleString();
    $("countryCount").textContent = unique(state.all.map(function(c){return c.countryCode;})).length.toLocaleString();
    $("categoryCount").textContent = unique(state.all.reduce(function(a,c){return a.concat(c.categories);},[])).length.toLocaleString();
  }
  function metaLine(c){
    var parts = [];
    if(c.countryName) parts.push((c.flag ? c.flag + " " : "") + c.countryName);
    if(c.languages.length) parts.push(c.languages.slice(0,2).join(", "));
    if(c.categories.length) parts.push(c.categories[0]);
    return parts.slice(0,3);
  }
  function card(c,index){
    var initials = c.name.trim().split(/\s+/).slice(0,2).map(function(w){return w.charAt(0);}).join("").toUpperCase();
    var meta = metaLine(c);
    var quality = c.quality || "Quality N/A";
    return '<article class="channel-card" data-key="' + esc(c.key) + '" tabindex="0" role="button" aria-label="Play ' + esc(c.name) + '" style="animation-delay:' + (Math.min(index,18)*24) + 'ms">' +
      '<div class="logo-stage">' +
        '<span class="logo-fallback">' + esc(initials || "TV") + '</span>' +
        (c.logo ? '<img class="channel-logo" src="' + esc(c.logo) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer" alt="' + esc(c.name) + ' logo">' : '') +
        '<span class="live-pill"><i></i> LIVE</span>' +
        '<span class="quality-pill">' + esc(quality) + '</span>' +
        '<button class="fav-btn' + (favs.has(c.key) ? ' active' : '') + '" type="button" data-fav="' + esc(c.key) + '" aria-label="' + (favs.has(c.key) ? 'Remove from' : 'Add to') + ' favourites" title="Favourite">' + (favs.has(c.key) ? "♥" : "♡") + '</button>' +
      '</div>' +
      '<div class="channel-name-row"><h3 class="channel-name">' + esc(c.name) + '</h3><span class="channel-flag">' + esc(c.flag || "") + '</span></div>' +
      '<div class="channel-details">' + meta.map(function(m){return '<span>' + esc(m) + '</span>';}).join("") + '</div>' +
    '</article>';
  }
  function render(){
    var query = $("searchInput").value.trim().toLowerCase();
    var country = $("countryFilter").value, category = $("categoryFilter").value, language = $("languageFilter").value;
    state.filtered = state.all.filter(function(c){
      var text = [c.name,c.countryName,c.countryCode,c.categories.join(" "),c.languages.join(" ")].join(" ").toLowerCase();
      return (!query || text.indexOf(query) >= 0) &&
        (!country || c.countryCode === country) &&
        (!category || c.categories.indexOf(category) >= 0) &&
        (!language || c.languages.indexOf(language) >= 0) &&
        (!state.favOnly || favs.has(c.key));
    });
    state.shown = 0;
    $("channelGrid").innerHTML = "";
    $("emptyState").hidden = state.filtered.length !== 0;
    $("loadMoreBtn").hidden = state.filtered.length === 0 || state.filtered.length <= PAGE_SIZE;
    $("resultsText").textContent = state.filtered.length.toLocaleString() + " channels";
    $("sourceText").textContent = "Public worldwide catalogue · live player";
    renderMore();
    $("favouritesBtn").classList.toggle("selected",state.favOnly);
    $("favouritesBtn").innerHTML = (state.favOnly ? "♥ " : "♡ ") + "<span>My favourites</span>";
  }
  function renderMore(){
    var next = state.filtered.slice(state.shown,state.shown + PAGE_SIZE);
    $("channelGrid").insertAdjacentHTML("beforeend",next.map(card).join(""));
    state.shown += next.length;
    $("loadMoreBtn").hidden = state.shown >= state.filtered.length;
    $("resultsText").textContent = state.filtered.length.toLocaleString() + " channels" + (state.filtered.length !== state.all.length ? " matching filters" : " available in this catalogue");
    $("channelGrid").querySelectorAll("img.channel-logo").forEach(function(img){
      img.addEventListener("error",function(){img.remove();},{once:true});
    });
  }
  function saveFavourites(){
    try{localStorage.setItem("jmbtv-favourites",JSON.stringify(Array.from(favs)));}catch(e){}
  }
  function showError(message){
    $("videoLoading").hidden = true;
    $("videoError").hidden = false;
    $("videoErrorText").textContent = message || "This stream may be offline, blocked by its provider or unsupported by this browser.";
  }
  function stopPlayback(){
    clearTimeout(state.playerTimer);
    if(state.hls){state.hls.destroy();state.hls=null;}
    var video = $("liveVideo");
    video.pause();
    video.removeAttribute("src");
    video.load();
    $("videoLoading").hidden = true;
  }
  function streamURL(raw){
    try{
      var u = new URL(raw);
      if(u.protocol === "http:" && location.protocol === "https:") u.protocol = "https:";
      return u.href;
    }catch(e){return raw;}
  }
  function startPlayback(channel){
    stopPlayback();
    $("videoError").hidden = true;
    $("videoLoading").hidden = false;
    $("playerTitle").textContent = channel.name;
    $("playerMeta").textContent = metaLine(channel).join(" · ") + (channel.quality ? " · " + channel.quality : " · Quality not listed");
    $("playerOverlay").hidden = false;
    document.body.style.overflow = "hidden";
    document.title = channel.name + " — JMB TV";
    state.current = channel;
    var video = $("liveVideo");
    var source = streamURL(channel.url);
    state.playerTimer = setTimeout(function(){
      if(state.current === channel && video.readyState < 2) showError("The channel did not start in time. It may be offline, region-limited or reject browser playback. No proxy is used.");
    },18000);
    video.onplaying = function(){
      clearTimeout(state.playerTimer);
      $("videoLoading").hidden = true;
      $("videoError").hidden = true;
    };
    video.onerror = function(){
      if(state.current === channel) showError("The channel's stream could not be played here. It may be offline, restricted by region or missing browser CORS support.");
    };
    var useHls = /\.m3u8?(?:$|[?#])/i.test(source) || /\.m3u8/i.test(source);
    if(useHls && window.Hls && Hls.isSupported()){
      var hls = new Hls({enableWorker:true,lowLatencyMode:true,maxBufferLength:30,backBufferLength:30});
      state.hls = hls;
      hls.on(Hls.Events.ERROR,function(event,data){
        if(data && data.fatal && state.current === channel){
          showError("This stream refused playback. The source may be offline, region-limited or may not allow direct browser connections.");
        }
      });
      hls.on(Hls.Events.MANIFEST_PARSED,function(){video.play().catch(function(){$("videoLoading").hidden = true;});});
      hls.loadSource(source);
      hls.attachMedia(video);
    }else{
      video.src = source;
      video.play().catch(function(){
        $("videoLoading").hidden = true;
        if(video.error) showError("Your browser could not start this channel. Try another channel or browser.");
      });
    }
  }
  function closePlayer(){
    stopPlayback();
    state.current = null;
    $("playerOverlay").hidden = true;
    document.body.style.overflow = "";
    document.title = "JMB TV — Watch Worldwide Live Channels";
  }
  function playByKey(key){
    var channel = state.all.find(function(c){return c.key === key;});
    if(channel) startPlayback(channel);
  }
  function retry(){
    if(state.current) startPlayback(state.current);
  }
  function showStatus(text){
    $("resultsText").textContent = text;
    $("sourceText").textContent = "Loading source data…";
  }
  function loadDirectory(){
    if(state.loading) return;
    state.loading = true;
    $("channelGrid").innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
    showStatus("Loading the worldwide channel catalogue…");
    var urls = [
      PLAYLIST,
      API + "channels.json",
      API + "feeds.json",
      API + "logos.json",
      API + "countries.json",
      API + "languages.json",
      API + "categories.json",
      API + "blocklist.json"
    ];
    Promise.allSettled([fetchText(urls[0]),fetchData(urls[1]),fetchData(urls[2]),fetchData(urls[3]),fetchData(urls[4]),fetchData(urls[5]),fetchData(urls[6]),fetchData(urls[7])]).then(function(results){
      state.loading = false;
      if(results[0].status !== "fulfilled") throw results[0].reason || new Error("Playlist could not be loaded");
      var vals = results.map(function(r){return r.status === "fulfilled" ? r.value : [];});
      var parsed = parseM3U(vals[0]);
      state.all = resolveMetadata(parsed,vals[1],vals[2],vals[3],vals[4],vals[5],vals[6],vals[7]);
      if(!state.all.length) throw new Error("The public channel source returned no playable entries.");
      updateFilters();
      updateStats();
      $("channelGrid").innerHTML = "";
      render();
    }).catch(function(error){
      state.loading = false;
      $("channelGrid").innerHTML = "";
      $("emptyState").hidden = false;
      $("emptyState").innerHTML = '<span>!</span><h3>Could not load channels</h3><p>' + esc(error && error.message || "Please check your connection and try again.") + '</p><button class="soft-btn" id="emptyRetryBtn" type="button">Try again</button>';
      $("resultsText").textContent = "Channel catalogue unavailable";
      $("sourceText").textContent = "Connection error";
      var retryButton = $("emptyRetryBtn");
      if(retryButton) retryButton.addEventListener("click",loadDirectory);
    });
  }

  $("channelGrid").addEventListener("click",function(event){
    var favouriteButton = event.target.closest("[data-fav]");
    if(favouriteButton){
      event.stopPropagation();
      var key = favouriteButton.getAttribute("data-fav");
      if(favs.has(key)) favs.delete(key); else favs.add(key);
      saveFavourites();
      favouriteButton.classList.toggle("active",favs.has(key));
      favouriteButton.textContent = favs.has(key) ? "♥" : "♡";
      favouriteButton.setAttribute("aria-label",(favs.has(key) ? "Remove from" : "Add to") + " favourites");
      if(state.favOnly) render();
      return;
    }
    var cardElement = event.target.closest(".channel-card");
    if(cardElement) playByKey(cardElement.getAttribute("data-key"));
  });
  $("channelGrid").addEventListener("keydown",function(event){
    if((event.key === "Enter" || event.key === " ") && event.target.classList.contains("channel-card")){
      event.preventDefault(); playByKey(event.target.getAttribute("data-key"));
    }
  });
  ["searchInput","countryFilter","categoryFilter","languageFilter"].forEach(function(id){
    $(id).addEventListener(id === "searchInput" ? "input" : "change",render);
  });
  $("clearBtn").addEventListener("click",function(){
    $("searchInput").value = ""; $("countryFilter").value = ""; $("categoryFilter").value = ""; $("languageFilter").value = "";
    state.favOnly = false; render();
  });
  $("emptyClearBtn").addEventListener("click",function(){$("clearBtn").click();});
  $("loadMoreBtn").addEventListener("click",renderMore);
  $("refreshBtn").addEventListener("click",function(){
    $("countryFilter").value = ""; $("categoryFilter").value = ""; $("languageFilter").value = "";
    loadDirectory();
  });
  $("surpriseBtn").addEventListener("click",function(){
    var pool = state.filtered.length ? state.filtered : state.all;
    if(pool.length) startPlayback(pool[Math.floor(Math.random()*pool.length)]);
  });
  $("favouritesBtn").addEventListener("click",function(){state.favOnly = !state.favOnly;render();});
  $("closePlayer").addEventListener("click",closePlayer);
  $("retryBtn").addEventListener("click",retry);
  $("fullscreenBtn").addEventListener("click",function(){
    var frame = $("videoFrame");
    if(frame.requestFullscreen) frame.requestFullscreen().catch(function(){});
    else if($("liveVideo").webkitEnterFullscreen) $("liveVideo").webkitEnterFullscreen();
  });
  $("playerOverlay").addEventListener("click",function(event){if(event.target === $("playerOverlay")) closePlayer();});
  $("themeToggle").addEventListener("click",function(){
    var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme",next);
    try{localStorage.setItem("jmbtv-theme",next);}catch(e){}
    $("themeToggle").textContent = next === "light" ? "☾" : "☼";
  });
  $("year").textContent = new Date().getFullYear();
  var savedTheme = "dark";
  try{savedTheme = localStorage.getItem("jmbtv-theme") || "dark";}catch(e){}
  document.documentElement.setAttribute("data-theme",savedTheme);
  $("themeToggle").textContent = savedTheme === "light" ? "☾" : "☼";
  document.addEventListener("keydown",function(event){
    if(event.key === "Escape" && !$("playerOverlay").hidden) closePlayer();
    if(event.key === "/" && $("playerOverlay").hidden && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){
      event.preventDefault(); $("searchInput").focus();
    }
  });
  if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("./sw.js").catch(function(){});});}
  loadDirectory();
})();