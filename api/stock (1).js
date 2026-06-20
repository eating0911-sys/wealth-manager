export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { code, market } = req.query;
  if (!code) { res.status(400).json({ error: 'Missing stock code' }); return; }

  try {
    // For US stocks use Yahoo Finance directly (server-side, no CORS issue)
    if (market === '美股') {
      const yahooRes = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${code}?interval=1d&range=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      const yahooData = await yahooRes.json();
      const meta = yahooData?.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        return res.status(200).json({
          name: meta.longName || meta.shortName || code,
          price: meta.regularMarketPrice,
          market: '美股',
          found: true
        });
      }
    }

    // For HK stocks
    if (market === '港股') {
      const sym = code.padStart(4,'0') + '.HK';
      const yahooRes = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      const yahooData = await yahooRes.json();
      const meta = yahooData?.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        return res.status(200).json({
          name: meta.longName || meta.shortName || code,
          price: meta.regularMarketPrice,
          market: '港股',
          found: true
        });
      }
    }

    // For Taiwan stocks: try TSE (上市)
    const tseRes = await fetch(
      `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${code}.tw&json=1&delay=0`,
      { headers: { 'Referer': 'https://mis.twse.com.tw', 'User-Agent': 'Mozilla/5.0' } }
    );
    const tseData = await tseRes.json();
    if (tseData.msgArray && tseData.msgArray.length > 0) {
      const s = tseData.msgArray[0];
      if (s.n && s.n !== '-') {
        const price = parseFloat(s.z) || parseFloat(s.y) || 0;
        return res.status(200).json({ name: s.n, price, market: '台股', found: true });
      }
    }

    // Try OTC (上櫃)
    const otcRes = await fetch(
      `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=otc_${code}.tw&json=1&delay=0`,
      { headers: { 'Referer': 'https://mis.twse.com.tw', 'User-Agent': 'Mozilla/5.0' } }
    );
    const otcData = await otcRes.json();
    if (otcData.msgArray && otcData.msgArray.length > 0) {
      const s = otcData.msgArray[0];
      if (s.n && s.n !== '-') {
        const price = parseFloat(s.z) || parseFloat(s.y) || 0;
        return res.status(200).json({ name: s.n, price, market: '台股', found: true });
      }
    }

    res.status(200).json({ found: false });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
