const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'ID sản phẩm là bắt buộc']
  },
  productName: {
    type: String,
    required: [true, 'Tên sản phẩm là bắt buộc'],
    trim: true
  },
  boxCount: {
    type: Number,
    required: [true, 'Số lượng hộp là bắt buộc'],
    min: [1, 'Số lượng hộp phải lớn hơn 0']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Tổng giá là bắt buộc'],
    min: [0, 'Tổng giá không được nhỏ hơn 0']
  },
  fullName: {
    type: String,
    required: [true, 'Họ và tên là bắt buộc'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Số điện thoại là bắt buộc'],
    trim: true,
    match: [/^\d{10,11}$/, 'Số điện thoại phải có 10 hoặc 11 chữ số']
  },
  address: {
    type: String,
    required: [true, 'Địa chỉ là bắt buộc'],
    trim: true
  },
  note: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    required: [true, 'Trạng thái đơn hàng là bắt buộc']
  }
}, {
  timestamps: true
});

// Ánh xạ giá trị enum sang nhãn tiếng Việt
orderSchema.methods.getStatusLabel = function() {
  const statusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipped: 'Đang vận chuyển',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy'
  };
  return statusLabels[this.status] || this.status;
};

module.exports = mongoose.model('Order', orderSchema);