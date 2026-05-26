module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { mode, from, to, returnCity, date, returnDate } = req.query;
  const apiKey = process.env.RAPIDAPI_KEY;

  if (mode === 'specify') {
    try {
      const [outbound, inbound] = await Promise.all([
        searchFlight(from, to, date, apiKey),
        searchFlight(returnCity, from, returnDate, apiKey)
      ]);
      return res.json({ outbound, inbound });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // 探索模式
  try {
    const url = `https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchFlightEverywhere?originSkyId=${from || 'SIN'}&date=${date}&cabinClass=economy&adults=1&currency=SGD`;
    console.log('Calling URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'sky-scrapper.p.rapidapi.com'
      }
    });

    const text = await response.text();
    console.log('Raw response:', text.slice(0, 500));

    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      return res.status(500).json({ error: 'API returned non-JSON: ' + text.slice(0, 200) });
    }

    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

async function searchFlight(from, to, date, apiKey) {
  const url = `https://sky-scrapper.p.rapidapi.com/api/v2/flights/searchFlights?originSkyId=${from}&destinationSkyId=${to}&date=${date}&cabinClass=economy&adults=1&currency=SGD`;
  const response = await fetch(url, {
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'sky-scrapper.p.rapidapi.com'
    }
  });
  return response.json();
}
