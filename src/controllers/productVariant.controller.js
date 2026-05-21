const catchAsync = require('../utils/catchAsync');
const productVariantService = require('../services/productVariant.service');

const createVariant = catchAsync(async (req, res) => {
    const variant = await productVariantService.createVariant(req.params.productId, req.body);

    return res.status(201).json({
        status: 'success',
        message: 'Tạo variant thành công',
        data: { variant }
    });
});

const getVariantsByProduct = catchAsync(async (req, res) => {
    const variants = await productVariantService.getVariantsByProduct(req.params.productId);

    return res.status(200).json({
        status: 'success',
        message: 'Lấy danh sách variant thành công',
        data: { variants }
    });
});

const updateVariant = catchAsync(async (req, res) => {
    const variant = await productVariantService.updateVariant(req.params.variantId, req.body);

    return res.status(200).json({
        status: 'success',
        message: 'Cập nhật variant thành công',
        data: { variant }
    });
});

const deleteVariant = catchAsync(async (req, res) => {
    await productVariantService.deleteVariant(req.params.variantId);

    return res.status(200).json({
        status: 'success',
        message: 'Vô hiệu hóa variant thành công'
    });
});

module.exports = {
    createVariant,
    getVariantsByProduct,
    updateVariant,
    deleteVariant
};