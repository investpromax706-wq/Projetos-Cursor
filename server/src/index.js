require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const db = require('./db');
const { createToken, authMiddleware } = require('./auth');

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 300 });
app.use('/auth', apiLimiter);
app.use('/api', apiLimiter);

// Auth routes
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });
  const token = createToken(user);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/me', authMiddleware, (req, res) => {
  return res.json({ user: req.user });
});

// Feature routes
app.use('/api/clients', authMiddleware, require('./routes/clients'));
app.use('/api/barbers', authMiddleware, require('./routes/barbers'));
app.use('/api/services', authMiddleware, require('./routes/services'));
app.use('/api/appointments', authMiddleware, require('./routes/appointments'));
app.use('/api/cash', authMiddleware, require('./routes/cash'));
app.use('/api/inventory', authMiddleware, require('./routes/inventory'));

app.get('/', (req, res) => res.json({ ok: true }));

// Serve frontend if built into server/public
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path === '/me') return next();
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});