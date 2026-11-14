require("dotenv").config();
const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const bcrypt = require("bcryptjs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 8085);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
const CONFIG_FILE = path.join(DATA_DIR, "wifi.json");
const defaults = { ssid: "Gast-WLAN", password: "", security: "WPA", hidden: false, enabled: true };
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.");
if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.startsWith("CHANGE_ME")) throw new Error("Set a strong ADMIN_PASSWORD before starting.");

function loadConfig() {
  try { return { ...defaults, ...JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")) }; }
  catch { return { ...defaults }; }
}
let wifi = loadConfig();
function saveConfig() {
  const tmp = CONFIG_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(wifi, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, CONFIG_FILE);
  try { fs.chmodSync(CONFIG_FILE, 0o600); } catch {}
}
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12);

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"], scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:"], connectSrc: ["'self'"], objectSrc: ["'none'"], upgradeInsecureRequests: null
  }}
}));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(session({
  store: new SQLiteStore({ db: "sessions.sqlite", dir: DATA_DIR }),
  name: "guestwifi.sid", secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "strict", secure: process.env.COOKIE_SECURE === "true", maxAge: 8 * 60 * 60 * 1000 }
}));
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: "draft-7", legacyHeaders: false });
app.use(express.static(path.join(__dirname, "public")));
const requireAdmin = (req, res, next) => req.session?.admin === true ? next() : res.status(401).json({ error: "Nicht angemeldet." });
const validText = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;

app.get("/api/public", (req, res) => {
  res.set("Cache-Control", "no-store");
  if (!wifi.enabled || !wifi.ssid || !wifi.password) return res.json({ enabled: false, title: process.env.PUBLIC_TITLE || "Gäste-WLAN", subtitle: "Das Gäste-WLAN ist derzeit nicht verfügbar." });
  res.json({ enabled: true, title: process.env.PUBLIC_TITLE || "Willkommen im Gäste-WLAN", subtitle: process.env.PUBLIC_SUBTITLE || "Scannen und direkt verbinden.", ssid: wifi.ssid, password: wifi.password, security: wifi.security, hidden: wifi.hidden });
});
app.post("/api/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  const ok = typeof username === "string" && username === adminUsername && typeof password === "string" && await bcrypt.compare(password, adminHash);
  if (!ok) return res.status(401).json({ error: "Benutzername oder Passwort falsch." });
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: "Anmeldung fehlgeschlagen." });
    req.session.admin = true; res.json({ ok: true });
  });
});
app.post("/api/logout", requireAdmin, (req, res) => req.session.destroy(() => { res.clearCookie("guestwifi.sid", { httpOnly: true, sameSite: "strict" }); res.json({ ok: true }); }));
app.get("/api/admin", requireAdmin, (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ ssid: wifi.ssid, password: wifi.password, security: wifi.security, hidden: wifi.hidden, enabled: wifi.enabled });
});
app.put("/api/admin", requireAdmin, (req, res) => {
  const { ssid, password, security, hidden, enabled } = req.body || {};
  if (!validText(ssid, 32)) return res.status(400).json({ error: "Der WLAN-Name muss 1–32 Zeichen lang sein." });
  if (typeof password !== "string" || password.length > 63 || (security !== "nopass" && password.length < 8)) return res.status(400).json({ error: "Das WLAN-Passwort muss bei WPA mindestens 8 Zeichen lang sein." });
  if (!["WPA", "WEP", "nopass"].includes(security) || typeof hidden !== "boolean" || typeof enabled !== "boolean") return res.status(400).json({ error: "Ungültige Einstellungen." });
  wifi = { ssid: ssid.trim(), password, security, hidden, enabled }; saveConfig(); res.json({ ok: true });
});
function wifiPayload() {
  const esc = s => String(s).replace(/([\\;,:"])/g, "\\$1");
  return `WIFI:T:${wifi.security};S:${esc(wifi.ssid)};P:${esc(wifi.password)};H:${wifi.hidden ? "true" : "false"};;`;
}
app.get("/api/qr", async (req, res) => {
  if (!wifi.enabled || !wifi.ssid || !wifi.password) return res.status(404).json({ error: "QR-Code nicht verfügbar." });
  try { res.set("Cache-Control", "no-store"); res.json({ dataUrl: await QRCode.toDataURL(wifiPayload(), { width: 720, margin: 2, errorCorrectionLevel: "H" }) }); }
  catch { res.status(500).json({ error: "QR-Code konnte nicht erstellt werden." }); }
});
app.get("/api/qr.png", (req, res) => {
  if (!wifi.enabled || !wifi.ssid || !wifi.password) return res.status(404).send("QR-Code nicht verfügbar.");
  res.set({ "Content-Type": "image/png", "Content-Disposition": 'attachment; filename="guest-wifi-qr.png"', "Cache-Control": "no-store" });
  QRCode.toFileStream(res, wifiPayload(), { type: "png", width: 900, margin: 3, errorCorrectionLevel: "H" });
});
app.listen(PORT, "0.0.0.0", () => console.log(`Guest WiFi listening on port ${PORT}`));