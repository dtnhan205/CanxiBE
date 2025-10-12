const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên sản phẩm là bắt buộc'],
    trim: true,
    maxlength: [100, 'Tên sản phẩm không được vượt quá 100 ký tự']
  },
  stock: {
    type: Number,
    required: [true, 'Số lượng tồn kho là bắt buộc'],
    min: [0, 'Số lượng tồn kho không được nhỏ hơn 0'],
    default: 0
  },
  sold: {
    type: Number,
    default: 0,
    min: [0, 'Số lượng đã bán không được nhỏ hơn 0']
  },
  origin: {
    type: String,
    required: [true, 'Dòng sản phẩm của nước là bắt buộc'],
    trim: true,
    maxlength: [50, 'Tên nước không được vượt quá 50 ký tự']
  },
  productCode: {
    type: String,
    required: [true, 'Mã sản phẩm là bắt buộc'],
    unique: true,
    trim: true,
    maxlength: [20, 'Mã sản phẩm không được vượt quá 20 ký tự']
  },
  usage: {
    type: String,
    required: [true, 'Công dụng là bắt buộc'],
    trim: true
  },
  originalPrice: {
    type: Number,
    required: [true, 'Giá gốc sản phẩm là bắt buộc'],
    min: [0, 'Giá gốc không được nhỏ hơn 0']
  },
  discountedPrice: {
    type: Number,
    min: [0, 'Giá giảm không được nhỏ hơn 0']
  },
  note: {
    type: String,
    trim: true
  },
  specification: {
    type: String,
    required: [true, 'Quy cách là bắt buộc'],
    trim: true,
    maxlength: [200, 'Quy cách không được vượt quá 200 ký tự']
  },
  description: {
    type: String,
    trim: true
  },
  additionalInfo: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    required: [true, 'Trạng thái sản phẩm là bắt buộc']
  },
  images: {
    type: [String],
    required: [true, 'Ít nhất 1 hình ảnh sản phẩm là bắt buộc'],
    validate: {
      validator: function(v) {
        return v.length >= 1 && v.length <= 4;
      },
      message: 'Số lượng hình ảnh phải từ 1 đến 4'
    }
  }
}, {
  timestamps: true
});

productSchema.index({ status: 1 });

module.exports = mongoose.model('Product', productSchema);