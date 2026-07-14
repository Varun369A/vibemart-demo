// VibeMart — an intentionally-vulnerable demo store for Opviva security demos.
// DO NOT use in production. The "vulnerabilities" here are deliberate teaching examples.
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers on every response (CSP, HSTS, anti-clickjacking, MIME-sniffing, referrer).
app.use((_req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// Admin key stays SERVER-SIDE only — sourced from the environment, never shipped to the browser.
const ADMIN_KEY = process.env.ADMIN_KEY || "vm_admin_9f2a7c4e1b8d6a3f0c5e2d9b4a1f7c8e";

// Fake customer records (PII) — this is what a leak exposes.
const CUSTOMERS = [
  { id: 1, name: "Aisha Verma", email: "aisha.verma@gmail.com", card: "4242", spent: 1284, city: "Mumbai" },
  { id: 2, name: "Daniel Brooks", email: "dan.brooks@outlook.com", card: "8817", spent: 342, city: "Austin" },
  { id: 3, name: "Sofia Rossi", email: "sofia.rossi@icloud.com", card: "0193", spent: 2109, city: "Milan" },
  { id: 4, name: "Kenji Tanaka", email: "kenji.t@yahoo.co.jp", card: "5561", spent: 76, city: "Osaka" },
  { id: 5, name: "Grace Okoro", email: "grace.okoro@gmail.com", card: "3390", spent: 918, city: "Lagos" },
  { id: 6, name: "Liam Murphy", email: "liam.murphy@proton.me", card: "7742", spent: 455, city: "Dublin" },
  { id: 7, name: "Priya Nair", email: "priya.nair@gmail.com", card: "1108", spent: 3277, city: "Bengaluru" },
  { id: 8, name: "Noah Schmidt", email: "noah.schmidt@web.de", card: "6624", spent: 189, city: "Berlin" },
];

const PRODUCTS = [
  { id: 1, name: "Aurora Runner", price: 129, tag: "Best seller", emoji: "👟" },
  { id: 2, name: "Cloud Hoodie", price: 79, tag: "New", emoji: "🧥" },
  { id: 3, name: "Trail Daypack", price: 96, tag: "", emoji: "🎒" },
  { id: 4, name: "Solstice Watch", price: 210, tag: "Limited", emoji: "⌚" },
  { id: 5, name: "Nomad Bottle", price: 28, tag: "", emoji: "🧴" },
  { id: 6, name: "Ridge Cap", price: 34, tag: "", emoji: "🧢" },
];

const page = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeMart — shop the drop</title>
<style>
  :root{--bg:#0f1216;--card:#171b21;--line:#242a32;--ink:#eef2f6;--soft:#9aa7b4;--brand:#ff6a3d;--brand2:#ffd166}
  *{margin:0;box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  body{background:var(--bg);color:var(--ink)}
  header{display:flex;align-items:center;justify-content:space-between;padding:18px 28px;border-bottom:1px solid var(--line);position:sticky;top:0;background:rgba(15,18,22,.9);backdrop-filter:blur(8px)}
  .logo{font-weight:900;font-size:26px;letter-spacing:-1px}.logo span{color:var(--brand)}
  nav a{color:var(--soft);text-decoration:none;margin-left:22px;font-weight:600;font-size:15px}
  .cart{background:var(--brand);color:#1a0e08;font-weight:800;padding:9px 16px;border-radius:10px;margin-left:22px}
  .hero{padding:70px 28px 40px;text-align:center;background:radial-gradient(80% 60% at 50% 0,#20262e,transparent)}
  .hero h1{font-size:56px;letter-spacing:-2px;line-height:1.05}.hero h1 em{color:var(--brand);font-style:normal}
  .hero p{color:var(--soft);margin-top:14px;font-size:19px}
  .grid{max-width:1080px;margin:30px auto 80px;padding:0 24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px}
  .p{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px;transition:.15s}
  .p:hover{border-color:var(--brand);transform:translateY(-3px)}
  .p .em{font-size:64px}.p .tag{display:inline-block;font-size:12px;font-weight:800;color:var(--brand2);letter-spacing:1px}
  .p h3{margin-top:8px;font-size:19px}.p .price{margin-top:6px;font-weight:800;font-size:22px}
  .p button{margin-top:14px;width:100%;background:#20262e;color:var(--ink);border:1px solid var(--line);border-radius:12px;padding:12px;font-weight:700;cursor:pointer}
  footer{border-top:1px solid var(--line);padding:30px;text-align:center;color:var(--soft);font-size:14px}
  .staff{position:fixed;bottom:18px;right:18px;background:#171b21;border:1px solid var(--line);border-radius:12px;padding:10px 14px;font-size:13px;color:var(--soft)}
</style></head><body>
<header>
  <div class="logo">Vibe<span>Mart</span></div>
  <nav><a href="#">Shop</a><a href="#">New</a><a href="#">Sale</a><a class="cart" href="#">Cart · 0</a></nav>
</header>
<section class="hero"><h1>Gear that just <em>hits.</em></h1><p>Free shipping over $75 · 30-day returns</p></section>
<div class="grid" id="grid"></div>
<footer>© VibeMart Demo · built fast, shipped faster</footer>
<div class="staff" id="staff">staff area · sign in required</div>

<script>
  // No secrets in the browser. The admin key lives server-side only.
  window.VIBEMART = { region: "prod" };

  fetch('/api/products').then(r=>r.json()).then(d=>{
    document.getElementById('grid').innerHTML = d.products.map(p=>
      '<div class="p"><div class="em">'+p.emoji+'</div>'+(p.tag?'<div class="tag">'+p.tag+'</div>':'')+
      '<h3>'+p.name+'</h3><div class="price">$'+p.price+'</div><button>Add to cart</button></div>').join('');
  });
</script>
</body></html>`;

app.get("/", (_req, res) => res.type("html").send(page));

app.get("/api/products", (_req, res) => res.json({ products: PRODUCTS }));

// Admin data endpoint — requires the server-side admin key via an Authorization: Bearer header
// (never a URL query param, never exposed to the browser). No header → 401.
app.get("/api/admin/customers", (req, res) => {
  const auth = req.get("authorization") || "";
  if (auth !== "Bearer " + ADMIN_KEY) return res.status(401).json({ error: "unauthorized" });
  res.json({ customers: CUSTOMERS });
});

// The /.env route was removed: environment configuration containing secrets
// (DB credentials, Stripe key, admin API key, JWT secret) must never be served
// over HTTP. Requests to /.env now fall through to a 404.

// Opviva domain-ownership verification (file method) — proves we own this domain for the demo.
app.get("/.well-known/opviva-verify.txt", (_req, res) =>
  res.type("text/plain").send(process.env.OPVIVA_VERIFY_TOKEN || "opviva-verify-365d43e8be0aaeafbb5e7650a127965c"));

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`VibeMart demo on :${PORT}`));
