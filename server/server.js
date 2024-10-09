const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();



const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));






//Routes
const userRoutes = require('./routes/users');
app.use('/users', userRoutes);

const productRoutes = require('./routes/products');
app.use('/products', productRoutes);

const categoriesRoutes = require('./routes/categories');
app.use('/categories', categoriesRoutes);

const cartRoutes = require('./routes/cart');
app.use('/cart', cartRoutes);

const cartItemsRoutes = require('./routes/cartItems');
app.use('/cartItems', cartItemsRoutes);

const ordersRoutes = require('./routes/orders');
app.use('/orders', ordersRoutes);



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
