const catchAsync = require('../utils/catchAsync');
const productService = require('../services/product.service');

const createProduct = catchAsync(async (req, res) => {
    const product = await productService.createProduct(req.body);

    return res.status(201).json({
        status: 'success',
        message: 'Tạo sản phẩm thành công',
        data: { product }
    });
});

const getProducts = catchAsync(async (req, res) => {
    const result = await productService.getProducts(req.query);

    return res.status(200).json({
        status: 'success',
        message: 'Lấy danh sách sản phẩm thành công',
        data: result
    });
});

const getProductById = catchAsync(async (req, res) => {
    const product = await productService.getProductById(req.params.productId);

    return res.status(200).json({
        status: 'success',
        message: 'Lấy sản phẩm thành công',
        data: { product }
    });
});

const getProductBySlug = catchAsync(async (req, res) => {
    const { product, variants } = await productService.getProductBySlug(req.params.slug);

    return res.status(200).json({
        status: 'success',
        message: 'Lấy sản phẩm thành công',
        data: { product, variants }
    });
});

const updateProduct = catchAsync(async (req, res) => {
    const product = await productService.updateProduct(req.params.productId, req.body);

    return res.status(200).json({
        status: 'success',
        message: 'Cập nhật sản phẩm thành công',
        data: { product }
    });
});

const deleteProduct = catchAsync(async (req, res) => {
    await productService.deleteProduct(req.params.productId);

    return res.status(200).json({
        status: 'success',
        message: 'Xóa sản phẩm thành công'
    });
});

const uploadProductImages = catchAsync(async (req, res) => {
    const { thumbnailIndex } = req.body;
    const product = await productService.uploadProductImages(
        req.params.productId,
        req.files,
        thumbnailIndex
    );

    return res.status(200).json({
        status: 'success',
        message: 'Upload ảnh thành công',
        data: { product }
    });
});

const deleteProductImage = catchAsync(async (req, res) => {
    const { imageUrl } = req.body;
    const product = await productService.deleteProductImage(req.params.productId, imageUrl);

    return res.status(200).json({
        status: 'success',
        message: 'Xóa ảnh thành công',
        data: { product }
    });
});

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    getProductBySlug,
    updateProduct,
    deleteProduct,
    uploadProductImages,
    deleteProductImage
};