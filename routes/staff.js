const express = require('express');
const db = require('../database');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireRole('staff'));

// This person's own tickets, newest first
router.get('/tickets', (req, res) => {
  const tickets = db.prepare(`
    SELECT meal_date, status, redeemed_at
    FROM tickets
    WHERE user_id = ?
    ORDER BY meal_date DESC
  `).all(req.session.user.id);

  res.json(tickets);
});

module.exports = router;