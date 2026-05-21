const InventoryItem = require('../models/inventoryItem.model');
const ProductVariant = require('../models/productVariant.model');
const Product = require('../models/product.model');
const ApiError = require('../utils/ApiError');
const cloudinary = require('../config/cloudinary');
const QRCode = require('qrcode');

/**
 * Tạo inventory item mới
 */
const createInventoryItem = async (body) => {
    const [product, variant] = await Promise.all([
        Product.findOne({ _id: body.productId, status: { $ne: 'DELETED' } }),
        ProductVariant.findOne({ _id: body.variantId, status: 'ACTIVE' })
    ]);

    if (!product) throw new ApiError(404, 'Sản phẩm không tồn tại');
    if (!variant) throw new ApiError(404, 'Variant không tồn tại');
    if (String(variant.productId) !== String(body.productId)) {
        throw new ApiError(400, 'Variant không thuộc sản phẩm này');
    }

    // Kiểm tra itemCode chưa tồn tại
    const existingCode = await InventoryItem.findOne({ itemCode: body.itemCode.toUpperCase() });
    if (existingCode) throw new ApiError(409, `Mã item "${body.itemCode}" đã tồn tại`);

    // Tạo item trước để lấy ID
    const item = new InventoryItem({ ...body, itemCode: body.itemCode.toUpperCase() });

    // Sinh QR code chứa itemCode, upload lên Cloudinary
    try {
        const qrDataUrl = await QRCode.toDataURL(item.itemCode, { width: 300 });
        const uploadResult = await cloudinary.uploader.upload(qrDataUrl, {
            folder: `fitora/qrcodes`,
            public_id: `qr_${item.itemCode}`
        });
        item.qrCodeUrl = uploadResult.secure_url;
    } catch (err) {
        console.error('QR code generation failed:', err.message);
    }

    await item.save();
    return item;
};

/**
 * Lấy danh sách inventory (admin)
 */
const getInventory = async (filter) => {
    const { productId, variantId, status, condition, page = 1, limit = 20 } = filter;

    const query = {};
    if (productId) query.productId = productId;
    if (variantId) query.variantId = variantId;
    if (status) query.status = status;
    if (condition) query.condition = condition;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        InventoryItem.find(query)
            .populate('productId', 'name thumbnailUrl')
            .populate('variantId', 'sku size color')
            .sort({ itemCode: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        InventoryItem.countDocuments(query)
    ]);

    return {
        results: items,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        totalResults: total
    };
};

/**
 * Lấy chi tiết 1 inventory item
 */
const getInventoryItemById = async (itemId) => {
    const item = await InventoryItem.findById(itemId)
        .populate('productId', 'name thumbnailUrl')
        .populate('variantId', 'sku size color');

    if (!item) throw new ApiError(404, 'Item không tồn tại');
    return item;
};

/**
 * Cập nhật thông tin item (condition, note)
 */
const updateInventoryItem = async (itemId, body) => {
    const item = await InventoryItem.findById(itemId);
    if (!item) throw new ApiError(404, 'Item không tồn tại');

    Object.assign(item, body);
    await item.save();
    return item;
};

/**
 * Cập nhật trạng thái item (admin)
 * Có validation chuyển trạng thái hợp lệ
 */
const updateInventoryItemStatus = async (itemId, status, note) => {
    const item = await InventoryItem.findById(itemId);
    if (!item) throw new ApiError(404, 'Item không tồn tại');

    if (item.status === 'RENTING' && status === 'AVAILABLE') {
        throw new ApiError(
            400,
            'Item đang được thuê. Hãy xử lý trả đồ qua luồng booking, không thay đổi trực tiếp'
        );
    }

    item.status = status;
    if (note !== undefined) item.note = note;

    if (status === 'AVAILABLE') {
        item.currentBookingId = null;
    }

    await item.save();
    return item;
};

/**
 * Xóa inventory item (chỉ xóa được nếu AVAILABLE / MAINTENANCE)
 */
const deleteInventoryItem = async (itemId) => {
    const item = await InventoryItem.findById(itemId);
    if (!item) throw new ApiError(404, 'Item không tồn tại');

    const nonDeletableStatuses = ['RENTING', 'RESERVED'];
    if (nonDeletableStatuses.includes(item.status)) {
        throw new ApiError(400, 'Không thể xóa item đang được thuê hoặc đặt trước');
    }

    await item.deleteOne();
    return { message: 'Xóa item thành công' };
};

module.exports = {
    createInventoryItem,
    getInventory,
    getInventoryItemById,
    updateInventoryItem,
    updateInventoryItemStatus,
    deleteInventoryItem
};