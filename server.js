require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const path = require('path');

const app = express();
app.use(express.static('public'));
const PORT = Number(process.env.PORT || 3000);
const db = new Database(path.join(__dirname, 'rafin.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS applications (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT,
 shop_name TEXT NOT NULL, city TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'Pending',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.includes('replace-this')) {
  console.error('Set a strong SESSION_SECRET in .env before starting.');
  process.exit(1);
}
if (!process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD_HASH.includes('replace-with')) {
  console.error('Set ADMIN_PASSWORD_HASH in .env. See README.md.');
  process.exit(1);
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.json({ limit: '20kb' }));
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: __dirname }),
  secret: process.env.SESSION_SECRET,
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 4 }
}));
app.use(express.static(path.join(__dirname, 'public')));

const siteName = process.env.SITE_NAME || 'RAFIN PAN CARD SERVICE';
const phone = process.env.CONTACT_PHONE || '';
const safe = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const page = (title, content, active='') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe(title)} | ${safe(siteName)}</title><link rel="stylesheet" href="/style.css"></head><body><header class="top"><a class="brand" href="/">RAFIN <span>PAN CARD SERVICE</span></a><nav><a href="/">Home</a><a href="/register">Retailer Registration</a><a href="/login">Retailer Login</a><a href="/admin/login">Admin</a></nav></header>${content}<footer><b>${safe(siteName)}</b><p>Independent retailer portal concept. Not an official government website.</p><p>Contact: ${safe(phone)}</p></footer></body></html>`;

app.get('/', (req,res) => res.send(page('Home', `<main><section class="hero"><div><p class="eyebrow">RETAILER PARTNER PORTAL</p><h1>Grow your digital service business.</h1><p class="lead">Apply to become a retailer and manage your application through a simple online portal.</p><div class="actions"><a class="btn" href="/register">Apply for Retailer Access</a><a class="btn secondary" href="/login">Retailer Login</a></div><p class="note">Retailer access is subject to review and required authorization.</p></div><div class="hero-card"><div class="pan-icon">PAN</div><h3>PAN Service Portal</h3><p>Registration · Application review · Account access</p><span class="pill">Secure account access</span></div></section><section class="section"><h2>Our service platform</h2><div class="cards"><article><div class="icon">01</div><h3>Retailer Registration</h3><p>Submit your business details for review.</p></article><article><div class="icon">02</div><h3>Application Review</h3><p>Track whether your request is pending, approved, or rejected.</p></article><article><div class="icon">03</div><h3>Retailer Login</h3><p>Access your account after approval and account setup.</p></article></div></section><section class="notice"><b>Important:</b> This website starter is not connected to Protean/NSDL and cannot issue official retailer IDs or process PAN applications. Use those features only after receiving the provider’s written authorization and integration details.</section></main>`)));

app.get('/register', (req,res) => res.send(page('Retailer Registration', `<main class="narrow"><h1>Retailer Registration</h1><p class="muted">Submit your details. The admin will review your application.</p><form method="post" action="/register" class="form"><label>Full name<input name="name" required maxlength="100" autocomplete="name"></label><label>Mobile number<input name="phone" required pattern="[0-9+() -]{8,20}" maxlength="20" autocomplete="tel"></label><label>Email (optional)<input name="email" type="email" maxlength="120" autocomplete="email"></label><label>Shop / business name<input name="shop_name" required maxlength="120"></label><label>City / District<input name="city" required maxlength="120"></label><label class="check"><input type="checkbox" required> I confirm these details are accurate and agree to be contacted about this application.</label><button class="btn" type="submit">Submit Application</button></form><p class="muted small">Do not enter PAN, Aadhaar, OTP, bank details, or identity-document numbers here.</p></main>`)));

app.post('/register', (req,res) => {
 const {name,phone,email,shop_name,city} = req.body;
 if (![name,phone,shop_name,city].every(v => typeof v === 'string' && v.trim()) ||
     name.length>100 || phone.length>20 || (email||'').length>120 || shop_name.length>120 || city.length>120 ||
     !/^[0-9+() -]{8,20}$/.test(phone)) return res.status(400).send(page('Invalid details','<main class="narrow"><h1>Please check your details</h1><a href="/register">Back to registration</a></main>'));
 const info = db.prepare('INSERT INTO applications (name,phone,email,shop_name,city) VALUES (?,?,?,?,?)').run(name.trim(),phone.trim(),(email||'').trim(),shop_name.trim(),city.trim());
 res.send(page('Application Submitted', `<main class="narrow"><div class="success">✓</div><h1>Application received</h1><p>Your reference number is <b>#${info.lastInsertRowid}</b>.</p><p>Your request is pending admin review. This is not an official Protean/NSDL retailer ID.</p><a class="btn" href="/">Back to Home</a></main>`));
});

app.get('/login', (req,res) => res.send(page('Retailer Login', `<main class="narrow"><h1>Retailer Login</h1><div class="notice">Retailer account login provision is a starter placeholder. Accounts are not automatically created from registration; enable account provisioning only after verifying authorization and completing security setup.</div><form class="form" onsubmit="event.preventDefault();document.getElementById('msg').hidden=false"><label>Mobile number / username<input required autocomplete="username"></label><label>Password<input type="password" required autocomplete="current-password"></label><button class="btn" type="submit">Login</button><p id="msg" hidden class="error">Retailer authentication is not enabled in this starter yet.</p></form><p><a href="/register">New retailer? Register here</a></p></main>`)));

app.get('/admin/login', (req,res) => res.send(page('Admin Login', `<main class="narrow"><h1>Admin Login</h1><form method="post" action="/admin/login" class="form"><label>Admin username<input name="username" required autocomplete="username"></label><label>Password<input type="password" name="password" required autocomplete="current-password"></label><button class="btn" type="submit">Sign in</button></form></main>`)));
app.post('/admin/login', (req,res) => {
 const okUser = req.body.username === (process.env.ADMIN_USERNAME || 'admin');
 const okPass = bcrypt.compareSync(req.body.password || '', process.env.ADMIN_PASSWORD_HASH);
 if (!okUser || !okPass) return res.status(401).send(page('Login failed','<main class="narrow"><h1>Login failed</h1><p>Incorrect credentials.</p><a href="/admin/login">Try again</a></main>'));
 req.session.regenerate(err => { if (err) return res.status(500).send('Session error'); req.session.admin = true; res.redirect('/admin'); });
});
function requireAdmin(req,res,next) { if (req.session && req.session.admin) return next(); return res.redirect('/admin/login'); }
app.get('/admin', requireAdmin, (req,res) => {
 const rows = db.prepare('SELECT * FROM applications ORDER BY id DESC LIMIT 500').all();
 const trs = rows.map(r => `<tr><td>#${r.id}</td><td>${safe(r.name)}</td><td>${safe(r.phone)}</td><td>${safe(r.shop_name)}</td><td>${safe(r.city)}</td><td><span class="status">${safe(r.status)}</span></td><td>${safe(r.created_at)}</td><td><form class="inline" method="post" action="/admin/status"><input type="hidden" name="id" value="${r.id}"><select name="status"><option ${r.status==='Pending'?'selected':''}>Pending</option><option ${r.status==='Approved'?'selected':''}>Approved</option><option ${r.status==='Rejected'?'selected':''}>Rejected</option></select><button class="mini">Save</button></form></td></tr>`).join('');
 res.send(page('Admin Dashboard', `<main class="wide"><div class="admin-head"><div><p class="eyebrow">CONTROL CENTER</p><h1>Retailer Applications</h1><p class="muted">Review submitted applications. Approval here is internal only and does not issue a Protean/NSDL ID.</p></div><form method="post" action="/admin/logout"><button class="btn secondary">Log out</button></form></div><div class="stat"><b>${rows.length}</b><span>Applications shown (maximum 500)</span></div><div class="table-wrap"><table><thead><tr><th>Ref</th><th>Name</th><th>Phone</th><th>Business</th><th>City/District</th><th>Status</th><th>Submitted</th><th>Update</th></tr></thead><tbody>${trs || '<tr><td colspan="8">No applications yet.</td></tr>'}</tbody></table></div></main>`));
});
app.post('/admin/status', requireAdmin, (req,res) => {
 const id = Number(req.body.id); const status = req.body.status;
 if (!Number.isInteger(id) || !['Pending','Approved','Rejected'].includes(status)) return res.status(400).send('Invalid request');
 db.prepare('UPDATE applications SET status=? WHERE id=?').run(status,id); res.redirect('/admin');
});
app.post('/admin/logout', requireAdmin, (req,res) => req.session.destroy(() => res.redirect('/')));
app.listen(PORT, () => console.log(`${siteName} running at http://localhost:${PORT}`));
