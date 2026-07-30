export async function getIDXPrice(symbol) {
  if (!symbol) return null;
  try {
    const cleanSymbol = symbol.trim().toUpperCase();
    const res = await fetch(`https://www.google.com/finance/quote/${cleanSymbol}:IDX`, { 
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/data-last-price="([^"]*)"/);
    if (match && match[1]) {
      const price = Number(match[1]);
      return isNaN(price) ? null : price;
    }
  } catch (e) {
    console.error("Failed to fetch price for", symbol, e);
  }
  return null;
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
  try {
    const code = currencyCode.trim().toUpperCase();
    const res = await fetch(`https://www.google.com/finance/quote/${code}-IDR`, { 
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/data-last-price="([^"]*)"/);
    if (match && match[1]) {
      const price = Number(match[1]);
      return isNaN(price) ? null : price;
    }
  } catch (e) {
    console.error("Failed to fetch forex price for", currencyCode, e);
  }
  return null;
}
