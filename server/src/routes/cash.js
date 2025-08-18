const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { from, to } = req.query;
  let sql = 'SELECT * FROM cash_movements WHERE 1=1';
  const params = [];
  if (from) { sql += ' AND created_at >= ?'; params.push(from); }
  if (to) { sql += ' AND created_at <= ?'; params.push(to); }
  sql += ' ORDER BY created_at DESC LIMIT 500';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/summary', (req, res) => {
  const { from, to } = req.query;
  let sql = `SELECT SUM(CASE WHEN type='in' THEN amount_cents ELSE 0 END) AS total_in,
                    SUM(CASE WHEN type='out' THEN amount_cents ELSE 0 END) AS total_out
             FROM cash_movements WHERE 1=1`;
  const params = [];
  if (from) { sql += ' AND created_at >= ?'; params.push(from); }
  if (to) { sql += ' AND created_at <= ?'; params.push(to); }
  const row = db.prepare(sql).get(...params) || { total_in: 0, total_out: 0 };
  res.json({ total_in: row.total_in || 0, total_out: row.total_out || 0, balance: (row.total_in || 0) - (row.total_out || 0) });
});

router.post('/', (req, res) => {
  const { type, amount_cents, description, appointment_id } = req.body || {};
  if (!type || !amount_cents) return res.status(400).json({ error: 'Campos obrigatórios: type, amount_cents' });
  if (!['in', 'out'].includes(type)) return res.status(400).json({ error: 'type deve ser in|out' });
  const info = db.prepare('INSERT INTO cash_movements (type, amount_cents, description, appointment_id) VALUES (?, ?, ?, ?)')
    .run(type, amount_cents, description || null, appointment_id || null);
  const created = db.prepare('SELECT * FROM cash_movements WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

module.exports = router;