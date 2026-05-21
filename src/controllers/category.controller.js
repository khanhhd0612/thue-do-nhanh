const catchAsync = require('../utils/catchAsync');
const categoryService = require('../services/category.service');

const createCategory = catchAsync(async (req, res) => {
    const category = await categoryService.createCategory(req.body);

    return res.status(201).json({
        status: 'success',
        message: 'Tạo danh mục thành công',
        data: {
            category
        }
    });
});

const getCategoryBySlug = catchAsync(async (req, res) => {
    const category = await categoryService.getCategoryBySlug(req.params.slug);

    return res.status(200).json({
        status: 'success',
        message: 'Lấy danh mục thành công',
        data: {
            category
        }
    });
});

const getCategoryById = catchAsync(async (req, res) => {
    const category = await categoryService.getCategoryById(req.params.categoryId);

    return res.status(200).json({
        status: 'success',
        message: 'Lấy danh mục thành công',
        data: {
            category
        }
    });
});

const getCategories = catchAsync(async (req, res) => {
    const isAdmin = req.user?.role === 'admin';
    const categories = isAdmin
        ? await categoryService.getAllCategoriesAdmin()
        : await categoryService.getCategories();

    return res.status(200).json({
        status: 'success',
        message: 'Lấy danh mục thành công',
        data: {
            categories
        }
    });
});

const updateCategory = catchAsync(async (req, res) => {
    const category = await categoryService.updateCategory(req.params.categoryId, req.body);

    return res.status(200).json({
        status: 'success',
        message: 'Cập nhật danh mục thành công',
        data: {
            category
        }
    });
});

const deleteCategory = catchAsync(async (req, res) => {
    await categoryService.deleteCategory(req.params.categoryId);

    return res.status(200).json({
        status: 'success',
        message: 'Vô hiệu hóa danh mục thành công'
    });
});

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoryBySlug
};