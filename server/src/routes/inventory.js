const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/items', (req, res) => {
  const rows = db.prepare('SELECT * FROM inventory_items ORDER BY active DESC, name ASC').all();
  res.json(rows);
});

router.post('/items', (req, res) => {
  const { name, stock_qty, unit, cost_cents, price_cents, low_stock_threshold, active } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  const info = db.prepare('INSERT INTO inventory_items (name, stock_qty, unit, cost_cents, price_cents, low_stock_threshold, active) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(name, stock_qty ?? 0, unit || 'un', cost_cents ?? 0, price_cents ?? 0, low_stock_threshold ?? 0, active !== undefined ? (active ? 1 : 0) : 1);
  const created = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/items/:id', (req, res) => {
  const current = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Item não encontrado' });
  const { name, stock_qty, unit, cost_cents, price_cents, low_stock_threshold, active } = req.body || {};
  db.prepare('UPDATE inventory_items SET name = ?, stock_qty = ?, unit = ?, cost_cents = ?, price_cents = ?, low_stock_threshold = ?, active = ? WHERE id = ?')
    .run(name ?? current.name,
         stock_qty ?? current.stock_qty,
         unit ?? current.unit,
         cost_cents ?? current.cost_cents,
         price_cents ?? current.price_cents,
         low_stock_threshold ?? current.low_stock_threshold,
         active !== undefined ? (active ? 1 : 0) : current.active,
         req.params.id);
  const updated = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.get('/items/:id/movements', (req, res) => {
  const rows = db.prepare('SELECT * FROM inventory_movements WHERE item_id = ? ORDER BY created_at DESC LIMIT 200').all(req.params.id);
  res.json(rows);
});

router.post('/items/:id/movements', (req, res) => {
  const { change_qty, reason } = req.body || {};
  if (!change_qty && change_qty !== 0) return res.status(400).json({ error: 'change_qty é obrigatório' });
  const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item não encontrado' });
  const newQty = (item.stock_qty || 0) + Number(change_qty);
  const tx = db.transaction(() => {
    db.prepare('UPDATE inventory_items SET stock_qty = ? WHERE id = ?').run(newQty, req.params.id);
    const info = db.prepare('INSERT INTO inventory_movements (item_id, change_qty, reason) VALUES (?, ?, ?)')
      .run(req.params.id, change_qty, reason || null);
    return info.lastInsertRowid;
  });
  const movementId = tx();
  const created = db.prepare('SELECT * FROM inventory_movements WHERE id = ?').get(movementId);
  res.status(201).json(created);
});

module.exports = router;