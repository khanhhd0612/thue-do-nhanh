const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const inventoryItemValidation = require('../../validations/inventoryItem.validation');
const inventoryItemController = require('../../controllers/inventoryItem.controller');

const router = express.Router();

router.get('/', auth('admin'), validate(inventoryItemValidation.queryInventory), inventoryItemController.getInventory);
router.get('/:itemId', auth('admin'), validate(inventoryItemValidation.getInventoryItem), inventoryItemController.getInventoryItemById);
router.post('/', auth('admin'), validate(inventoryItemValidation.createInventoryItem), inventoryItemController.createInventoryItem);
router.patch('/:itemId', auth('admin'), validate(inventoryItemValidation.updateInventoryItem), inventoryItemController.updateInventoryItem);
router.patch('/:itemId/status', auth('admin'), validate(inventoryItemValidation.updateInventoryItemStatus), inventoryItemController.updateInventoryItemStatus);
router.delete('/:itemId', auth('admin'), validate(inventoryItemValidation.deleteInventoryItem), inventoryItemController.deleteInventoryItem);

module.exports = router;