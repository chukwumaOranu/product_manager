const express = require('express');
const router = express.Router();
const pool = require('../db');


// Create a new cart
router.post('/', async (req, res) => {
  const { user_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Carts (user_id) VALUES ($1) RETURNING *',
      [user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all carts
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Carts');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a single cart
router.get('/:cart_id', async (req, res) => {
  const { cart_id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM Carts WHERE cart_id = $1', [cart_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a cart
router.put('/:cart_id', async (req, res) => {
  const { cart_id } = req.params;
  const { user_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Carts SET user_id = $1 WHERE cart_id = $2 RETURNING *',
      [user_id, cart_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a cart
router.delete('/:cart_id', async (req, res) => {
  const { cart_id } = req.params;
  try {
    const result = await pool.query('DELETE FROM Carts WHERE cart_id = $1 RETURNING *', [cart_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
