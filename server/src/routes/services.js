const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM services ORDER BY active DESC, name ASC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name, duration_min, price_cents, active } = req.body || {};
  if (!name || !duration_min || !price_cents) return res.status(400).json({ error: 'Campos obrigatórios: name, duration_min, price_cents' });
  const info = db.prepare('INSERT INTO services (name, duration_min, price_cents, active) VALUES (?, ?, ?, ?)')
    .run(name, duration_min, price_cents, active !== undefined ? (active ? 1 : 0) : 1);
  const created = db.prepare('SELECT * FROM services WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/:id', (req, res) => {
  const current = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Serviço não encontrado' });
  const { name, duration_min, price_cents, active } = req.body || {};
  db.prepare('UPDATE services SET name = ?, duration_min = ?, price_cents = ?, active = ? WHERE id = ?')
    .run(name ?? current.name,
         duration_min ?? current.duration_min,
         price_cents ?? current.price_cents,
         active !== undefined ? (active ? 1 : 0) : current.active,
         req.params.id);
  const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;