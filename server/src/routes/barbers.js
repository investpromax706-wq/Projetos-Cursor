const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM barbers ORDER BY active DESC, name ASC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name, phone, email, active } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  const info = db.prepare('INSERT INTO barbers (name, phone, email, active) VALUES (?, ?, ?, ?)')
    .run(name, phone || null, email || null, active !== undefined ? (active ? 1 : 0) : 1);
  const created = db.prepare('SELECT * FROM barbers WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/:id', (req, res) => {
  const current = db.prepare('SELECT * FROM barbers WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Barbeiro não encontrado' });
  const { name, phone, email, active } = req.body || {};
  db.prepare('UPDATE barbers SET name = ?, phone = ?, email = ?, active = ? WHERE id = ?')
    .run(name ?? current.name, phone ?? current.phone, email ?? current.email, active !== undefined ? (active ? 1 : 0) : current.active, req.params.id);
  const updated = db.prepare('SELECT * FROM barbers WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;