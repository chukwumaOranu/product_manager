const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

require('dotenv').config();
const secretKey = process.env.SECRET_KEY


const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    console.log('No authorization header');
    return res.status(403).send({ message: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('No token found');
    return res.status(403).send({ message: 'No token provided.' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(500).send({ message: 'Failed to authenticate token.' });
    }
    console.log('Token decoded:', decoded); // Log the decoded token
    req.user_id = decoded.id;
    next();
  });
};

// Create a new user
router.post('/', async (req, res) => {
  const { username, password_hash, email } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password_hash, 12);
    const result = await pool.query(
      'INSERT INTO Users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING *',
      [username, hashedPassword, email]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const query = 'SELECT * FROM users WHERE username = $1';
    const { rows } = await pool.query(query, [username]);

    if (rows.length > 0) {
      const user = rows[0];
      const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

      if (isPasswordMatch) {
        const token = jwt.sign({ id: user.user_id }, secretKey, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', user, token });
      } else {
        res.status(401).json({ error: 'Invalid username or password.' });
      }
    } else {
      res.status(401).json({ error: 'Invalid username or password.' });
    }
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'An error occurred while checking user credentials.' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  // For JWT, there's no server-side token invalidation, so just return success
  res.status(200).json({ message: 'Logout successful' });
});

// Get all users
router.get('/', verifyToken,async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Users');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/info', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Users');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a single user
router.get('/:user_id', verifyToken, async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM Users WHERE user_id = $1', [user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a user
router.put('/:user_id', verifyToken, async (req, res) => {
  const { user_id } = req.params;
  const { username, password_hash, email } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password_hash, 12);
    const result = await pool.query(
      'UPDATE Users SET username = $1, password_hash = $2, email = $3 WHERE user_id = $4 RETURNING *',
      [username, hashedPassword, email, user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a user
router.delete('/:user_id', verifyToken, async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query('DELETE FROM Users WHERE user_id = $1 RETURNING *', [user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
