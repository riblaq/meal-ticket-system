const express = require('express');
const db = require('../database');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireRole('attendant'));

// Today's date in YYYY-MM-DD, using this computer's local time
function today() {
  return new Date().toLocaleDateString('en-CA');
}

// Search staff by name or Staff ID, and show today's ticket status
router.get('/search', (req, res) => {
  const q = '%' + (req.query.q || '') + '%';

  const people = db.prepare(`
    SELECT users.id, users.full_name, users.staff_id,
      (SELECT status FROM tickets
        WHERE tickets.user_id = users.id AND tickets.meal_date = ?) AS status
    FROM users
    WHERE users.role = 'staff' AND (users.full_name LIKE ? OR users.staff_id LIKE ?)
    ORDER BY users.full_name
    LIMIT 50
  `).all(today(), q, q);

  res.json(people);
});

// Give a meal: mark today's ticket as redeemed
router.post('/redeem', (req, res) => {
  const { user_id } = req.body;

  const ticket = db.prepare(
    'SELECT id, status FROM tickets WHERE user_id = ? AND meal_date = ?'
  ).get(user_id, today());

  if (!ticket) {
    return res.status(400).json({ error: 'This person has no ticket for today' });
  }
  if (ticket.status === 'redeemed') {
    return res.status(400).json({ error: 'This ticket has already been used' });
  }

  const now = today() + ' ' + new Date().toLocaleTimeString('en-GB');

  db.prepare(`
    UPDATE tickets SET status = 'redeemed', redeemed_by = ?, redeemed_at = ?
    WHERE id = ? AND status = 'unused'
  `).run(req.session.user.id, now, ticket.id);

  res.json({ message: 'Meal given. Ticket marked as used.' });
});

module.exports = router;