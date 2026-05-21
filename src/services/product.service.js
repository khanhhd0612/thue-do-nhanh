const Product = require('../models/product.model');
const ProductVariant = require('../models/productVariant.model');
const Category = require('../models/category.model');
const ApiError = require('../utils/ApiError');
const cloudinary = require('../config/cloudinary');

const createProduct = async (body) => {
    const category = await Category.findById(body.categoryId);

    if (!category || !category.isActive) {
        throw new ApiError(
            404,
            'Danh mục không tồn tại hoặc đã bị vô hiệu hóa'
        );
    }

    delete body.slug;

    const product = await Product.create(body);

    return product;
};

const getProducts = async (filter) => {
    const {
        keyword,
        categoryId,
        categorySlug,
        size,
        color,
        style,
        tags,
        minPrice,
        maxPrice,
        status = 'ACTIVE',
        sortBy = 'createdAt:desc',
        limit = 12,
        page = 1
    } = filter;

    const query = { status };

    // Text search
    if (keyword) {
        query.$text = { $search: keyword };
    }

    // Filter theo category
    if (categoryId) {
        query.categoryId = categoryId;
    } else if (categorySlug) {
        const category = await Category.findOne({ slug: categorySlug, isActive: true });
        if (category) query.categoryId = category._id;
    }

    // Filter theo màu
    if (color) {
        query.color = { $in: [color.toLowerCase()] };
    }

    // Filter theo style
    if (style) {
        query.style = { $regex: style, $options: 'i' };
    }

    // Filter theo tags (comma-separated)
    if (tags) {
        const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
        if (tagList.length) query.tags = { $in: tagList };
    }

    // Filter theo giá
    if (minPrice !== undefined || maxPrice !== undefined) {
        query.rentalPricePerDay = {};
        if (minPrice !== undefined) query.rentalPricePerDay.$gte = minPrice;
        if (maxPrice !== undefined) query.rentalPricePerDay.$lte = maxPrice;
    }

    // Filter theo size (cần join với variant)
    // Nếu filter theo size, tìm productId có variant với size đó
    if (size) {
        const variants = await ProductVariant.find({ size, status: 'ACTIVE' }).distinct('productId');
        query._id = { $in: variants };
    }

    // Sắp xếp
    const [sortField, sortOrder] = sortBy.split(':');
    const sort = {};
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Nếu có keyword thì thêm text score sort
    if (keyword) {
        sort.score = { $meta: 'textScore' };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
        Product.find(query)
            .populate('categoryId', 'name slug')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        Product.countDocuments(query)
    ]);

    return {
        results: products,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        totalResults: total
    };
};

/**
 * Lấy chi tiết sản phẩm theo ID
 */
const getProductById = async (productId) => {
    const product = await Product.findOne({
        _id: productId,
        status: { $ne: 'DELETED' }
    }).populate('categoryId', 'name slug');

    if (!product) throw new ApiError(404, 'Sản phẩm không tồn tại');

    return product;
};

/**
 * Lấy chi tiết sản phẩm theo slug (kèm variants)
 */
const getProductBySlug = async (slug) => {
    const product = await Product.findOne({
        slug,
        status: 'ACTIVE'
    }).populate('categoryId', 'name slug');

    if (!product) throw new ApiError(404, 'Sản phẩm không tồn tại');

    // Lấy kèm variants
    const variants = await ProductVariant.find({
        productId: product._id,
        status: 'ACTIVE'
    }).lean();

    return { product, variants };
};

/**
 * Cập nhật sản phẩm
 */
const updateProduct = async (productId, body) => {
    const product = await Product.findOne({ _id: productId, status: { $ne: 'DELETED' } });
    if (!product) throw new ApiError(404, 'Sản phẩm không tồn tại');

    // Kiểm tra category nếu có update
    if (body.categoryId) {
        const category = await Category.findById(body.categoryId);
        if (!category || !category.isActive) throw new ApiError(404, 'Danh mục không tồn tại');
    }

    // Kiểm tra slug trùng
    if (body.slug && body.slug !== product.slug) {
        const existingSlug = await Product.findOne({ slug: body.slug, _id: { $ne: productId } });
        if (existingSlug) throw new ApiError(409, 'Slug đã tồn tại');
    }

    Object.assign(product, body);
    await product.save();
    return product;
};

const deleteProduct = async (productId) => {
    const product = await Product.findOne({ _id: productId, status: { $ne: 'DELETED' } });
    if (!product) throw new ApiError(404, 'Sản phẩm không tồn tại');

    product.status = 'DELETED';
    await product.save();
    return product;
};

const uploadProductImages = async (productId, files, thumbnailIndex = 0) => {
    const product = await Product.findOne({ _id: productId, status: { $ne: 'DELETED' } });
    if (!product) throw new ApiError(404, 'Sản phẩm không tồn tại');

    if (!files || files.length === 0) throw new ApiError(400, 'Không có ảnh nào được upload');

    // Upload từng ảnh lên Cloudinary
    const uploadPromises = files.map((file) =>
        cloudinary.uploader.upload(file.path, {
            folder: `fitora/products/${productId}`,
            transformation: [{ width: 1200, height: 1600, crop: 'limit', quality: 'auto' }]
        })
    );

    const results = await Promise.all(uploadPromises);
    const urls = results.map((r) => r.secure_url);

    // Gộp ảnh mới vào danh sách hiện tại
    product.images = [...product.images, ...urls];

    // Cập nhật thumbnail
    const thumbIdx = Number(thumbnailIndex) || 0;
    if (product.images[thumbIdx]) {
        product.thumbnailUrl = product.images[thumbIdx];
    }

    await product.save();
    return product;
};

const deleteProductImage = async (productId, imageUrl) => {
    const product = await Product.findOne({
        _id: productId,
        status: {
            $ne: 'DELETED'
        }
    });
    if (!product) throw new ApiError(404, 'Sản phẩm không tồn tại');

    product.images = product.images.filter((img) => img !== imageUrl);

    // Nếu thumbnail bị xóa thì đặt lại thumbnail là ảnh đầu tiên
    if (product.thumbnailUrl === imageUrl) {
        product.thumbnailUrl = product.images[0] || '';
    }

    await product.save();
    return product;
};

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