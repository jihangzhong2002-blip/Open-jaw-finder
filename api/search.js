const cache = { data: null, timestamp: 0 };
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6小时

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { mode, from, to, date, returnDate } = req.query;
  const apiKey = process.env.RAPIDAPI_KEY;

  // 指定模式：直接搜两段
  if (mode === 'specify') {
    try {
      const [outbound, inbound] = await Promise.all([
        searchFlight(from, to, date, apiKey),
        searchFlight(to, from, returnDate, apiKey)  // 注意：这里to是入境城市，from是出发地
      ]);
      return res.json({ outbound, inbound });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // 探索模式：搜 SIN 出发到所有目的地
  const now = Date.now();
  if (cache.data && now - cache.timestamp < CACHE_TTL) {
    return res.json(cache.data);
  }

  try {
    const result = await searchEverywhere(from || 'SIN', date, apiKey);
    cache.data = result;
    cache.timestamp = now;
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function searchEverywhere(origin, date, apiKey) {
  const url = `https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchFlightEverywhere?originSkyId=${origin}&date=${date}&cabinClass=economy&adults=1&currency=SGD`;
  const response = await fetch(url, {
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'sky-scrapper.p.rapidapi.com'
    }
  });
  return response.json();
}

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

const data = await response.json();
console.log(JSON.stringify(data).slice(0, 500));
return data;
