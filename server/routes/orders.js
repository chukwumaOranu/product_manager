const express = require('express');
const router = express.Router();
const pool = require('../db');

// Create a new order
router.post('/', async (req, res) => {
  const { user_id, total_amount, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *',
      [user_id, total_amount, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all orders
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Orders');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a single order
router.get('/:order_id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM Orders WHERE order_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error retrieving order:', error.message);
    res.status(500).send('Server Error');
  }
});

// Update an order
router.put('/:order_id', async (req, res) => {
  const { order_id } = req.params;
  const { user_id, total_amount, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Orders SET user_id = $1, total_amount = $2, status = $3 WHERE order_id = $4 RETURNING *',
      [user_id, total_amount, status, order_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Patch an order

router.patch('/:id', async(req, res) => {
    const { order_id } = req.params;
    const { user_id, total_amount, status } = req.body;

    try {
        const existingOrder = await pool.query('SELECT * FROM Orders WHERE order_id = $1', [id]);

    if (existingOrder.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updatedFields = {
      user_id: user_id || existingOrder.rows[0].user_id,
      total_amount: total_amount || existingOrder.rows[0].total_amount,
      status: status || existingOrder.rows[0].status
    };

    const updatedOrder = await pool.query(
      'UPDATE Orders SET user_id = $1, total_amount = $2, status = $3 WHERE order_id = $5 RETURNING *',
      [updatedFields.user_id, updatedFields.total_amount, updatedFields.status, order_id]
    );

    res.json(updatedOrder.rows[0]);

    }catch(error){
        console.error('Error updating order:', error.message);
        res.status(500).send('Server Error');
    }
})

// Delete an order
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM Orders WHERE order_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
