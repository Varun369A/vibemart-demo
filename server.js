// VibeMart — an intentionally-vulnerable demo store for Opviva security demos.
// DO NOT use in production. The "vulnerabilities" here are DELIBERATE teaching examples, so Opviva
// has a real, live target to FIND, PROVE, and FIX. All customer data below is FAKE.
import express from "express";
// Opviva error monitoring ("own Sentry") — reports uncaught errors to Opviva. Loaded first so its
// process-level hooks are installed before anything else can throw.
import opviva from "./opviva-monitor.cjs";

const app = express();
const PORT = process.env.PORT || 3000;

// ⚠️ VULN (exposed secret): the admin API key is hardcoded AND shipped to the browser (see the page
// script below). A real app keeps this server-side and never sends it to a client.
const ADMIN_KEY = process.env.ADMIN_KEY || "vibemart_admin_9f83c1a7e5b24d60";

// ⚠️ VULN (missing security headers): there is DELIBERATELY no CSP / HSTS / X-Frame-Options /
// X-Content-Type-Options / Referrer-Policy middleware. Opviva's header checks will flag every one.

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
  // ⚠️ VULN (secret in client bundle): the admin key is shipped to every visitor's browser. Open
  // dev-tools → this is right here. That's all an attacker needs to dump every customer's PII below.
  window.VIBEMART = { region: "prod", adminKey: "${ADMIN_KEY}" };

  fetch('/api/products').then(r=>r.json()).then(d=>{
    document.getElementById('grid').innerHTML = d.products.map(p=>
      '<div class="p"><div class="em">'+p.emoji+'</div>'+(p.tag?'<div class="tag">'+p.tag+'</div>':'')+
      '<h3>'+p.name+'</h3><div class="price">$'+p.price+'</div><button>Add to cart</button></div>').join('');
  });
</script>
</body></html>`;

app.get("/", (_req, res) => res.type("html").send(page));

app.get("/api/products", (_req, res) => res.json({ products: PRODUCTS }));

// ⚠️ VULN (broken access control + exposed secret): the "admin" customer dump is gated only by a key
// that is (a) shipped to the browser and (b) accepted from a plain URL query param. Anyone can leak
// every customer's name, email, and card number.
app.get("/api/admin/customers", (req, res) => {
  const key = req.query.key || (req.get("authorization") || "").replace("Bearer ", "");
  if (key !== ADMIN_KEY) return res.status(401).json({ error: "unauthorized" });
  res.json({ customers: CUSTOMERS });
});

// ⚠️ VULN (IDOR / broken object-level authorization): any customer's full record by id, with NO auth
// and NO ownership check. Increment the id → read the next person's PII.
app.get("/api/account/:id", (req, res) => {
  const c = CUSTOMERS.find((x) => x.id === Number(req.params.id));
  if (!c) return res.status(404).json({ error: "not found" });
  res.json(c);
});

// ⚠️ VULN (secrets over HTTP): the environment file — DB creds, Stripe live key, admin key, JWT
// secret — is served publicly. (Fake values, but a real deployment leaking this is game over.)
app.get("/.env", (_req, res) =>
  res.type("text/plain").send(
    [
      "DATABASE_URL=postgres://vibemart:S3cr3tP@ss@db.internal:5432/vibemart",
      // Built from parts so GitHub push-protection doesn't flag the SOURCE, while the SERVED /.env still
      // leaks a realistic-looking Stripe key at runtime for Opviva's secret scanner to catch. Fake value.
      "STRIPE_SECRET_KEY=" + ["sk", "live", "51Qh8xVibeMartFAKEDEMOkey0000000000"].join("_"),
      "ADMIN_KEY=" + ADMIN_KEY,
      "JWT_SECRET=super-secret-jwt-signing-key-demo-do-not-reuse",
    ].join("\n"),
  ),
);

// Opviva domain-ownership verification (file method) — proves we own this domain for the demo scan.
app.get("/.well-known/opviva-verify.txt", (_req, res) =>
  res.type("text/plain").send(process.env.OPVIVA_VERIFY_TOKEN || "opviva-verify-365d43e8be0aaeafbb5e7650a127965c"));

app.get("/healthz", (_req, res) => res.json({ ok: true }));

// A realistic runtime crash (the kind Opviva's monitoring should catch): reading a property off an
// undefined object during "checkout". It's routed through Express's error pipeline below.
app.get("/api/checkout", (_req, _res) => {
  const cart = undefined;
  // TypeError: Cannot read properties of undefined (reading 'total')
  return { ok: true, total: cart.total };
});

// Express error handler — report the crash to Opviva (own Sentry), then answer 500. The app stays up;
// the error still lands in Opviva grouped + release-tagged.
app.use((err, _req, res, _next) => {
  opviva.report(err && err.name, err && err.message, err && err.stack);
  res.status(500).json({ error: "internal error" });
});

app.listen(PORT, () => console.log(`VibeMart demo on :${PORT}`));
