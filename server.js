const express = require('express');
const session = require('express-session');
const app = express();

require('./database');

app.use(express.json());
app.use(session({
  secret: 'meal-ticket-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static('public'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/attendant', require('./routes/attendant'));
app.use('/api/staff', require('./routes/staff'));

app.listen(3000, () => {
  console.log('Running on http://localhost:3000');
});