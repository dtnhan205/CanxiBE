const mongoose = require('mongoose');
const Product = require('../models/product');
const Order = require('../models/order');

// Tạo đơn hàng mới
const createOrder = async (req, res) => {
  try {
    const { productId, productName, boxCount, totalPrice, fullName, phone, address, note } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!productId || !productName || !boxCount || !totalPrice || !fullName || !phone || !address) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin đơn hàng' });
    }

    // Kiểm tra định dạng số điện thoại
    if (!/^\d{10,11}$/.test(phone)) {
      return res.status(400).json({ error: 'Số điện thoại phải có 10 hoặc 11 chữ số' });
    }

    // Kiểm tra số lượng hộp
    if (boxCount < 1) {
      return res.status(400).json({ error: 'Số lượng hộp phải lớn hơn 0' });
    }

    // Kiểm tra sản phẩm tồn tại và đang hoạt động
    const product = await Product.findOne({ _id: productId, status: 'active' });
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại hoặc không hiển thị' });
    }

    // Kiểm tra số lượng tồn kho
    if (product.stock < boxCount) {
      return res.status(400).json({ error: 'Số lượng tồn kho không đủ' });
    }

    // Kiểm tra tổng giá
    const expectedPrice = (product.discountedPrice || product.originalPrice);
    if (totalPrice !== expectedPrice) {
      return res.status(400).json({ error: 'Tổng giá không hợp lệ' });
    }

    // Tạo đơn hàng
    const order = new Order({
      productId,
      productName,
      boxCount,
      totalPrice,
      fullName,
      phone,
      address,
      note
    });

    // Cập nhật số lượng tồn kho và số lượng đã bán
    product.stock -= boxCount;
    product.sold += boxCount;
    await product.save();

    // Lưu đơn hàng
    await order.save();

    res.status(201).json({ message: 'Đặt hàng thành công', order: { ...order.toObject(), statusLabel: order.getStatusLabel() } });
  } catch (err) {
    console.error('Lỗi khi tạo đơn hàng:', err);
    res.status(400).json({ error: err.message || 'Không thể tạo đơn hàng' });
  }
};

// Lấy danh sách đơn hàng (Chỉ admin)
const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = status ? { status } : {};

    const orders = await Order.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 })
      .populate('productId', 'name');

    const ordersWithLabels = orders.map(order => ({
      ...order.toObject(),
      statusLabel: order.getStatusLabel()
    }));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      orders: ordersWithLabels,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách đơn hàng:', err);
    res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Lấy chi tiết đơn hàng theo ID (Chỉ admin)
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('productId', 'name');
    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }
    res.status(200).json({ ...order.toObject(), statusLabel: order.getStatusLabel() });
  } catch (err) {
    console.error('Lỗi khi lấy đơn hàng:', err);
    res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Cập nhật trạng thái đơn hàng (Chỉ admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Kiểm tra trạng thái hợp lệ
    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ. Phải là: Chờ xác nhận, Đã xác nhận, Đang vận chuyển, Đã giao, hoặc Đã hủy' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    // Khôi phục kho nếu hủy đơn và đơn chưa giao
    if (status === 'cancelled' && order.status !== 'cancelled' && order.status !== 'delivered') {
      const product = await Product.findById(order.productId);
      if (product) {
        product.stock += order.boxCount;
        product.sold -= order.boxCount;
        await product.save();
      }
    }

    order.status = status;
    await order.save();

    res.status(200).json({ message: 'Cập nhật trạng thái đơn hàng thành công', order: { ...order.toObject(), statusLabel: order.getStatusLabel() } });
  } catch (err) {
    console.error('Lỗi khi cập nhật trạng thái đơn hàng:', err);
    res.status(400).json({ error: err.message || 'Không thể cập nhật trạng thái đơn hàng' });
  }
};

// Xóa đơn hàng (Chỉ admin)
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    // Khôi phục kho nếu đơn chưa giao
    if (order.status !== 'delivered') {
      const product = await Product.findById(order.productId);
      if (product) {
        product.stock += order.boxCount;
        product.sold -= order.boxCount;
        await product.save();
      }
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Xóa đơn hàng thành công' });
  } catch (err) {
    console.error('Lỗi khi xóa đơn hàng:', err);
    res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder
};