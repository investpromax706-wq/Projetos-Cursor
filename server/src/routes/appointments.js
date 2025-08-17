const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { from, to, barber_id, client_id } = req.query;
  let sql = `SELECT a.*, c.name AS client_name, b.name AS barber_name, s.name AS service_name
             FROM appointments a
             JOIN clients c ON c.id = a.client_id
             JOIN barbers b ON b.id = a.barber_id
             JOIN services s ON s.id = a.service_id
             WHERE 1=1`;
  const params = [];
  if (from) { sql += ' AND a.start_at >= ?'; params.push(from); }
  if (to) { sql += ' AND a.end_at <= ?'; params.push(to); }
  if (barber_id) { sql += ' AND a.barber_id = ?'; params.push(barber_id); }
  if (client_id) { sql += ' AND a.client_id = ?'; params.push(client_id); }
  sql += ' ORDER BY a.start_at ASC LIMIT 500';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

function hasConflict(barberId, startAt, endAt, excludeId) {
  const sql = `SELECT COUNT(*) AS c FROM appointments
               WHERE barber_id = ? AND status = 'scheduled'
               AND NOT (end_at <= ? OR start_at >= ?)
               ${excludeId ? 'AND id <> ?' : ''}`;
  const row = db.prepare(sql).get(excludeId ? [barberId, startAt, endAt, excludeId] : [barberId, startAt, endAt]);
  return row.c > 0;
}

router.post('/', (req, res) => {
  const { client_id, barber_id, service_id, start_at, end_at, notes } = req.body || {};
  if (!client_id || !barber_id || !service_id || !start_at || !end_at) {
    return res.status(400).json({ error: 'Campos obrigatórios: client_id, barber_id, service_id, start_at, end_at' });
  }
  if (hasConflict(barber_id, start_at, end_at)) {
    return res.status(409).json({ error: 'Conflito de horário para o barbeiro' });
  }
  const info = db.prepare('INSERT INTO appointments (client_id, barber_id, service_id, start_at, end_at, notes) VALUES (?, ?, ?, ?, ?, ?)')
    .run(client_id, barber_id, service_id, start_at, end_at, notes || null);
  const created = db.prepare('SELECT * FROM appointments WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/:id', (req, res) => {
  const current = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Agendamento não encontrado' });
  const { client_id, barber_id, service_id, start_at, end_at, notes, status } = req.body || {};
  const newBarberId = barber_id ?? current.barber_id;
  const newStart = start_at ?? current.start_at;
  const newEnd = end_at ?? current.end_at;
  if (hasConflict(newBarberId, newStart, newEnd, current.id)) {
    return res.status(409).json({ error: 'Conflito de horário para o barbeiro' });
  }
  db.prepare('UPDATE appointments SET client_id = ?, barber_id = ?, service_id = ?, start_at = ?, end_at = ?, notes = ?, status = ? WHERE id = ?')
    .run(client_id ?? current.client_id,
         newBarberId,
         service_id ?? current.service_id,
         newStart,
         newEnd,
         notes ?? current.notes,
         status ?? current.status,
         req.params.id);
  const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Agendamento não encontrado' });
  res.status(204).send();
});

module.exports = router;