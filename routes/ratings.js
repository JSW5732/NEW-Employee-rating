const express = require('express');
const router = express.Router();
const db = require('../db');

// Statements
const insertStmt = db.prepare(`
  INSERT INTO ratings
  (employee_name, employee_id, position, department, reviewer, review_period_start, review_period_end, overall_rating, strengths, improvements, goals)
  VALUES (@employee_name, @employee_id, @position, @department, @reviewer, @review_period_start, @review_period_end, @overall_rating, @strengths, @improvements, @goals)
`);
const selectAll = db.prepare('SELECT * FROM ratings ORDER BY created_at DESC');
const selectById = db.prepare('SELECT * FROM ratings WHERE id = ?');
const updateStmt = db.prepare(`
  UPDATE ratings
  SET employee_name = @employee_name, employee_id = @employee_id, position = @position, department = @department,
      reviewer = @reviewer, review_period_start = @review_period_start, review_period_end = @review_period_end,
      overall_rating = @overall_rating, strengths = @strengths, improvements = @improvements, goals = @goals
  WHERE id = @id
`);
const deleteStmt = db.prepare('DELETE FROM ratings WHERE id = ?');

// GET all
router.get('/', (req, res) => {
  const rows = selectAll.all();
  res.json(rows);
});

// GET by id
router.get('/:id', (req, res) => {
  const row = selectById.get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// POST create
router.post('/', (req, res) => {
  const payload = {
    employee_name: req.body.employee_name || '',
    employee_id: req.body.employee_id || '',
    position: req.body.position || '',
    department: req.body.department || '',
    reviewer: req.body.reviewer || '',
    review_period_start: req.body.review_period_start || '',
    review_period_end: req.body.review_period_end || '',
    overall_rating: req.body.overall_rating || '',
    strengths: req.body.strengths || '',
    improvements: req.body.improvements || '',
    goals: req.body.goals || ''
  };
  const info = insertStmt.run(payload);
  const created = selectById.get(info.lastInsertRowid);
  res.status(201).json(created);
});

// PUT update
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = selectById.get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const payload = {
    id,
    employee_name: req.body.employee_name || existing.employee_name,
    employee_id: req.body.employee_id || existing.employee_id,
    position: req.body.position || existing.position,
    department: req.body.department || existing.department,
    reviewer: req.body.reviewer || existing.reviewer,
    review_period_start: req.body.review_period_start || existing.review_period_start,
    review_period_end: req.body.review_period_end || existing.review_period_end,
    overall_rating: req.body.overall_rating || existing.overall_rating,
    strengths: req.body.strengths || existing.strengths,
    improvements: req.body.improvements || existing.improvements,
    goals: req.body.goals || existing.goals
  };

  updateStmt.run(payload);
  const updated = selectById.get(id);
  res.json(updated);
});

// DELETE
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = selectById.get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  deleteStmt.run(id);
  res.status(204).end();
});

module.exports = router;
