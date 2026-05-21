const catchAsync = require('../utils/catchAsync');
const inventoryItemService = require('../services/inventoryItem.service');

const createInventoryItem = catchAsync(async (req, res) => {
    const item = await inventoryItemService.createInventoryItem(req.body);

    return res.status(201).json({
        status: 'success',
        message: 'Tạo inventory item thành công',
        data: { item }
    });
});

const getInventory = catchAsync(async (req, res) => {
    const result = await inventoryItemService.getInventory(req.query);

    return res.status(200).json({
        status: 'success',
        message: 'Lấy danh sách inventory thành công',
        data: result
    });
});

const getInventoryItemById = catchAsync(async (req, res) => {
    const item = await inventoryItemService.getInventoryItemById(req.params.itemId);

    return res.status(200).json({
        status: 'success',
        message: 'Lấy inventory item thành công',
        data: { item }
    });
});

const updateInventoryItem = catchAsync(async (req, res) => {
    const item = await inventoryItemService.updateInventoryItem(req.params.itemId, req.body);

    return res.status(200).json({
        status: 'success',
        message: 'Cập nhật inventory item thành công',
        data: { item }
    });
});

const updateInventoryItemStatus = catchAsync(async (req, res) => {
    const { status, note } = req.body;
    const item = await inventoryItemService.updateInventoryItemStatus(req.params.itemId, status, note);

    return res.status(200).json({
        status: 'success',
        message: 'Cập nhật trạng thái item thành công',
        data: { item }
    });
});

const deleteInventoryItem = catchAsync(async (req, res) => {
    await inventoryItemService.deleteInventoryItem(req.params.itemId);

    return res.status(200).json({
        status: 'success',
        message: 'Xóa inventory item thành công'
    });
});

module.exports = {
    createInventoryItem,
    getInventory,
    getInventoryItemById,
    updateInventoryItem,
    updateInventoryItemStatus,
    deleteInventoryItem
};