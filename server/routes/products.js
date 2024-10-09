const express = require('express');
const multer = require('multer');
const sharp = require('sharp')
const router = express.Router();
const pool = require('../db');
const path = require('path');
const fs = require('fs');

// Middleware


// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
});

// POST request to add a product
router.post('/', upload.single('product_image'), async (req, res) => {
  try {
    const { product_name, description, price, category_id, stock } = req.body;
    let product_image = req.file ? req.file.path : null;

    // Validate required fields
    if (!product_name || !description || !price || !category_id || !stock) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Handle image resizing if provided
    if (product_image) {
      const parsedPath = path.parse(product_image);
      const resizedImagePath = `${parsedPath.dir}/${parsedPath.name}-resized${parsedPath.ext}`;
      await sharp(product_image)
        .resize({ width: 1280, height: 860 })
        .jpeg({ quality: 90 })
        .toFile(resizedImagePath);
      product_image = resizedImagePath;
    }

    // Insert into the database
    const query = `
      INSERT INTO products (product_name, description, product_image, price, category_id, stock)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    const values = [product_name, description, product_image, price, category_id, stock];
    const result = await pool.query(query, values);

    res.status(201).json({
      message: 'Product added successfully!',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding product:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Get all products
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Products');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a single product
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM Products WHERE product_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update product by ID route
router.put('/:product_id', upload.single('product_image'), async (req, res) => {
  const { product_id } = req.params;
  const { product_name, description, price, category_id, stock } = req.body;
  const product_image = req.file ? req.file.path : null;

  try {
    // First, delete the old image file if a new image is uploaded
    if (product_image) {
      const productResult = await pool.query('SELECT product_image FROM products WHERE product_id = $1', [product_id]);
      if (productResult.rows.length > 0 && productResult.rows[0].product_image) {
        fs.unlink(path.join(__dirname, '..', productResult.rows[0].product_image), (err) => {
          if (err) console.error('Error deleting old image file:', err);
        });
      }
    }

    // Update the product in the database
    const result = await pool.query(
      `UPDATE products 
       SET product_name = $1, description = $2, product_image = $3, price = $4, category_id = $5, stock = $6, updated_at = $7
       WHERE product_id = $8 
       RETURNING *`,
      [product_name, description, product_image, price, category_id, stock, new Date(), product_id]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete product by ID route
router.delete('/:product_id', async (req, res) => {
  const { product_id } = req.params;

  try {
    // Fetch the product to get the image path
    const productResult = await pool.query('SELECT product_image FROM products WHERE product_id = $1', [product_id]);

    if (productResult.rows.length > 0) {
      const productImagePath = productResult.rows[0].product_image;

      // Log the image path to ensure it's correct
      console.log('Image path to delete:', productImagePath);

      // If the product has an image, delete the file
      if (productImagePath) {
        const fullPath = path.join(__dirname, '..', productImagePath);

        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error('Error deleting image file:', err);
            return res.status(500).json({ error: 'Error deleting image file' });
          } else {
            console.log('Image file deleted successfully');
          }
        });
      }
    } else {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Then, delete the product from the database
    await pool.query('DELETE FROM products WHERE product_id = $1', [product_id]);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error during product deletion:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH request to update a product partially
router.patch('/:product_id', upload.single('product_image'), async (req, res) => {
  const { product_id } = req.params;  // Use product_id here, not id
  const { product_name, description, price, category_id, stock } = req.body;
  const product_image = req.file ? req.file.path : null;

  try {
    const existingProductQuery = 'SELECT * FROM products WHERE product_id = $1';
    const existingProduct = await pool.query(existingProductQuery, [product_id]);

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedProduct = {
      product_name: product_name || existingProduct.rows[0].product_name,
      description: description || existingProduct.rows[0].description,
      product_image: product_image || existingProduct.rows[0].product_image,
      price: price || existingProduct.rows[0].price,
      category_id: category_id || existingProduct.rows[0].category_id,
      stock: stock || existingProduct.rows[0].stock
    };

    const query = `
      UPDATE products
      SET product_name = $1, description = $2, product_image = $3, price = $4, category_id = $5, stock = $6
      WHERE product_id = $7 RETURNING *;
    `;
    const values = [
      updatedProduct.product_name, 
      updatedProduct.description, 
      updatedProduct.product_image, 
      updatedProduct.price, 
      updatedProduct.category_id, 
      updatedProduct.stock, 
      product_id
    ];

    const result = await pool.query(query, values);

    res.status(200).json({
      message: 'Product updated successfully!',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




module.exports = router;