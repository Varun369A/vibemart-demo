// Opviva error monitoring — auto-added, zero dependencies. Reports uncaught errors to Opviva;
// fire-and-forget, never blocks. (CommonJS so it loads cleanly from this ESM app via a .cjs import.)
var _https = require("https");
var _ENDPOINT = "https://api.opviva.com/ingest/opv_0bb3024a1333b0bd45b20310da2e89ebc3c4";
function _report(type, message, stack) {
  try {
    var body = JSON.stringify({ type: type || "Error", message: message || "", stack: stack || "", environment: process.env.NODE_ENV || "production", release: process.env.RELEASE || undefined });
    var u = new URL(_ENDPOINT);
    var req = _https.request({ hostname: u.hostname, path: u.pathname + u.search, method: "POST", headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body) } });
    req.on("error", function () {});
    req.write(body); req.end();
  } catch (e) {}
}
process.on("uncaughtException", function (err) { _report(err && err.name, err && err.message, err && err.stack); });
process.on("unhandledRejection", function (reason) { var r = reason || {}; _report(r.name || "UnhandledRejection", r.message || String(r), r.stack); });
// Also exported so an Express error handler can report route errors WITHOUT crashing the process.
module.exports = { report: _report };
