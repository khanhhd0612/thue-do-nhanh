const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const productValidation = require('../../validations/product.validation');
const productController = require('../../controllers/product.controller');
const { uploadProductImages } = require('../../middlewares/upload');
const productVariantRoute = require('./productVariant.route');

const router = express.Router();

// Public
router.get('/', validate(productValidation.queryProducts), productController.getProducts);
router.get('/slug/:slug', validate(productValidation.getProductBySlug), productController.getProductBySlug);
router.get('/:productId', validate(productValidation.getProduct), productController.getProductById);

// Admin only
router.post('/', auth('admin'), validate(productValidation.createProduct), productController.createProduct);
router.patch('/:productId', auth('admin'), validate(productValidation.updateProduct), productController.updateProduct);
router.delete('/:productId', auth('admin'), validate(productValidation.deleteProduct), productController.deleteProduct);

// Upload ảnh (admin only — multer trước, validate sau vì multipart)
router.post('/:productId/images', auth('admin'), uploadProductImages, validate(productValidation.uploadProductImages), productController.uploadProductImages);
router.delete('/:productId/images', auth('admin'), validate(productValidation.deleteProductImage), productController.deleteProductImage);

router.use('/:productId/variants', productVariantRoute);

module.exports = router;