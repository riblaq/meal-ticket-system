const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireRole('admin'));

// List all users
router.get('/users', (req, res) => {
  const users = db.prepare(
    'SELECT id, full_name, staff_id, role FROM users ORDER BY role, full_name'
  ).all();
  res.json(users);
});

// Add a new user
router.post('/users', (req, res) => {
  const { full_name, staff_id, password, role } = req.body;

  if (!full_name || !staff_id || !password || !role) {
    return res.status(400).json({ error: 'Please fill in all fields' });
  }
  if (!['admin', 'attendant', 'staff'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const exists = db.prepare('SELECT id FROM users WHERE staff_id = ?').get(staff_id.trim());
  if (exists) {
    return res.status(400).json({ error: 'That Staff ID already exists' });
  }

  const hashed = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO users (full_name, staff_id, password, role) VALUES (?, ?, ?, ?)'
  ).run(full_name.trim(), staff_id.trim(), hashed, role);

  res.json({ message: 'User added successfully' });
});

// Issue tickets (one staff member, or all staff) for a date
router.post('/tickets', (req, res) => {
  const { user_id, meal_date } = req.body;

  if (!user_id || !meal_date) {
    return res.status(400).json({ error: 'Choose a staff member and a date' });
  }

  const insert = db.prepare('INSERT OR IGNORE INTO tickets (user_id, meal_date) VALUES (?, ?)');
  let count = 0;

  if (user_id === 'all') {
    const staff = db.prepare("SELECT id FROM users WHERE role = 'staff'").all();
    for (const person of staff) {
      count += insert.run(person.id, meal_date).changes;
    }
  } else {
    const person = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'staff'").get(user_id);
    if (!person) {
      return res.status(400).json({ error: 'Staff member not found' });
    }
    count = insert.run(person.id, meal_date).changes;
  }

  res.json({ message: count + ' ticket(s) issued for ' + meal_date });
});

// See all tickets for one date
router.get('/tickets', (req, res) => {
  const date = req.query.date;
  if (!date) {
    return res.status(400).json({ error: 'Choose a date' });
  }

  const tickets = db.prepare(`
        SELECT users.full_name, users.staff_id, tickets.status, tickets.redeemed_at,
      CASE
        WHEN tickets.status = 'redeemed' THEN 'used'
        WHEN tickets.meal_date < date('now', 'localtime') THEN 'not used'
        ELSE 'issued'
      END AS label
    FROM tickets
    JOIN users ON users.id = tickets.user_id
    WHERE tickets.meal_date = ?
    ORDER BY users.full_name
  `).all(date);

  res.json(tickets);
});
// Delete a user (and their tickets)
router.delete('/users/:id', (req, res) => {
  const id = Number(req.params.id);

  if (id === req.session.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const remove = db.transaction(() => {
    db.prepare('UPDATE tickets SET redeemed_by = NULL WHERE redeemed_by = ?').run(id);
    db.prepare('DELETE FROM tickets WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  });
  remove();

  res.json({ message: 'User deleted' });
});
module.exports = router;