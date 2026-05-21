const ProductVariant = require('../models/productVariant.model');
const InventoryItem = require('../models/inventoryItem.model');
const Product = require('../models/product.model');
const ApiError = require('../utils/ApiError');

const createVariant = async (productId, body) => {
    const product = await Product.findOne({ _id: productId, status: { $ne: 'DELETED' } });
    if (!product) throw new ApiError(404, 'Sản phẩm không tồn tại');

    // Kiểm tra SKU chưa tồn tại
    const existingSku = await ProductVariant.findOne({ sku: body.sku.toUpperCase() });
    if (existingSku) throw new ApiError(409, `SKU "${body.sku}" đã tồn tại`);

    const variant = await ProductVariant.create({ ...body, productId });
    return variant;
};

const getVariantsByProduct = async (productId) => {
    const product = await Product.findOne({ _id: productId, status: { $ne: 'DELETED' } });
    if (!product) throw new ApiError(404, 'Sản phẩm không tồn tại');

    return ProductVariant.find({
        productId,
        status: 'ACTIVE'
    }).sort({ size: 1 });
};

const updateVariant = async (variantId, body) => {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) throw new ApiError(404, 'Variant không tồn tại');

    // Kiểm tra SKU trùng nếu đổi SKU
    if (body.sku && body.sku.toUpperCase() !== variant.sku) {
        const existingSku = await ProductVariant.findOne({
            sku: body.sku.toUpperCase(),
            _id: { $ne: variantId }
        });
        if (existingSku) throw new ApiError(409, `SKU "${body.sku}" đã tồn tại`);
    }

    Object.assign(variant, body);
    await variant.save();
    return variant;
};

const deleteVariant = async (variantId) => {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) throw new ApiError(404, 'Variant không tồn tại');

    const activeItems = await InventoryItem.countDocuments({
        variantId,
        status: { $in: ['RENTING', 'RESERVED'] }
    });

    if (activeItems > 0) {
        throw new ApiError(400, 'Không thể xóa variant đang có item đang thuê hoặc được đặt trước');
    }

    variant.status = 'INACTIVE';
    await variant.save();
    return variant;
};

module.exports = {
    createVariant,
    getVariantsByProduct,
    updateVariant,
    deleteVariant
};