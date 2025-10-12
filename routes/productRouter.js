const express = require('express');
const router = express.Router();
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const { productUpload, handleMulterError } = require('../middlewares/upload');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  Status
} = require('../controllers/productController');

// Route công khai (cho cả người dùng không đăng nhập)
router.get('/', getProducts);
router.get('/:id', getProductById);

// Route yêu cầu admin
router.post('/', authMiddleware, isAdmin, productUpload, handleMulterError, createProduct);
router.put('/:id', authMiddleware, isAdmin, productUpload, handleMulterError, updateProduct);
router.delete('/:id', authMiddleware, isAdmin, deleteProduct);
router.patch('/:id', authMiddleware, isAdmin, Status);

module.exports = router;