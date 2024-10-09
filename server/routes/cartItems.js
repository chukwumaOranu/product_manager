const express = require('express');
const router = express.Router();
const pool = require('../db');



// POST a new cart item
router.post('/', async (req, res) => {
    const { product_id, price, product_name, cart_image } = req.body;
    try {
        const newCartItem = await pool.query(
            'INSERT INTO CartItems (product_id, price, product_name, cart_image) VALUES ($1, $2, $3, $4) RETURNING *',
            [product_id, price, product_name, cart_image]
        );
        res.status(201).json(newCartItem.rows[0]);
    } catch (err) {
        console.error('Error creating cart item:', err);
        res.status(500).send('Error creating cart item');
    }
});

// GET all cart items
router.get('/', async (req, res) => {
    try {
        const cartItems = await pool.query('SELECT * FROM CartItems');
        res.json(cartItems.rows);
    } catch (err) {
        console.error('Error getting cart items:', err);
        res.status(500).send('Error getting cart items');
    }
});

// GET a specific cart item by cart_item_id
router.get('/:cart_item_id', async (req, res) => {
    const { cart_item_id } = req.params;
    try {
        const cartItem = await pool.query('SELECT * FROM CartItems WHERE cart_item_id = $1', [
            cart_item_id]);
        if (cartItem.rows.length === 0) {
            return res.status(404).send('Cart item not found');
        }
        res.json(cartItem.rows[0]);
    } catch (err) {
        console.error('Error getting cart item:', err);
        res.status(500).send('Error getting cart item');
    }
});

// PUT (replace) a cart item
router.put('/:cart_item_id', async (req, res) => {
    const { cart_item_id } = req.params;
    const { cart_id, product_id, quantity } = req.body;
    try {
        const updatedCartItem = await pool.query(
            'UPDATE CartItems SET cart_id = $1, product_id = $2, quantity = $3 WHERE cart_item_id = $4 RETURNING *',
            [cart_id, product_id, quantity, cart_item_id]
        );
        if (updatedCartItem.rows.length === 0) {
            return res.status(404).send('Cart item not found');
        }
        res.json(updatedCartItem.rows[0]);
    } catch (err) {
        console.error('Error updating cart item:', err);
        res.status(500).send('Error updating cart item');
    }
});

// PATCH (partially update) a cart item
router.patch('/:cart_item_id', async (req, res) => {
    const { cart_item_id } = req.params;
    const { cart_id, product_id, quantity } = req.body;
    try {
        const updatedCartItem = await pool.query(
            'UPDATE CartItems SET cart_id = COALESCE($1, cart_id), product_id = COALESCE($2, product_id), quantity = COALESCE($3, quantity) WHERE cart_item_id = $4 RETURNING *',
            [cart_id, product_id, quantity, cart_item_id]
        );
        if (updatedCartItem.rows.length === 0) {
            return res.status(404).send('Cart item not found');
        }
        res.json(updatedCartItem.rows[0]);
    } catch (err) {
        console.error('Error updating cart item:', err);
        res.status(500).send('Error updating cart item');
    }
});

// DELETE a cart item
router.delete('/:cart_item_id', async (req, res) => {
    const { cart_item_id } = req.params;
    try {
        const deletedCartItem = await pool.query(
            'DELETE FROM CartItems WHERE cart_item_id = $1 RETURNING *',
            [cart_item_id]
        );
        if (deletedCartItem.rows.length === 0) {
            return res.status(404).send('Cart item not found');
        }
        res.json({ message: 'Cart item deleted successfully' });
    } catch (err) {
        console.error('Error deleting cart item:', err);
        res.status(500).send('Error deleting cart item');
    }
});

module.exports = router;