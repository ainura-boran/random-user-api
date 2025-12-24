const btn = document.getElementById("btn");
const statusEl = document.getElementById("status");
const userCard = document.getElementById("userCard");
const countryCard = document.getElementById("countryCard");
const exchangeCard = document.getElementById("exchangeCard");
const newsCard = document.getElementById("newsCard");

function setStatus(text) {
  statusEl.textContent = text || "";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderUser(u) {
  userCard.innerHTML = `
    <h2>User</h2>
    <div class="row">
      <img class="avatar" src="${escapeHtml(u.picture)}" alt="profile" />
      <div class="info">
        <div><span class="label">First name:</span> ${escapeHtml(u.firstName)}</div>
        <div><span class="label">Last name:</span> ${escapeHtml(u.lastName)}</div>
        <div><span class="label">Gender:</span> ${escapeHtml(u.gender)}</div>
        <div><span class="label">Age:</span> ${escapeHtml(u.age)}</div>
        <div><span class="label">Date of birth:</span> ${escapeHtml(u.dateOfBirth)}</div>
        <div><span class="label">City:</span> ${escapeHtml(u.city)}</div>
        <div><span class="label">Country:</span> ${escapeHtml(u.country)}</div>
        <div><span class="label">Full address:</span> ${escapeHtml(u.fullAddress)}</div>
      </div>
    </div>
  `;
}

function renderCountry(c) {
  const languages = Array.isArray(c.languages) && c.languages.length ? c.languages.join(", ") : "N/A";
  const flagImg = c.flagUrl ? `<img class="flag" src="${escapeHtml(c.flagUrl)}" alt="flag" />` : "";

  countryCard.innerHTML = `
    <h2>Country Info</h2>
    ${flagImg}
    <div><span class="label">Country name:</span> ${escapeHtml(c.countryName)}</div>
    <div><span class="label">Capital:</span> ${escapeHtml(c.capital)}</div>
    <div><span class="label">Languages:</span> ${escapeHtml(languages)}</div>
    <div><span class="label">Currency:</span> ${escapeHtml(c.currencyCode)}</div>
  `;
}

function renderExchange(ex) {
  const usd = ex.usd === "N/A" ? "N/A" : Number(ex.usd).toFixed(4);
  const kzt = ex.kzt === "N/A" ? "N/A" : Number(ex.kzt).toFixed(4);

  exchangeCard.innerHTML = `
    <h2>Exchange Rate</h2>
    <div class="muted">Comparison vs USD and KZT</div>
    <div class="rate">
      <div><span class="label">Base:</span> 1 ${escapeHtml(ex.base)}</div>
      <div><span class="label">USD:</span> ${escapeHtml(usd)}</div>
      <div><span class="label">KZT:</span> ${escapeHtml(kzt)}</div>
    </div>
    ${ex.note ? `<p class="warn">${escapeHtml(ex.note)}</p>` : ""}
  `;
}

function renderNews(n) {
  const arr = Array.isArray(n.articles) ? n.articles : [];

  if (!arr.length) {
    newsCard.innerHTML = `
      <h2>News</h2>
      <p class="muted">No articles found (or API key missing).</p>
      ${n.note ? `<p class="warn">${escapeHtml(n.note)}</p>` : ""}
    `;
    return;
  }

  const cards = arr
    .map((a) => {
      const img = a.image ? `<img class="newsimg" src="${escapeHtml(a.image)}" alt="news" />` : "";
      const link = a.url ? `<a class="link" href="${escapeHtml(a.url)}" target="_blank" rel="noreferrer">Open source</a>` : "";
      return `
        <div class="newsItem">
          ${img}
          <div class="newsText">
            <div class="newsTitle">${escapeHtml(a.title)}</div>
            <div class="newsDesc">${escapeHtml(a.description)}</div>
            ${link}
          </div>
        </div>
      `;
    })
    .join("");

  newsCard.innerHTML = `
    <h2>News (Top 5)</h2>
    ${cards}
  `;
}

async function loadProfile() {
  setStatus("Loading...");
  btn.disabled = true;

  userCard.innerHTML = "";
  countryCard.innerHTML = "";
  exchangeCard.innerHTML = "";
  newsCard.innerHTML = "";

  try {
    const res = await fetch("/api/profile");
    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.error || "Server error");
    }

    renderUser(data.user);
    renderCountry(data.country);
    renderExchange(data.exchange);
    renderNews(data.news);

    setStatus("Done ✅");
  } catch (e) {
    setStatus("Error: " + (e.message || "Unknown error"));
  } finally {
    btn.disabled = false;
  }
}

btn.addEventListener("click", loadProfile);