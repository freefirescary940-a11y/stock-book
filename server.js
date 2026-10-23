// Back end: Node.js + Express. Saves all data in one JSON file.
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');
const APP_USER = process.env.APP_USER || 'admin';
const APP_PASSWORD = process.env.APP_PASSWORD; // set this so only you can open the site

// Password protection (browser shows a login box)
if (APP_PASSWORD) {
  app.use((req, res, next) => {
    const h = req.headers.authorization || '';
    const decoded = Buffer.from(h.replace(/^Basic /, ''), 'base64').toString();
    const i = decoded.indexOf(':');
    const user = decoded.slice(0, i), pass = decoded.slice(i + 1);
    if (i > -1 && user === APP_USER && pass === APP_PASSWORD) return next();
    res.set('WWW-Authenticate', 'Basic realm="Stock Book"');
    res.status(401).send('Login required');
  });
}

app.use(express.json({ limit: '5mb' }));

function readState() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch (e) { return { items: [], days: {}, phone: '' }; }
}

// Get everything (items, daily records, phone)
app.get('/api/state', (req, res) => res.json(readState()));

// Save everything
app.put('/api/state', (req, res) => {
  const s = req.body;
  if (!s || !Array.isArray(s.items) || typeof s.days !== 'object') {
    return res.status(400).json({ error: 'Invalid data' });
  }
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(s));
  fs.renameSync(tmp, DATA_FILE); // safe write
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log('Stock book running on port ' + PORT));
