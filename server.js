const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

function safe(obj, pathArr, fallback = "N/A") {
  try {
    let cur = obj;
    for (const k of pathArr) cur = cur?.[k];
    if (cur === undefined || cur === null || cur === "") return fallback;
    return cur;
  } catch {
    return fallback;
  }
}

function pickFirstCurrency(restCountry) {
  const currenciesObj = restCountry?.currencies;
  if (!currenciesObj || typeof currenciesObj !== "object") return null;
  const codes = Object.keys(currenciesObj);
  return codes.length ? codes[0] : null;
}

function pickLanguages(restCountry) {
  const langs = restCountry?.languages;
  if (!langs || typeof langs !== "object") return [];
  return Object.values(langs).filter(Boolean);
}

function normalizeUser(u) {
  const streetName = safe(u, ["location", "street", "name"], "N/A");
  const streetNumber = safe(u, ["location", "street", "number"], "N/A");

  return {
    firstName: safe(u, ["name", "first"]),
    lastName: safe(u, ["name", "last"]),
    gender: safe(u, ["gender"]),
    picture: safe(u, ["picture", "large"]),
    age: safe(u, ["dob", "age"]),
    dateOfBirth: safe(u, ["dob", "date"]).slice(0, 10),
    city: safe(u, ["location", "city"]),
    country: safe(u, ["location", "country"]),
    fullAddress: `${streetName} ${streetNumber}`.trim()
  };
}

async function fetchRandomUser() {
  const url = "https://randomuser.me/api/";
  const resp = await axios.get(url, { params: { results: 1 }, timeout: 12000 });
  const u = resp.data?.results?.[0];
  if (!u) throw new Error("RandomUser: empty response");
  return normalizeUser(u);
}

async function fetchCountryInfo(countryName) {
  const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`;
  const _apiKey = process.env.RESTCOUNTRIES_API_KEY;

  const resp = await axios.get(url, { timeout: 12000 });

  const c = Array.isArray(resp.data) ? resp.data[0] : null;
  if (!c) throw new Error("REST Countries: empty response");

  const currencyCode = pickFirstCurrency(c);

  return {
    countryName: safe(c, ["name", "common"], countryName),
    capital: Array.isArray(c?.capital) ? (c.capital[0] || "N/A") : "N/A",
    languages: pickLanguages(c),
    currencyCode: currencyCode || "N/A",
    flagUrl: safe(c, ["flags", "png"], safe(c, ["flags", "svg"], ""))
  };
}

async function fetchExchangeRates(baseCurrency) {
  const key = process.env.EXCHANGE_RATE_API_KEY;
  if (!key || key.includes("PASTE_")) {
    return {
      base: baseCurrency,
      usd: "N/A",
      kzt: "N/A",
      note: "Exchange Rate API key is missing"
    };
  }

  const url = `https://v6.exchangerate-api.com/v6/${encodeURIComponent(key)}/latest/${encodeURIComponent(
    baseCurrency
  )}`;

  const resp = await axios.get(url, { timeout: 12000 });
  const rates = resp.data?.conversion_rates;
  if (!rates) throw new Error("ExchangeRate: missing conversion_rates");

  const usd = rates["USD"];
  const kzt = rates["KZT"];

  return {
    base: baseCurrency,
    usd: typeof usd === "number" ? usd : "N/A",
    kzt: typeof kzt === "number" ? kzt : "N/A"
  };
}

async function fetchNews(countryName) {
  const key = process.env.NEWS_API_KEY;
  if (!key || key.includes("PASTE_")) {
    return { articles: [], note: "News API key is missing" };
  }

  const url = "https://newsapi.org/v2/everything";
  const params = {
    qInTitle: countryName,
    language: "ru",
    pageSize: 5,
    sortBy: "publishedAt",
    apiKey: key
  };

  const resp = await axios.get(url, { params, timeout: 12000 });

  const articles = Array.isArray(resp.data?.articles) ? resp.data.articles : [];

  return {
    articles: articles.slice(0, 5).map((a) => ({
      title: a?.title || "N/A",
      image: a?.urlToImage || "",
      description: a?.description || "N/A",
      url: a?.url || ""
    }))
  };
}

app.get("/api/profile", async (req, res) => {
  try {
    const user = await fetchRandomUser();

    const country = await fetchCountryInfo(user.country);

    const exchange =
      country.currencyCode !== "N/A"
        ? await fetchExchangeRates(country.currencyCode)
        : { base: "N/A", usd: "N/A", kzt: "N/A" };

    const news = await fetchNews(user.country);

    res.json({
      ok: true,
      user,
      country,
      exchange,
      news
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err?.message || "Unknown error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});