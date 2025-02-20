const express = require('express');
const db = require('./db');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Pet Matchmaker API');
});

// Test database connection
app.get('/api/test-db', (req, res) => {
  db.query('SELECT 1', (err, results) => {
    if (err) {
      console.error('Database connection failed:', err);
      return res.status(500).json({ message: 'Database connection failed' });
    }
    res.json({ message: 'Database connection successful' });
  });
});

// Get all questions
app.get('/api/questions', (req, res) => {
  const query = 'SELECT question FROM questions';
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});