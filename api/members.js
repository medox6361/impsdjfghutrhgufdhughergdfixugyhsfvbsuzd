
const WORKER_URL =
  "https://aged-mouse-0724.ahmedmedox11.workers.dev";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://evoclan.site.je",
    "https://evolution-clan.site.je"
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(`${WORKER_URL}/members`, {
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return res.status(502).json({
        error: "Worker request failed"
      });
    }

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error("EVO relay error:", error.message);

    return res.status(502).json({
      error: "Could not reach Worker"
    });
  }
};
