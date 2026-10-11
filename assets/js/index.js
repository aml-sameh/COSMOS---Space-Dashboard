// ============ الإعدادات ============
const API_KEY = "ta7OJlQT1CYuFvQ7zxwEhBxXzUyfBPB9zhQTZJXe"; // 👈 الـ key بتاعك من api.nasa.gov (لو عايزة تغيريه، غيريه هنا بس)
const $ = (id) => document.getElementById(id); // اختصار: بيجيب عنصر من الصفحة بالـ id

// ============ 1) التنقل بين السكاشن ============
const links = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".app-section");

links.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const name = link.dataset.section;

    // اظهري السكشن اللي اتداس عليه، وخبي الباقي (hidden)
    sections.forEach((s) => s.classList.toggle("hidden", s.dataset.section !== name));

    // لوّني اللينك النشط
    links.forEach((l) => {
      const active = l === link;
      l.classList.toggle("bg-blue-500/10", active);
      l.classList.toggle("text-blue-400", active);
      l.classList.toggle("text-slate-300", !active);
    });

    $("sidebar").classList.remove("sidebar-open"); // اقفلي القايمة في الموبايل
  });
});

// زرار القايمة في الموبايل
$("sidebar-toggle").addEventListener("click", () => {
  $("sidebar").classList.toggle("sidebar-open");
});

// ============ 2) Today in Space ============

// بتحوّل التاريخ لشكل حلو، زي: Oct 11, 2026
function prettyDate(str) {
  return new Date(str + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function loadApod(date) {
  $("apod-loading").classList.remove("hidden"); // اظهري Loading
  $("apod-image").classList.add("hidden");

  // نمسح الكلام التجريبي ونكتب Loading لحد ما البيانات توصل
  $("apod-title").textContent = "Loading...";
  $("apod-explanation").textContent = "Loading description...";
  $("apod-date").textContent = "Astronomy Picture of the Day - Loading...";
  $("apod-date-detail").innerHTML = `<i class="far fa-calendar mr-2"></i>Loading...`;
  $("apod-date-info").textContent = "Loading...";
  $("apod-copyright").textContent = "";

  try {
    let url = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&thumbs=true`;
    if (date) url += `&date=${date}`; // لو اخترنا تاريخ نضيفه

    const res = await fetch(url);
    if (!res.ok) throw new Error("NASA error " + res.status);
    const d = await res.json();

    // لو الميديا فيديو نعرض صورته المصغرة
    $("apod-image").src = d.media_type === "video" ? d.thumbnail_url : d.url;
    $("apod-title").textContent = d.title;
    $("apod-explanation").textContent = d.explanation;
    $("apod-copyright").textContent = d.copyright ? "© " + d.copyright.trim() : "Public Domain";
    $("apod-media-type").textContent = d.media_type === "video" ? "Video" : "Image";
    $("apod-date").textContent = "Astronomy Picture of the Day - " + prettyDate(d.date);
    $("apod-date-detail").innerHTML = `<i class="far fa-calendar mr-2"></i>${d.date}`;
    $("apod-date-info").textContent = d.date;

    // حدّثي الـ date picker والتاريخ المكتوب جنبه
    $("apod-date-input").value = d.date;
    $("apod-date-input").nextElementSibling.textContent = prettyDate(d.date);
  } catch (err) {
    $("apod-title").textContent = "Oops! Something went wrong";
    $("apod-explanation").textContent = "Error: " + err.message;
  } finally {
    $("apod-loading").classList.add("hidden"); // اخفي Loading في كل الأحوال
    $("apod-image").classList.remove("hidden");
  }
}

// الـ date picker يبدأ بتاريخ النهارده، ومينفعش نختار تاريخ في المستقبل
const today = new Date().toISOString().slice(0, 10);
$("apod-date-input").max = today;
$("apod-date-input").value = today;
$("apod-date-input").nextElementSibling.textContent = prettyDate(today);

$("load-date-btn").addEventListener("click", () => loadApod($("apod-date-input").value));
$("today-apod-btn").addEventListener("click", () => loadApod());
// لو غيّرتي التاريخ بس، نحدّث النص اللي جنبه
$("apod-date-input").addEventListener("change", (e) => {
  e.target.nextElementSibling.textContent = prettyDate(e.target.value);
});

// ============ 3) Launches ============
const statusColors = { Go: "#22c55e", TBC: "#eab308", TBD: "#3b82f6" };

// بتحوّل بيانات الرحلة لحاجات جاهزة للعرض
function launchInfo(l) {
  const when = new Date(l.net);
  return {
    name: l.name,
    status: l.status.abbrev,
    color: statusColors[l.status.abbrev] || "#64748b",
    date: when.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }),
    time: when.toISOString().slice(11, 16) + " UTC",
    longDate: when.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }),
    longTime: when.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC",
    isFuture: when > new Date(), // الرحلة لسه جاية؟
    days: Math.ceil((when - new Date()) / 86400000), // الأيام المتبقية
    company: l.launch_service_provider.name,
    rocket: l.rocket.configuration.name,
    place: l.pad.location.name,
    country: l.pad.country.name,
    description: l.mission ? l.mission.description : "",
    image: l.image ? l.image.image_url : "",
  };
}

// الكارت الصغير
function launchCard(l) {
  const i = launchInfo(l);
  return `
    <div class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group">
      <div class="relative h-48 bg-slate-900/50 flex items-center justify-center">
        <i class="fas fa-rocket text-5xl text-slate-700"></i>
        ${i.image ? `<img src="${i.image}" alt="${i.name}" class="absolute inset-0 w-full h-full object-cover" onerror="this.style.display='none'" />` : ""}
        <span class="absolute top-3 right-3 px-3 py-1 text-white rounded-full text-xs font-semibold" style="background:${i.color}">${i.status}</span>
      </div>
      <div class="p-5">
        <h4 class="font-bold text-lg mb-2 line-clamp-2">${i.name}</h4>
        <p class="text-sm text-slate-400 mb-4"><i class="fas fa-building text-xs"></i> ${i.company}</p>
        <div class="space-y-2 text-sm text-slate-300">
          <p><i class="fas fa-calendar text-slate-500 w-4"></i> ${i.date}</p>
          <p><i class="fas fa-clock text-slate-500 w-4"></i> ${i.time}</p>
          <p><i class="fas fa-rocket text-slate-500 w-4"></i> ${i.rocket}</p>
          <p class="line-clamp-1"><i class="fas fa-map-marker-alt text-slate-500 w-4"></i> ${i.place}</p>
        </div>
      </div>
    </div>`;
}

// الكارت الكبير (Featured)
function featuredLaunch(l) {
  const i = launchInfo(l);
  // مربع الأيام المتبقية: بيظهر بس لو الرحلة لسه جاية
  const daysBox = i.isFuture
    ? `<div class="inline-flex items-center gap-3 px-6 py-3 bg-blue-500/20 rounded-xl mb-6">
         <i class="fas fa-clock text-2xl text-blue-400"></i>
         <div><p class="text-2xl font-bold text-blue-400">${i.days}</p><p class="text-xs text-slate-400">Days Until Launch</p></div>
       </div>`
    : "";
  return `
    <div class="relative bg-slate-800/30 border border-slate-700 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all">
      <div class="absolute inset-0 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
        <div class="flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <span class="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold"><i class="fas fa-star"></i> Featured Launch</span>
              <span class="px-4 py-1.5 rounded-full text-sm font-semibold" style="background:${i.color}33; color:${i.color}">${i.status}</span>
            </div>
            <h3 class="text-3xl font-bold mb-3 leading-tight">${i.name}</h3>
            <p class="text-slate-400 mb-6"><i class="fas fa-building"></i> ${i.company} &nbsp; <i class="fas fa-rocket"></i> ${i.rocket}</p>
            ${daysBox}
            <div class="grid xl:grid-cols-2 gap-4 mb-6">
              <div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1"><i class="fas fa-calendar"></i> Launch Date</p><p class="font-semibold">${i.longDate}</p></div>
              <div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1"><i class="fas fa-clock"></i> Launch Time</p><p class="font-semibold">${i.longTime}</p></div>
              <div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1"><i class="fas fa-map-marker-alt"></i> Location</p><p class="font-semibold text-sm">${i.place}</p></div>
              <div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1"><i class="fas fa-globe"></i> Country</p><p class="font-semibold">${i.country}</p></div>
            </div>
            <p class="text-slate-300 leading-relaxed mb-6">${i.description}</p>
          </div>
          <div class="flex flex-col md:flex-row gap-3">
            <button class="flex-1 px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center gap-2">
              <i class="fas fa-info-circle"></i> View Full Details
            </button>
            <div class="flex gap-3">
              <button class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"><i class="far fa-heart"></i></button>
              <button class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"><i class="fas fa-bell"></i></button>
            </div>
          </div>
        </div>
        <div class="relative min-h-[400px] rounded-2xl overflow-hidden bg-slate-900/50 flex items-center justify-center">
          <i class="fas fa-rocket text-9xl text-slate-700/50"></i>
          ${i.image ? `<img src="${i.image}" alt="${i.name}" class="absolute inset-0 w-full h-full object-cover" onerror="this.style.display='none'" />` : ""}
        </div>
      </div>
    </div>`;
}

async function loadLaunches() {
  try {
    const res = await fetch("https://lldev.thespacedevs.com/2.3.0/launches/upcoming/?limit=10");
    if (!res.ok) throw new Error("Launch error " + res.status);
    const data = await res.json();
    const list = data.results;

    $("launches-count").textContent = list.length + " Launches";
    $("launches-count-mobile").textContent = list.length;
    $("featured-launch").innerHTML = featuredLaunch(list[0]); // أول رحلة = Featured
    $("launches-grid").innerHTML = list.slice(1).map(launchCard).join(""); // الباقي كروت
  } catch (err) {
    $("launches-grid").innerHTML = `<p class="text-slate-400">Could not load launches. Please try again later.</p>`;
  }
}

// ============ 4) Planets ============
let planets = []; // هنخزن الكواكب هنا

// بتعرض تفاصيل كوكب واحد
function showPlanet(p) {
  const moons = p.moons ? p.moons.length : 0; // لو null يبقى 0 قمر
  const num = (n) => Number(n).toLocaleString("en-US");

  $("planet-detail-image").src = p.image;
  $("planet-detail-name").textContent = p.englishName;
  $("planet-detail-description").textContent = p.description;
  $("planet-distance").textContent = (p.semimajorAxis / 1e6).toFixed(1) + "M km";
  $("planet-radius").textContent = num(p.meanRadius) + " km";
  $("planet-mass").textContent = `${p.mass.massValue} × 10^${p.mass.massExponent} kg`;
  $("planet-density").textContent = p.density + " g/cm³";
  $("planet-orbital-period").textContent = num(p.sideralOrbit) + " days";
  $("planet-rotation").textContent = num(Math.abs(p.sideralRotation)) + " hours";
  $("planet-moons").textContent = moons;
  $("planet-gravity").textContent = p.gravity + " m/s²";

  $("planet-discoverer").textContent = p.discoveredBy || "Known since antiquity";
  $("planet-discovery-date").textContent = p.discoveryDate || "Ancient";
  $("planet-body-type").textContent = p.bodyType;
  $("planet-volume").textContent = `${p.vol.volValue} × 10^${p.vol.volExponent} km³`;

  $("planet-perihelion").textContent = (p.perihelion / 1e6).toFixed(1) + "M km";
  $("planet-aphelion").textContent = (p.aphelion / 1e6).toFixed(1) + "M km";
  $("planet-eccentricity").textContent = p.eccentricity;
  $("planet-inclination").textContent = p.inclination + "°";
  $("planet-axial-tilt").textContent = p.axialTilt + "°";
  $("planet-temp").textContent = p.avgTemp ? Math.round(p.avgTemp - 273.15) + "°C" : "N/A"; // Kelvin → Celsius
  $("planet-escape").textContent = (p.escape / 1000).toFixed(1) + " km/s";

  // حقايق سريعة من البيانات
  const facts = [
    `A ${p.type} planet`,
    `Has ${moons} known moon${moons === 1 ? "" : "s"}`,
    `A year lasts ${num(p.sideralOrbit)} Earth days`,
    `Surface gravity is ${p.gravity} m/s²`,
  ];
  $("planet-facts").innerHTML = facts
    .map((f) => `<li class="flex items-start"><i class="fas fa-check text-green-400 mt-1 mr-2"></i><span class="text-slate-300">${f}</span></li>`)
    .join("");
}

async function loadPlanets() {
  try {
    const res = await fetch("https://solar-system-opendata-proxy.vercel.app/api/planets");
    if (!res.ok) throw new Error("Planets error " + res.status);
    const data = await res.json();
    planets = data.bodies;

    // لما تدوسي على كارت كوكب، نعرض تفاصيله
    document.querySelectorAll(".planet-card").forEach((card) => {
      card.addEventListener("click", () => {
        const planet = planets.find((p) => p.englishName.toLowerCase() === card.dataset.planetId);
        if (planet) showPlanet(planet);
      });
    });

    showPlanet(planets.find((p) => p.englishName === "Earth")); // الأرض تظهر في الأول
  } catch (err) {
    $("planet-detail-description").textContent = "Could not load planets. Please try again later.";
  }
}

// ============ تشغيل كل حاجة أول ما الصفحة تفتح ============
loadApod();
loadLaunches();
loadPlanets();