const Category = require('../models/category.model');
const ApiError = require('../utils/ApiError');

/**
 * Tạo danh mục mới
 */
const createCategory = async (body) => {
    const existing = await Category.findOne({
        $or: [{
            name: body.name
        }]
    });

    if (existing) {
        if (existing.name === body.name) throw new ApiError(409, 'Tên danh mục đã tồn tại');
    }

    const category = await Category.create(body);
    return category;
};

/**
 * Lấy tất cả danh mục (public — chỉ active)
 */
const getCategories = async () => {
    return Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
};

/**
 * Lấy tất cả danh mục (admin — bao gồm inactive)
 */
const getAllCategoriesAdmin = async () => {
    return Category.find().sort({ sortOrder: 1, name: 1 });
};

/**
 * Cập nhật danh mục
 */
const updateCategory = async (categoryId, body) => {
    const category = await Category.findById(categoryId);
    if (!category) throw new ApiError(404, 'Danh mục không tồn tại');

    if (body.name || body.slug) {
        const conditions = [];
        if (body.name) conditions.push({ name: body.name });

        const duplicate = await Category.findOne({
            $or: conditions,
            _id: { $ne: categoryId }
        });

        if (duplicate) {
            if (body.name && duplicate.name === body.name) throw new ApiError(409, 'Tên danh mục đã tồn tại');
        }
    }

    Object.assign(category, body);
    await category.save();
    return category;
};

const getCategoryBySlug = async (slug) => {
    const category = await Category.findOne({ slug });

    if (!category) {
        throw new ApiError(404, 'Danh mục không tồn tại');
    }

    return category;
};

const getCategoryById = async (categoryId) => {
    const category = await Category.findById(categoryId);

    if (!category) {
        throw new ApiError(404, 'Danh mục không tồn tại');
    }

    return category;
};

/**
 * Xóa danh mục (soft delete — set isActive = false)
 */
const deleteCategory = async (categoryId) => {
    const category = await Category.findById(categoryId);
    if (!category) throw new ApiError(404, 'Danh mục không tồn tại');

    category.isActive = false;
    await category.save();
    return category;
};

module.exports = {
    createCategory,
    getCategories,
    getAllCategoriesAdmin,
    updateCategory,
    deleteCategory,
    getCategoryBySlug,
    getCategoryById
};