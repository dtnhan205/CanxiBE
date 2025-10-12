const express = require('express');
const router = express.Router();
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const { createOrder, getOrders, getOrderById, updateOrderStatus, deleteOrder } = require('../controllers/orderController');

// Route không yêu cầu đăng nhập
router.post('/', createOrder);

// Route yêu cầu admin
router.get('/', authMiddleware, isAdmin, getOrders);
router.get('/:id', authMiddleware, isAdmin, getOrderById);
router.put('/:id/status', authMiddleware, isAdmin, updateOrderStatus);
router.delete('/:id', authMiddleware, isAdmin, deleteOrder);

module.exports = router;