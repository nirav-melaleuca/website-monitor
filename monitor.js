const grid = document.getElementById("statusGrid");
const alertSound = document.getElementById("alertSound");

let sites = JSON.parse(localStorage.getItem("monitoredSites")) || [
  { name: "United States", url: "https://www.melaleuca.com" },
  { name: "Canada", url: "https://ca.melaleuca.com" },
  { name: "Mexico", url: "https://mx.melaleuca.com" },
  { name: "Australia", url: "https://au.melaleuca.com" },
  { name: "New Zealand", url: "https://nz.melaleuca.com" },
  { name: "Korea", url: "https://kr.melaleuca.com" },
  { name: "Japan", url: "https://jp.melaleuca.com" },
  { name: "Philippines", url: "https://ph.melaleuca.com" },
  { name: "Hong Kong", url: "https://hk.melaleuca.com" },
  { name: "Singapore", url: "https://sg.melaleuca.com" },
  { name: "Malaysia", url: "https://malaysia.melaleuca.com" },
  { name: "Taiwan", url: "https://tw.melaleuca.com" },
  { name: "United Kingdom", url: "https://uk.melaleuca.com" },
  { name: "Poland", url: "https://pl.melaleuca.com" },
  { name: "Germany", url: "https://de.melaleuca.com" },
  { name: "Ireland", url: "https://ie.melaleuca.com" },
  { name: "Italy", url: "https://it.melaleuca.com" },
  { name: "Lithuania", url: "https://lt.melaleuca.com" },
  { name: "Netherlands", url: "https://nl.melaleuca.com" }
];

let siteData = JSON.parse(localStorage.getItem("siteStatus")) || {};

function saveSites() {
  localStorage.setItem("monitoredSites", JSON.stringify(sites));
}

function saveStatus() {
  localStorage.setItem("siteStatus", JSON.stringify(siteData));
}

function addSite() {
  const name = document.getElementById("siteName").value.trim();
  const url = document.getElementById("siteUrl").value.trim();

  if (!name || !url) return alert("Please enter both a name and a URL.");
  if (!url.startsWith("http")) return alert("URL must start with http:// or https://");
  if (sites.some(s => s.url === url)) return alert("Site already exists.");

  sites.push({ name, url });
  saveSites();
  refreshAll();
  document.getElementById("siteName").value = "";
  document.getElementById("siteUrl").value = "";
}

function removeSite(url) {
  const site = sites.find(s => s.url === url);
  if (confirm(`Remove ${site.name}?`)) {
    sites = sites.filter(s => s.url !== url);
    delete siteData[url];
    saveSites();
    saveStatus();
    refreshAll();
  }
}

function toggleEditMode(card, site) {
  card.innerHTML = `
    <div class="edit-fields">
      <input type="text" id="editName" value="${site.name}" placeholder="Site name" />
      <input type="url" id="editUrl" value="${site.url}" placeholder="Site URL" />
    </div>
    <div class="edit-controls">
      <button class="save-btn"><span class="material-icons">save</span> Save</button>
      <button class="cancel-btn"><span class="material-icons">cancel</span> Cancel</button>
    </div>
  `;

  const saveBtn = card.querySelector(".save-btn");
  const cancelBtn = card.querySelector(".cancel-btn");

  saveBtn.onclick = () => {
    const newName = card.querySelector("#editName").value.trim();
    const newUrl = card.querySelector("#editUrl").value.trim();
    if (!newName || !newUrl) return alert("Please fill both fields.");
    if (!newUrl.startsWith("http")) return alert("URL must start with http:// or https://");
    if (sites.some(s => s.url === newUrl && s.url !== site.url)) return alert("That URL already exists.");

    site.name = newName;
    site.url = newUrl;
    saveSites();
    refreshAll();
  };

  cancelBtn.onclick = refreshAll;
}

function createCard(site, savedData) {
  const { name, url } = site;
  const card = document.createElement("div");
  card.className = "card";
  const lastStatus = savedData?.status || "Loading...";
  const lastChecked = savedData?.checkedAt ? `Last checked: ${savedData.checkedAt}` : "";
  const icon = lastStatus === "UP" ? "check_circle"
             : lastStatus === "DOWN" ? "cancel"
             : "hourglass_empty";

  card.innerHTML = `
    <button class="action-btn edit-btn" title="Edit site">
      <span class="material-icons">edit</span>
    </button>
    <button class="action-btn remove-btn" title="Remove site">
      <span class="material-icons">delete_outline</span>
    </button>
    <div class="site-name">${name}</div>
    <div class="url">${url}</div>
    <div class="status ${lastStatus === "UP" ? "up" : lastStatus === "DOWN" ? "down" : "loading"}">
      <span class="material-icons">${icon}</span> 
      ${lastStatus === "UP" ? "UP" : lastStatus === "DOWN" ? "DOWN" : "Checking..."}
    </div>
    <div class="timestamp">${lastChecked}</div>
  `;

  card.querySelector(".remove-btn").onclick = () => removeSite(url);
  card.querySelector(".edit-btn").onclick = () => toggleEditMode(card, site);

  grid.appendChild(card);
  return card;
}

async function checkSite(site, card) {
  const url = site.url;
  const statusEl = card.querySelector(".status");
  const iconEl = statusEl.querySelector(".material-icons");
  const timestamp = card.querySelector(".timestamp");

  statusEl.className = "status loading";
  iconEl.textContent = "hourglass_empty";
  statusEl.lastChild.textContent = " Checking...";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    await fetch(url, { method: "HEAD", mode: "no-cors", signal: controller.signal });
    clearTimeout(timeout);

    const now = new Date().toLocaleTimeString();
    iconEl.textContent = "check_circle";
    statusEl.className = "status up";
    statusEl.lastChild.textContent = " UP";
    timestamp.textContent = `Last checked: ${now}`;

    siteData[url] = { status: "UP", checkedAt: now };
    saveStatus();
  } catch {
    const now = new Date().toLocaleTimeString();
    iconEl.textContent = "cancel";
    statusEl.className = "status down";
    statusEl.lastChild.textContent = " DOWN";
    timestamp.textContent = `Last checked: ${now}`;

    if (siteData[url]?.status !== "DOWN") alertSound.play();

    siteData[url] = { status: "DOWN", checkedAt: now };
    saveStatus();
  }
}

async function refreshAll() {
  grid.innerHTML = "";
  for (const site of sites) {
    const saved = siteData[site.url];
    const card = createCard(site, saved);
    checkSite(site, card);
  }
}

// Initialize
refreshAll();
setInterval(refreshAll, 60000);