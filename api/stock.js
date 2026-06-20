export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { code } = req.query;
  if (!code) { res.status(400).json({ error: 'Missing stock code' }); return; }

  try {
    // Try TSE (上市)
    const tseRes = await fetch(
      `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${code}.tw&json=1&delay=0`,
      { headers: { 'Referer': 'https://mis.twse.com.tw' } }
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
      { headers: { 'Referer': 'https://mis.twse.com.tw' } }
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
