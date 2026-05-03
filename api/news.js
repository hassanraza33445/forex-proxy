export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    // Get next 14 days of events
    const now = new Date();
    const future = new Date(now.getTime() + 14 * 86400000);
    
    // Try TradingView first (most reliable, real-time)
    const tvUrl = `https://economic-calendar.tradingview.com/events?from=${now.toISOString()}&to=${future.toISOString()}&countries=US,EU,GB,JP,AU,CA,CH,NZ,CN,DE,FR,IT,ES`;
    
    let data = null;
    
    try {
      const r = await fetch(tvUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Origin': 'https://www.tradingview.com' }
      });
      if (r.ok) {
        const j = await r.json();
        const events = j.result || j.data || (Array.isArray(j) ? j : []);
        if (events.length > 0) {
          // Convert TV format to FF format
          const C2C = {
            'US':'USD','EU':'EUR','DE':'EUR','FR':'EUR','IT':'EUR','ES':'EUR',
            'GB':'GBP','JP':'JPY','AU':'AUD','CA':'CAD','CH':'CHF','NZ':'NZD','CN':'CNY'
          };
          data = events.filter(e => C2C[e.country]).map(e => ({
            title: e.title || e.indicator || 'Event',
            country: C2C[e.country],
            date: e.date,
            impact: e.importance === 1 ? 'High' : (e.importance === 0 ? 'Medium' : 'Low'),
            forecast: e.forecast != null ? String(e.forecast) : '',
            previous: e.previous != null ? String(e.previous) : '',
            actual: e.actual != null ? String(e.actual) : ''
          }));
        }
      }
    } catch (e) { console.error('TV failed:', e.message); }
    
    // Fallback to Forex Factory
    if (!data || data.length === 0) {
      try {
        const r = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (r.ok) {
          const ff = await r.json();
          // Filter to only today and future
          data = ff.filter(e => new Date(e.date) >= new Date(now.getTime() - 86400000));
        }
      } catch (e) {}
    }
    
    if (!data || data.length === 0) {
      return res.status(200).json([]);
    }
    
    res.setHeader('Cache-Control', 's-maxage=1800'); // 30 min cache
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
