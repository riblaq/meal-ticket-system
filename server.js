const express = require('express');
const session = require('express-session');
const app = express();

require('./database');

if (!process.env.SESSION_SECRET) {
  console.warn('WARNING: SESSION_SECRET is not set. Using an insecure development secret.');
}

app.set('trust proxy', 1); // Render sits behind a proxy

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));
app.use(express.static('public'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/attendant', require('./routes/attendant'));
app.use('/api/staff', require('./routes/staff'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Running on port ' + PORT);
});