/** EUR → BRL from Frankfurter (European Central Bank reference rates, no API key). Cached for 6 hours. */
const TTL = 6 * 60 * 60 * 1000;
let cached = null;

export async function eurToBrl() {
  if (cached && Date.now() - cached.at < TTL) return cached.value;
  try {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?from=EUR&to=BRL', { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    cached = { at: Date.now(), value: { rate: json.rates.BRL, date: json.date, source: 'Banco Central Europeu (frankfurter.dev)' } };
  } catch (err) {
    // Keep serving the last good rate if the API is down.
    if (!cached) throw err;
  }
  return cached.value;
}
