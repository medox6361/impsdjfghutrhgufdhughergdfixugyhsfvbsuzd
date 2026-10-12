
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

const WORKER_URL =
  "https://aged-mouse-0724.ahmedmedox11.workers.dev";

const allowedOrigins = new Set([
  "https://evoclan.site.je",
  "https://www.evoclan.site.je",
  "https://evolution-clan.site.je",
  "https://www.evolution-clan.site.je"
]);

app.disable("x-powered-by");

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Cache-Control", "no-store");
  next();
});

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "EVO API Relay" });
});

app.get("/members", async (req, res) => {
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
    res.json(data);
  } catch {
    res.status(502).json({
      error: "Could not reach Worker"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`EVO API Relay listening on ${PORT}`);
});
