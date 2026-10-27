const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');

const router = express.Router();

// Login
router.post('/login', (req, res) => {
  const { staff_id, password } = req.body;

  if (!staff_id || !password) {
    return res.status(400).json({ error: 'Enter your Staff ID and password' });
  }

  const user = db.prepare('SELECT * FROM users WHERE staff_id = ?').get(staff_id.trim());

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Wrong Staff ID or password' });
  }

  req.session.user = {
    id: user.id,
    full_name: user.full_name,
    role: user.role
  };

  res.json({ role: user.role });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

// Who is logged in right now?
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

module.exports = router;