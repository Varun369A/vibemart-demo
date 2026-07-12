# VibeMart (demo)

An **intentionally-vulnerable** demo storefront used to demonstrate [Opviva](https://opviva.com) finding and fixing real security issues in AI-built apps.

> ⚠️ This app ships deliberate vulnerabilities for educational/marketing demos. **Do not deploy it as a real store or reuse this code in production.** It contains no real customer data — all records are fake.

## The deliberate flaws
1. **Exposed admin key** — a service-style key is shipped to the browser in the page source.
2. **Broken access control** — `/api/admin/customers` is gated only by that exposed key, so anyone can dump all customer PII.
3. **Missing security headers** — no CSP / HSTS / clickjacking protection.
4. **Public `.env`** — `/.env` is served over HTTP, leaking secrets.

## Run
```bash
npm install
npm start          # http://localhost:3000
node exploit.mjs http://localhost:3000
```

Built as a demo target for Opviva. Fix it in one scan → https://opviva.com
