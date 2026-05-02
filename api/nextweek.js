export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    // Forex Factory next week URL with date range
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? 1 : 8 - day;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + mondayOffset);
    nextMonday.setHours(0,0,0,0);
    
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);
    
    const fmt = (d) => `${d.getMonth()+1}-${d.getDate()}-${d.getFullYear()}`;
    
    const url = `https://nfs.faireconomy.media/ff_calendar_thisweek.json?week=${fmt(nextMonday)}`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!response.ok) throw new Error('FF fetch failed: ' + response.status);
    
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
