const Product = require('../models/product');

// Tạo sản phẩm mới (Chỉ admin)
const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => file.path); // Lấy đường dẫn ảnh từ upload
    } else {
      return res.status(400).json({ error: 'Ít nhất 1 hình ảnh sản phẩm là bắt buộc' });
    }
    const product = new Product(productData);
    await product.save();
    res.status(201).json({ message: 'Tạo sản phẩm thành công', product });
  } catch (err) {
    console.error('Lỗi khi tạo sản phẩm:', err);
    res.status(400).json({ error: err.message || 'Không thể tạo sản phẩm' });
  }
};

// Lấy danh sách sản phẩm (không cần đăng nhập)
const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = search 
      ? { name: { $regex: search, $options: 'i' } } 
      : {};

    const products = await Product.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.status(200).json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', err);
    res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Lấy chi tiết sản phẩm theo ID
const getProductById = async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const query = isAdmin 
      ? { _id: req.params.id } 
      : { _id: req.params.id, status: 'active' };

    const product = await Product.findOne(query);
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại hoặc không hiển thị' });
    }
    res.status(200).json(product);
  } catch (err) {
    console.error('Lỗi khi lấy sản phẩm:', err);
    res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Cập nhật sản phẩm (Chỉ admin)
const updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => file.path);
    }

    // Kiểm tra giá trước khi lưu
    const originalPrice = parseFloat(updateData.originalPrice);
    const discountedPrice = parseFloat(updateData.discountedPrice);
    if (discountedPrice !== undefined && originalPrice !== undefined && discountedPrice > originalPrice) {
      return res.status(400).json({ error: 'Giá giảm không được lớn hơn giá gốc' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }
    res.status(200).json({ message: 'Cập nhật sản phẩm thành công', product });
  } catch (err) {
    console.error('Lỗi khi cập nhật sản phẩm:', err);
    res.status(400).json({ error: err.message || 'Không thể cập nhật sản phẩm' });
  }
};

// Xóa sản phẩm (Chỉ admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }
    res.status(200).json({ message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    console.error('Lỗi khi xóa sản phẩm:', err);
    res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Chuyển đổi trạng thái ẩn/hiện sản phẩm (Chỉ admin)
const Status = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái phải là "active" hoặc "inactive"' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }
    res.status(200).json({ message: 'Cập nhật trạng thái sản phẩm thành công', product });
  } catch (err) {
    console.error('Lỗi khi thay đổi trạng thái sản phẩm:', err);
    res.status(400).json({ error: err.message || 'Không thể cập nhật trạng thái sản phẩm' });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  Status,
  deleteProduct
};