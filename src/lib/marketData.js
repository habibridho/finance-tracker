const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0",
};

async function fetchYahooPrice(ticker) {
  // query1 occasionally returns 429; query2 serves the same API, so try both.
  for (const host of ["query1", "query2"]) {
    try {
      const res = await fetch(
        `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1d`,
        { headers: YAHOO_HEADERS, next: { revalidate: 3600 } } // Cache for 1 hour
      );
      if (!res.ok) {
        console.warn("Yahoo price fetch failed for", ticker, "via", host, "status", res.status);
        continue;
      }
      const json = await res.json();
      const price = Number(json?.chart?.result?.[0]?.meta?.regularMarketPrice);
      if (Number.isFinite(price)) return price;
      console.warn("Yahoo price missing for", ticker);
      return null;
    } catch (e) {
      console.error("Failed to fetch Yahoo price for", ticker, e);
    }
  }
  return null;
}

export async function getIDXPrice(symbol) {
  if (!symbol) return null;
  return fetchYahooPrice(`${symbol.trim().toUpperCase()}.JK`);
}

export async function getAntamPrice() {
  try {
    const res = await fetch('https://www.logammulia.com/id/harga-emas-hari-ini', { 
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (!res.ok) return null;
    const text = await res.text();
    // Look for <td>1 gr</td> and then capture the next <td> value like 1,000,000
    const match = text.match(/<td>1 gr<\/td>\s*<td[^>]*>([0-9,.]+)<\/td>/i);
    if (match && match[1]) {
      const priceStr = match[1].replace(/,/g, ''); // Remove commas
      const price = Number(priceStr);
      return isNaN(price) ? null : price;
    }
  } catch (e) {
    console.error("Failed to fetch Antam price", e);
  }
  return null;
}

export async function getForexPrice(currencyCode) {
  if (!currencyCode) return null;
  return fetchYahooPrice(`${currencyCode.trim().toUpperCase()}IDR=X`);
}
