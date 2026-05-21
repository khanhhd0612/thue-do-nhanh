const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 10;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/tmp/uploads');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new ApiError(400, 'Chỉ chấp nhận ảnh JPG, PNG, WEBP'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_FILES
    }
});

/**
 * Upload nhiều ảnh sản phẩm (tối đa 10)
 */
const uploadProductImages = upload.array('images', MAX_FILES);

/**
 * Upload 1 ảnh (avatar, category image...)
 */
const uploadSingleImage = upload.single('image');

/**
 * Middleware wrapper để catch multer error thành ApiError
 */
const handleMulterError = (uploadFn) => (req, res, next) => {
    uploadFn(req, res, (err) => {
        if (!err) return next();

        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return next(new ApiError(400, `Ảnh không được vượt quá ${MAX_FILE_SIZE / 1024 / 1024}MB`));
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return next(new ApiError(400, `Tối đa ${MAX_FILES} ảnh mỗi lần upload`));
            }
            return next(new ApiError(400, err.message));
        }

        next(err);
    });
};

module.exports = {
    uploadProductImages: handleMulterError(uploadProductImages),
    uploadSingleImage: handleMulterError(uploadSingleImage)
};