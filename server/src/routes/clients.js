const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { q } = req.query;
  let rows;
  if (q) {
    rows = db.prepare('SELECT * FROM clients WHERE name LIKE ? OR phone LIKE ? ORDER BY created_at DESC').all(`%${q}%`, `%${q}%`);
  } else {
    rows = db.prepare('SELECT * FROM clients ORDER BY created_at DESC LIMIT 200').all();
  }
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Cliente não encontrado' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { name, phone, email, notes } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  const stmt = db.prepare('INSERT INTO clients (name, phone, email, notes) VALUES (?, ?, ?, ?)');
  const info = stmt.run(name, phone || null, email || null, notes || null);
  const created = db.prepare('SELECT * FROM clients WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/:id', (req, res) => {
  const current = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Cliente não encontrado' });
  const { name, phone, email, notes } = req.body || {};
  const stmt = db.prepare('UPDATE clients SET name = ?, phone = ?, email = ?, notes = ? WHERE id = ?');
  stmt.run(name ?? current.name, phone ?? current.phone, email ?? current.email, notes ?? current.notes, req.params.id);
  const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
  res.status(204).send();
});

module.exports = router;