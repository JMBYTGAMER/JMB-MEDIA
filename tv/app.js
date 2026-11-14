(function(){
  "use strict";
  var API = "https://iptv-org.github.io/api/";
  var PAGE_SIZE = 60;
  var $ = function(id){ return document.getElementById(id); };
  var state = { all: [], filtered: [], shown: 0, favOnly: false, selected: null, loading: false, lastTrigger: null };
  var favourites = new Set();
  try { favourites = new Set(JSON.parse(localStorage.getItem("jmbtv-favourites") || "[]")); } catch (error) {}
  var countryMap = new Map(), languageMap = new Map(), categoryMap = new Map();

  function escapeHTML(value){
    return String(value == null ? "" : value).replace(/[&<>"']/g, function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch];
    });
  }
  function unique(values){
    return Array.from(new Set((values || []).filter(Boolean))).sort(function(a,b){ return String(a).localeCompare(String(b)); });
  }
  function requestJSON(file){
    var controller = new AbortController();
    var timeout = setTimeout(function(){ controller.abort(); }, 15000);
    return fetch(API + file, {
      method:"GET", mode:"cors", credentials:"omit", cache:"no-cache",
      headers:{"Accept":"application/json"}, signal:controller.signal
    }).then(function(response){
      if(!response.ok) throw new Error(file + " returned HTTP " + response.status);
      return response.json();
    }).finally(function(){ clearTimeout(timeout); });
  }
  function safeWebsite(raw){
    if(!raw) return "";
    try {
      var url = new URL(String(raw).trim());
      if(url.protocol !== "https:") return "";
      if(url.username || url.password) return "";
      var host = url.hostname.toLowerCase();
      if(!host || host === "localhost" || host.endsWith(".local") || host === "127.0.0.1" ||
         host === "0.0.0.0" || host === "169.254.169.254" || /^10\./.test(host) ||
         /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return "";
      url.hash = "";
      return url.href;
    } catch(error) { return ""; }
  }
  function codeName(code){ return languageMap.get(code) || code || ""; }
  function buildDirectory(channels, feeds, countries, languages, categories, blocklist){
    countryMap = new Map((countries || []).map(function(item){ return [String(item.code || "").toUpperCase(), item]; }));
    languageMap = new Map((languages || []).map(function(item){ return [item.code, item.name]; }));
    categoryMap = new Map((categories || []).map(function(item){ return [item.id, item.name]; }));
    var denied = new Set((blocklist || []).map(function(item){ return String(item.channel || "").split("@")[0]; }));
    var feedMap = new Map();
    (feeds || []).forEach(function(feed){
      var id = String(feed.channel || "").split("@")[0];
      if(!id) return;
      var old = feedMap.get(id);
      if(!old || (feed.is_main && !old.is_main)) feedMap.set(id, feed);
    });
    return (channels || []).filter(function(item){
      var id = String(item.id || "");
      var categoriesText = (item.categories || []).join(" ").toLowerCase();
      return id && !denied.has(id) && !item.is_nsfw && !item.closed && !item.replaced_by &&
        !/\b(adult|xxx|porn|pornography|erotic|explicit)\b/.test(categoriesText);
    }).map(function(item){
      var id = String(item.id);
      var feed = feedMap.get(id) || null;
      var countryCode = String(item.country || "").toUpperCase();
      var country = countryMap.get(countryCode);
      var categoryNames = (item.categories || []).map(function(key){
        return categoryMap.get(key) || String(key).replace(/[-_]/g, " ").replace(/\b\w/g, function(c){ return c.toUpperCase(); });
      });
      var langs = feed && Array.isArray(feed.languages) ? feed.languages.map(codeName) : [];
      return {
        key:id, id:id, name:item.name || id,
        altNames:Array.isArray(item.alt_names) ? item.alt_names : [],
        network:item.network || "", owners:Array.isArray(item.owners) ? item.owners : [],
        countryCode:countryCode, countryName:country ? country.name : (countryCode || "Country not listed"),
        flag:country && country.flag ? country.flag : "",
        categories:unique(categoryNames), languages:unique(langs),
        website:safeWebsite(item.website)
      };
    }).sort(function(a,b){ return a.name.localeCompare(b.name); });
  }
  function updateCounts(){
    $("channelCount").textContent = state.all.length.toLocaleString();
    var countries = unique(state.all.map(function(item){ return item.countryCode; }));
    $("countryCount").textContent = countries.length ? countries.length.toLocaleString() + " countries represented" : "Country information not supplied";
    $("favouritesCount").textContent = favourites.size.toLocaleString();
  }
  function fillSelect(element, values, label, formatter){
    var previous = element.value;
    element.innerHTML = "";
    var option = document.createElement("option");
    option.value = ""; option.textContent = label; element.appendChild(option);
    values.forEach(function(value){
      var item = document.createElement("option");
      item.value = value; item.textContent = formatter ? formatter(value) : value; element.appendChild(item);
    });
    if(values.indexOf(previous) >= 0) element.value = previous;
  }
  function updateFilters(){
    fillSelect($("countryFilter"), unique(state.all.map(function(item){ return item.countryCode; })), "Every country", function(code){
      var country = countryMap.get(code);
      return (country && country.flag ? country.flag + " " : "") + ((country && country.name) || code);
    });
    fillSelect($("languageFilter"), unique(state.all.reduce(function(list,item){ return list.concat(item.languages); },[])), "Every language");
    fillSelect($("categoryFilter"), unique(state.all.reduce(function(list,item){ return list.concat(item.categories); },[])), "Every category");
  }
  function initials(name){
    return String(name || "TV").split(/\s+/).filter(Boolean).slice(0,2).map(function(part){ return part.charAt(0); }).join("").toUpperCase() || "TV";
  }
  function cardHTML(channel,index){
    var detail = [channel.countryName, channel.languages[0] || channel.categories[0] || ""].filter(Boolean);
    var saved = favourites.has(channel.key);
    return '<article class="channel-card" style="animation-delay:' + Math.min(index,20)*12 + 'ms">' +
      '<button class="channel-main" data-channel="' + escapeHTML(channel.key) + '" type="button" aria-label="View details for ' + escapeHTML(channel.name) + '">' +
        '<span class="logo-stage"><span class="logo-fallback" aria-hidden="true">' + escapeHTML(initials(channel.name)) + '</span><span class="card-open-label">VIEW DETAILS <b>↗</b></span></span>' +
        '<span class="channel-name" title="' + escapeHTML(channel.name) + '">' + escapeHTML(channel.name) + '</span>' +
        '<span class="channel-meta">' + detail.map(function(value){ return '<span>' + escapeHTML(value) + '</span>'; }).join("") + '</span>' +
      '</button>' +
      '<div class="card-bottom"><span class="format-tag' + (channel.website ? "" : " muted") + '">' + (channel.website ? "WEBSITE LISTED" : "DIRECTORY ENTRY") + '</span>' +
      '<button class="card-favourite' + (saved ? " saved" : "") + '" data-favourite="' + escapeHTML(channel.key) + '" type="button" aria-label="' + (saved ? "Remove from" : "Add to") + ' favourites" aria-pressed="' + saved + '">' + (saved ? "♥" : "♡") + '</button></div>' +
    '</article>';
  }
  function render(){
    var query = $("searchInput").value.trim().toLowerCase();
    var country = $("countryFilter").value, language = $("languageFilter").value;
    var category = $("categoryFilter").value, sort = $("sortFilter").value;
    var biggBossSearch = /\bbigg?\s*boss\b/i.test(query);
    var rows = state.all.filter(function(item){
      var searchFields = [item.name,item.id,item.network,item.owners.join(" "),item.altNames.join(" "),
        item.countryName,item.countryCode,item.categories.join(" "),item.languages.join(" ")].join(" ").toLowerCase();
      var matchesSearch = !query || (biggBossSearch
        ? /asianet/i.test([item.name,item.network,item.owners.join(" ")].join(" "))
        : searchFields.indexOf(query) >= 0);
      return matchesSearch && (!country || item.countryCode === country) &&
        (!language || item.languages.indexOf(language) >= 0) &&
        (!category || item.categories.indexOf(category) >= 0) &&
        (!state.favOnly || favourites.has(item.key));
    });
    rows.sort(function(a,b){
      if(sort === "country") return a.countryName.localeCompare(b.countryName) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
    state.filtered = rows; state.shown = 0; $("channelGrid").innerHTML = "";
    $("emptyState").hidden = rows.length > 0;
    $("emptyState").querySelector("h3").textContent = state.favOnly ? "No favourites saved yet" : "No channels found";
    $("emptyState").querySelector("p").textContent = state.favOnly ? "Tap the heart on a channel card to save it here." : "Try another search or clear the filters.";
    $("resultCount").textContent = rows.length.toLocaleString() + " of " + state.all.length.toLocaleString() + " channels";
    $("favouritesToggle").setAttribute("aria-pressed", String(state.favOnly));
    $("favouritesToggle").querySelector(".heart").textContent = state.favOnly ? "♥" : "♡";
    $("searchHint").hidden = !biggBossSearch;
    renderMore();
  }
  function renderMore(){
    var next = state.filtered.slice(state.shown, state.shown + PAGE_SIZE);
    $("channelGrid").insertAdjacentHTML("beforeend", next.map(cardHTML).join(""));
    state.shown += next.length;
    $("loadMore").hidden = state.shown >= state.filtered.length;
    $("loadMore").textContent = state.shown >= state.filtered.length ? "All channels shown" : "Show more channels ↓";
    $("resultCount").textContent = state.filtered.length.toLocaleString() + " of " +
      state.all.length.toLocaleString() + " channels · showing " + state.shown.toLocaleString();
  }
  function saveFavourites(){
    try { localStorage.setItem("jmbtv-favourites", JSON.stringify(Array.from(favourites))); } catch(error) {}
    updateCounts();
  }
  function openDetails(key, trigger){
    var channel = state.all.find(function(item){ return item.key === key; });
    if(!channel) return;
    state.selected = channel; state.lastTrigger = trigger || document.activeElement;
    $("dialogMark").textContent = initials(channel.name);
    $("dialogTitle").textContent = channel.name;
    $("dialogCountry").textContent = [channel.flag,channel.countryName].filter(Boolean).join(" ");
    $("dialogNetwork").textContent = channel.network || "Not listed";
    $("dialogLanguage").textContent = channel.languages.length ? channel.languages.join(", ") : "Not listed";
    $("dialogCategory").textContent = channel.categories.length ? channel.categories.join(", ") : "Not listed";
    $("dialogOwners").textContent = channel.owners.length ? channel.owners.join(", ") : "Not listed";
    $("dialogId").textContent = channel.id;
    $("channelWebsite").hidden = !channel.website;
    $("dialogWebsiteNote").hidden = Boolean(channel.website);
    if(channel.website){
      $("channelWebsite").href = channel.website;
      $("channelWebsite").textContent = "Open channel website ↗";
    }
    $("channelDialog").showModal();
    $("closeChannelDialog").focus();
    try{
      var url = new URL(location.href);
      url.searchParams.set("channel", channel.id);
      history.replaceState({}, "", url.pathname + url.search + url.hash);
    }catch(error){}
  }
  function cleanChannelURL(){
    try{
      var url = new URL(location.href);
      url.searchParams.delete("channel");
      history.replaceState({}, "", url.pathname + url.search + url.hash);
    }catch(error){}
  }
  function closeDetails(){
    var dialog = $("channelDialog");
    if(dialog.open) dialog.close();
    else dialog.removeAttribute("open");
  }
  $("channelDialog").addEventListener("close", function(){
    state.selected = null;
    cleanChannelURL();
    if(state.lastTrigger && document.contains(state.lastTrigger)) state.lastTrigger.focus();
  });
  $("channelDialog").addEventListener("click", function(event){
    if(event.target === $("channelDialog")) closeDetails();
  });
  $("closeChannelDialog").addEventListener("click", closeDetails);
  $("channelGrid").addEventListener("click", function(event){
    var favouriteButton = event.target.closest("[data-favourite]");
    if(favouriteButton){
      event.stopPropagation();
      var key = favouriteButton.getAttribute("data-favourite");
      if(favourites.has(key)) favourites.delete(key); else favourites.add(key);
      saveFavourites();
      var saved = favourites.has(key);
      favouriteButton.classList.toggle("saved", saved);
      favouriteButton.textContent = saved ? "♥" : "♡";
      favouriteButton.setAttribute("aria-pressed", String(saved));
      favouriteButton.setAttribute("aria-label", saved ? "Remove from favourites" : "Add to favourites");
      if(state.favOnly) render();
      return;
    }
    var openButton = event.target.closest("[data-channel]");
    if(openButton) openDetails(openButton.getAttribute("data-channel"), openButton);
  });
  $("copyChannelId").addEventListener("click", function(){
    if(!state.selected) return;
    var id = state.selected.id;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(id).then(function(){ $("copyChannelId").textContent = "Copied ✓"; })
        .catch(function(){ window.prompt("Copy this channel ID", id); });
    }else window.prompt("Copy this channel ID", id);
  });
  $("shareChannel").addEventListener("click", function(){
    if(!state.selected) return;
    var url = new URL(location.href);
    url.searchParams.set("channel", state.selected.id);
    var payload = {title:state.selected.name + " — JMB TV",text:"Channel information from JMB TV.",url:url.href};
    if(navigator.share) navigator.share(payload).catch(function(){});
    else if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url.href).then(function(){ $("shareChannel").textContent = "Link copied ✓"; })
        .catch(function(){ window.prompt("Copy channel link", url.href); });
    }else window.prompt("Copy channel link", url.href);
  });

  ["searchInput","countryFilter","languageFilter","categoryFilter","sortFilter"].forEach(function(id){
    $(id).addEventListener(id === "searchInput" ? "input" : "change", render);
  });
  function resetFilters(){
    $("searchInput").value = ""; $("countryFilter").value = ""; $("languageFilter").value = "";
    $("categoryFilter").value = ""; $("sortFilter").value = "name"; state.favOnly = false; render();
  }
  $("clearFilters").addEventListener("click", resetFilters);
  $("emptyReset").addEventListener("click", resetFilters);
  $("loadMore").addEventListener("click", renderMore);
  $("favouritesToggle").addEventListener("click", function(){ state.favOnly = !state.favOnly; render(); });
  $("retryDirectory").addEventListener("click", loadDirectory);
  $("searchHintClear").addEventListener("click", function(){
    $("searchInput").value = ""; $("searchHint").hidden = true; render(); $("searchInput").focus();
  });
  $("themeToggle").addEventListener("click", function(){
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    $("themeToggle").textContent = next === "dark" ? "☼" : "◐";
    try { localStorage.setItem("jmb-tv-theme", next); } catch(error) {}
  });
  document.addEventListener("keydown", function(event){
    if(event.key === "/" && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && !$("channelDialog").open){
      event.preventDefault(); $("searchInput").focus();
    }
  });

  function loadDirectory(){
    if(state.loading) return;
    state.loading = true; $("retryDirectory").hidden = true;
    $("channelGrid").innerHTML = '<div class="loading-card"></div><div class="loading-card"></div><div class="loading-card"></div><div class="loading-card"></div>';
    $("resultCount").textContent = "Loading channel information…";
    $("channelCount").textContent = "…"; $("countryCount").textContent = "Updating country information";
    Promise.allSettled([
      requestJSON("channels.json"), requestJSON("feeds.json"), requestJSON("countries.json"),
      requestJSON("languages.json"), requestJSON("categories.json"), requestJSON("blocklist.json")
    ]).then(function(results){
      state.loading = false;
      if(results[0].status !== "fulfilled") throw results[0].reason || new Error("Channel information could not be loaded.");
      var data = results.map(function(result){ return result.status === "fulfilled" ? result.value : []; });
      state.all = buildDirectory(data[0],data[1],data[2],data[3],data[4],data[5]);
      if(!state.all.length) throw new Error("No active channel entries were returned by the directory.");
      updateFilters(); updateCounts();
      $("searchInput").value = new URLSearchParams(location.search).get("q") || "";
      render();
      var requested = new URLSearchParams(location.search).get("channel");
      if(requested){
        var chosen = state.all.find(function(item){ return item.id.toLowerCase() === requested.toLowerCase(); });
        if(chosen) openDetails(chosen.key, null);
      }
    }).catch(function(error){
      state.loading = false; $("channelGrid").innerHTML = ""; $("emptyState").hidden = false;
      $("emptyState").querySelector("h3").textContent = "The channel guide could not load";
      $("emptyState").querySelector("p").textContent = (error && error.name === "AbortError")
        ? "The directory took too long to respond. Check your connection and retry."
        : ((error && error.message) || "Check your connection and retry.");
      $("resultCount").textContent = "Directory temporarily unavailable";
      $("retryDirectory").hidden = false;
    });
  }

  $("year").textContent = String(new Date().getFullYear());
  try{
    var savedTheme = localStorage.getItem("jmb-tv-theme");
    if(savedTheme === "light" || savedTheme === "dark") document.documentElement.setAttribute("data-theme", savedTheme);
  }catch(error){}
  $("themeToggle").textContent = document.documentElement.getAttribute("data-theme") === "light" ? "◐" : "☼";
  if("serviceWorker" in navigator){
    window.addEventListener("load", function(){ navigator.serviceWorker.register("./sw.js").catch(function(){}); });
  }
  updateCounts(); loadDirectory();
})();