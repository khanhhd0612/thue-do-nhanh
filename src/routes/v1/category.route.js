const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const categoryValidation = require('../../validations/category.validation');
const categoryController = require('../../controllers/category.controller');

const router = express.Router();

router
    .route('/')
    .get(auth(), categoryController.getCategories)
    .post(
        auth('admin'),
        validate(categoryValidation.createCategory),
        categoryController.createCategory
    );

router.get(
    '/slug/:slug',
    auth(),
    validate(categoryValidation.getCategoryBySlug),
    categoryController.getCategoryBySlug
);

router
    .route('/:categoryId')
    .get(
        auth(),
        validate(categoryValidation.getCategoryById),
        categoryController.getCategoryById
    )
    .patch(
        auth('admin'),
        validate(categoryValidation.updateCategory),
        categoryController.updateCategory
    )
    .delete(
        auth('admin'),
        validate(categoryValidation.getCategoryById),
        categoryController.deleteCategory
    );

module.exports = router;