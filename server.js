
const express = require("express");
const crypto = require("crypto");

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
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Cache-Control", "no-store");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-EVO-API-Key"
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

function validSecret(received, expected) {
  if (
    typeof received !== "string" ||
    typeof expected !== "string" ||
    !received ||
    !expected
  ) {
    return false;
  }

  const a = Buffer.from(received);
  const b = Buffer.from(expected);

  return (
    a.length === b.length &&
    crypto.timingSafeEqual(a, b)
  );
}

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "EVO API Relay" });
});

// قراءة الأعضاء من الـ Worker
app.get("/members", async (req, res) => {
  try {
    const response = await fetch(`${WORKER_URL}/members`, {
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: "Worker request failed"
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Members relay error:", error.message);

    return res.status(502).json({
      error: "Could not reach Worker"
    });
  }
});

// مزامنة الأعضاء مع قاعدة البيانات
app.post("/api", async (req, res) => {
  const relayKey = process.env.RELAY_API_KEY;
  const workerKey = process.env.WORKER_API_KEY;

  if (!relayKey || !workerKey) {
    return res.status(503).json({
      success: false,
      error: "Relay is not configured"
    });
  }

  if (
    !validSecret(
      req.headers["x-evo-api-key"],
      relayKey
    )
  ) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  if (
    !req.body ||
    typeof req.body !== "object" ||
    Array.isArray(req.body) ||
    req.body.action !== "sync_members" ||
    !Array.isArray(req.body.members)
  ) {
    return res.status(400).json({
      success: false,
      error: "Invalid request"
    });
  }

  try {
    const response = await fetch(`${WORKER_URL}/api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-EVO-API-Key": workerKey
      },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(15000)
    });

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Sync relay error:", error.message);

    return res.status(502).json({
      success: false,
      error: "Could not reach Worker"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`EVO API Relay listening on ${PORT}`);
});
