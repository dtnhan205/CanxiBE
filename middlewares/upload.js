const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Debug log để kiểm tra Multer
console.log('Multer loaded:', !!multer);

// Cloudinary storage cho sản phẩm
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '') || 'jpg';
    return {
      folder: 'products',
      format: ext,
      resource_type: 'image',
      public_id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    };
  }
});

// Lọc file hợp lệ (chỉ ảnh)
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
  const allowedImageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedImageTypes.includes(file.mimetype) && allowedImageExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ hỗ trợ file ảnh (jpg, jpeg, png, gif, webp, svg)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 4 // Giới hạn tối đa 4 file ảnh
  }
});

// Debug log để kiểm tra upload
console.log('Upload middleware initialized:', !!upload);

// Middleware cho sản phẩm (tối đa 4 ảnh)
const productUpload = upload.array('images', 4);

// Middleware lỗi multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Tệp vượt quá kích thước cho phép (100MB)!' });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Số lượng tệp vượt quá giới hạn (4 tệp)!' });
    } else {
      return res.status(400).json({ error: `Lỗi upload file: ${err.message}` });
    }
  } else if (err && err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

module.exports = {
  productUpload,
  handleMulterError
};