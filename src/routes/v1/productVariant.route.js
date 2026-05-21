const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const productVariantValidation = require('../../validations/productVariant.validation');
const productVariantController = require('../../controllers/productVariant.controller');

const router = express.Router({ mergeParams: true });

router.get(
    '/',
    validate(productVariantValidation.getVariantsByProduct),
    productVariantController.getVariantsByProduct
);

router.post(
    '/',
    auth('admin'),
    validate(productVariantValidation.createVariant),
    productVariantController.createVariant
);

router.patch(
    '/:variantId',
    auth('admin'),
    validate(productVariantValidation.updateVariant),
    productVariantController.updateVariant
);

router.delete(
    '/:variantId',
    auth('admin'),
    validate(productVariantValidation.deleteVariant),
    productVariantController.deleteVariant
);

module.exports = router;