/* JMB TV — Malayalam-first channel shelf */
(function(){
  "use strict";
  const root = document.getElementById("keralaFeatured");
  if (!root || root.dataset.ready === "1") return;
  root.dataset.ready = "1";

  const lineup = [
    {id:"asianet",name:"Asianet",mark:"A",kind:"ENTERTAINMENT",desc:"Malayalam serials, reality shows and entertainment.",aliases:["asianet","asianet tv"],url:"https://www.jiohotstar.com/",source:"Official service",note:"May require an account or subscription.",color:"#75ddd0"},
    {id:"kairali",name:"Kairali TV",mark:"K",kind:"ENTERTAINMENT",desc:"Malayalam entertainment from Kairali.",aliases:["kairali tv","kairali"],url:"https://kairalitv.in/",source:"Broadcaster site",note:"Live availability is controlled by the broadcaster.",color:"#ed8ca8"},
    {id:"24news",name:"24 News",mark:"24",kind:"NEWS · LIVE",desc:"Twenty Four Malayalam news and live updates.",aliases:["24 news","twenty four","twentyfour"],url:"https://www.youtube.com/@24onlive/live",source:"YouTube Live",note:"The broadcaster's current live stream opens on YouTube.",color:"#ff8b72"},
    {id:"surya",name:"Surya TV",mark:"S",kind:"ENTERTAINMENT",desc:"Malayalam entertainment from the Sun Network.",aliases:["surya tv","surya"],url:"https://www.sunnxt.com/",source:"Official service",note:"May require an account or subscription.",color:"#f0b25e"},
    {id:"asianet-news",name:"Asianet News",mark:"AN",kind:"NEWS · LIVE",desc:"Malayalam news and breaking coverage.",aliases:["asianet news"],url:"https://www.youtube.com/@asianetnews/live",source:"YouTube Live",note:"Verified broadcaster channel.",color:"#62bde8"},
    {id:"kairali-news",name:"Kairali News",mark:"KN",kind:"NEWS",desc:"News and current affairs from Kairali.",aliases:["kairali news"],url:"https://www.youtube.com/@kairalinews/live",source:"YouTube Live",note:"Open the broadcaster's channel live page.",color:"#d18bf0"},
    {id:"manorama-news",name:"Manorama News",mark:"MN",kind:"NEWS · LIVE",desc:"Kerala, India and world news coverage.",aliases:["manorama news"],url:"https://www.youtube.com/@manoramanews/live",source:"YouTube Live",note:"Verified broadcaster channel.",color:"#f3a46f"},
    {id:"mathrubhumi-news",name:"Mathrubhumi News",mark:"M",kind:"NEWS · LIVE",desc:"Malayalam news and Kerala updates.",aliases:["mathrubhumi news"],url:"https://www.youtube.com/@TVMathrubhumi/live",source:"YouTube Live",note:"Verified broadcaster channel.",color:"#77cba5"},
    {id:"news18-kerala",name:"News18 Kerala",mark:"18",kind:"NEWS",desc:"Malayalam news from News18 Kerala.",aliases:["news18 kerala","news 18 kerala"],url:"https://www.youtube.com/@News18Kerala/live",source:"YouTube Live",note:"Open the broadcaster's channel live page.",color:"#f07883"},
    {id:"reporter",name:"Reporter TV",mark:"R",kind:"NEWS",desc:"REPORTER LIVE Malayalam news.",aliases:["reporter tv","reporter live"],url:"https://www.youtube.com/@reporterlive/live",source:"YouTube Live",note:"Open the broadcaster's channel live page.",color:"#82a6f5"},
    {id:"mediaone",name:"MediaOne",mark:"M1",kind:"NEWS",desc:"MediaOne Malayalam news and analysis.",aliases:["media one","mediaone"],url:"https://www.youtube.com/@MediaoneTVLive/live",source:"YouTube Live",note:"Open the broadcaster's channel live page.",color:"#71c9d0"},
    {id:"janam",name:"Janam TV",mark:"J",kind:"NEWS",desc:"Janam TV live news and current affairs.",aliases:["janam tv","janam"],url:"https://janamtv.com/live/",source:"Broadcaster live page",note:"Live player is hosted by Janam TV.",color:"#df9b67"},
    {id:"jaihind",name:"Jaihind News",mark:"JH",kind:"NEWS · LIVE",desc:"Jaihind's 24/7 Malayalam news stream.",aliases:["jaihind tv","jaihind news","jai hind"],url:"https://jaihindtv.in/live-tv",source:"Broadcaster live page",note:"Live player is hosted by Jaihind.",color:"#7cb6e8"},
    {id:"kaumudy",name:"Kaumudy TV",mark:"K",kind:"NEWS · LIVE",desc:"Kaumudy Malayalam news and current affairs.",aliases:["kaumudy tv","kaumudy"],url:"https://kaumudy.com/",source:"Broadcaster live page",note:"Official site includes a live-streaming section.",color:"#7dc5b2"},
    {id:"dd-malayalam",name:"DD Malayalam",mark:"DD",kind:"PUBLIC SERVICE",desc:"Doordarshan's Malayalam regional channel.",aliases:["dd malayalam","doordarshan malayalam"],url:"https://prasarbharati.gov.in/en/live-tv/",source:"Prasar Bharati",note:"Use the official public broadcaster live-TV page.",color:"#82a5f1"},
    {id:"amrita",name:"Amrita TV",mark:"A",kind:"ENTERTAINMENT",desc:"Malayalam entertainment, news and culture.",aliases:["amrita tv","amrita television"],url:"https://www.youtube.com/@AmritaTelevision/live",source:"YouTube Live",note:"Verified broadcaster channel.",color:"#c49bf2"},
    {id:"flowers",name:"Flowers TV",mark:"F",kind:"ENTERTAINMENT",desc:"Malayalam shows, serials and reality programmes.",aliases:["flowers tv","flowers"],url:"https://www.flowerstv.in/",source:"Broadcaster site",note:"Official site for programmes and updates.",color:"#ef8bb2"},
    {id:"mazhavil",name:"Mazhavil Manorama",mark:"MM",kind:"ENTERTAINMENT",desc:"Malayalam fiction, reality shows and entertainment.",aliases:["mazhavil manorama","mazhavil"],url:"https://www.mazhavilmanorama.com/",source:"Broadcaster site",note:"Official channel website.",color:"#80b6f1"},
    {id:"zee-keralam",name:"Zee Keralam",mark:"Z",kind:"ENTERTAINMENT",desc:"Malayalam entertainment on Zee's live-TV service.",aliases:["zee keralam"],url:"https://www.zee5.com/live-tv/lang/malayalam-channels",source:"ZEE5 Live TV",note:"Channel access may depend on the service plan.",color:"#e4a1ef"},
    {id:"victers",name:"KITE VICTERS",mark:"V",kind:"EDUCATION",desc:"Kerala's educational TV and learning resources.",aliases:["victers","kite victers","victors"],url:"https://victers.kite.kerala.gov.in/",source:"KITE Kerala",note:"Official education portal.",color:"#79c6a5"}
  ];

  const clean = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  let channelList = [];
  let expanded = false;
  let selectedFilter = "all";
  const groupOf = item => item.kind.includes("NEWS") ? "news" : item.kind === "EDUCATION" ? "education" : "entertainment";

  function findListing(item){
    const aliases = item.aliases.map(clean);
    const matches = channelList.filter(ch => {
      const name = clean([ch.name,ch.tvg].join(" "));
      return aliases.some(alias => name === alias || name.startsWith(alias + " hd") || name.startsWith(alias + " sd") || name.startsWith(alias + " live"));
    });
    return matches.find(ch => ch && ch.url && /^https:\/\//i.test(ch.url)) || null;
  }

  function render(){
    const counts = lineup.reduce((result, item) => {
      const group = groupOf(item);
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
    const cards = lineup.map((item,index) => {
      const match = findListing(item);
      const extra = index >= 4 ? " is-extra" : "";
      const group = groupOf(item);
      const status = match
        ? '<span class="kf-state">JMB directory listing</span>'
        : '<span class="kf-state is-source">Official source available</span>';
      const mainAction = match
        ? '<button type="button" class="kf-play" data-kf-play="' + esc(item.id) + '">▶ Play in JMB TV</button>'
        : '<a class="kf-play" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">Open watch page ↗</a>';
      const secondAction = match
        ? '<a class="kf-source" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">Official ↗</a>'
        : '<button type="button" class="kf-find" data-kf-find="' + esc(item.id) + '">Find listing</button>';
      return '<article class="kf-card' + extra + '" data-group="' + group + '" style="--kf-accent:' + esc(item.color) + ';--kf-index:' + index + '">' +
        '<div class="kf-card-top"><span class="kf-mark">' + esc(item.mark) + '</span><span class="kf-meta"><span class="kf-kind">' + esc(item.kind) + '</span>' + status + '</span></div>' +
        '<h3>' + esc(item.name) + '</h3><p>' + esc(item.desc) + '</p>' +
        '<div class="kf-actions">' + mainAction + secondAction + '</div>' +
      '</article>';
    }).join("");

    const filters = [
      ["all","All",lineup.length],
      ["news","News",counts.news || 0],
      ["entertainment","Entertainment",counts.entertainment || 0],
      ["education","Education",counts.education || 0]
    ];
    const filterMarkup = filters.map(([key,label,count]) =>
      '<button type="button" class="kf-filter' + (selectedFilter === key ? ' is-active' : '') + '" data-kf-filter="' + key + '" aria-pressed="' + (selectedFilter === key) + '">' +
      esc(label) + '<span>' + count + '</span></button>'
    ).join("");

    root.innerHTML =
      '<div class="kf-head"><div class="kf-head-copy"><span class="kf-eyebrow">JMB MEDIA · KERALA FIRST</span><h2 class="kf-title">Your Malayalam favourites</h2><p class="kf-subtitle">Asianet, Kairali, 24 News, Surya TV and more — browse your favourites or jump into the full channel directory.</p></div>' +
      '</div>' +
      '<div class="kf-filter-row" role="group" aria-label="Filter featured channels">' + filterMarkup + '</div>' +
      '<div class="kf-grid" data-filter="' + selectedFilter + '">' + cards + '</div>' +
      '<div class="kf-foot"><div class="kf-foot-note"><strong>Want even more?</strong> Search the full public channel directory below.<span class="kf-directory-count" id="kfDirectoryCount">Loading public channel directory…</span></div>' +
      '<div class="kf-foot-actions"><button type="button" class="kf-expand" data-kf-expand>' + (expanded ? 'Show fewer channels ↑' : 'Show all ' + lineup.length + ' channels ↓') + '</button><button type="button" class="kf-browse" data-kf-browse>Browse directory ↓</button></div></div>';
    root.classList.toggle("is-expanded", expanded);
    const toggle = root.querySelector("[data-kf-expand]");
    if (toggle) toggle.textContent = expanded ? "Show fewer channels ↑" : "Show all " + lineup.length + " channels ↓";
    const count = root.querySelector("#kfDirectoryCount");
    if (count) count.textContent = channelList.length
      ? channelList.length.toLocaleString() + " public stream listings loaded"
      : "Featured broadcasters are shown while the public list loads";
  }

  function findById(id){ return lineup.find(item => item.id === id); }
  function setDirectorySearch(item){
    const input = document.getElementById("q");
    if (!input) return;
    input.value = item.name;
    input.dispatchEvent(new Event("input",{bubbles:true}));
    const grid = document.getElementById("grid");
    if (grid) grid.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",block:"start"});
  }

  root.addEventListener("click",function(event){
    const expand = event.target.closest("[data-kf-expand]");
    if (expand) {
      expanded = !expanded;
      root.classList.toggle("is-expanded",expanded);
      expand.textContent = expanded ? "Show fewer channels ↑" : "Show all " + lineup.length + " channels ↓";
      return;
    }
    const filter = event.target.closest("[data-kf-filter]");
    if (filter) {
      selectedFilter = filter.dataset.kfFilter || "all";
      const grid = root.querySelector(".kf-grid");
      if (grid) grid.dataset.filter = selectedFilter;
      root.querySelectorAll("[data-kf-filter]").forEach(button => {
        const active = button === filter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      return;
    }
    if (event.target.closest("[data-kf-browse]")) {
      const input = document.getElementById("q");
      const search = document.querySelector(".tv-search-panel");
      if (search) search.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      if (input) window.setTimeout(() => input.focus({ preventScroll: true }), 250);
      return;
    }
    const play = event.target.closest("[data-kf-play]");
    if (play) {
      const item = findById(play.dataset.kfPlay);
      const match = item && findListing(item);
      if (match && typeof window.openWatch === "function") window.openWatch(match);
      else if (item) window.open(item.url,"_blank","noopener,noreferrer");
      return;
    }
    const find = event.target.closest("[data-kf-find]");
    if (find) {
      const item = findById(find.dataset.kfFind);
      if (item) setDirectorySearch(item);
    }
  });

  window.addEventListener("jmbtv:channelsready",function(event){
    channelList = Array.isArray(event.detail) ? event.detail : [];
    render();
  });
  if (Array.isArray(window.__JMBTV_CHANNELS)) channelList = window.__JMBTV_CHANNELS;
  render();
})();