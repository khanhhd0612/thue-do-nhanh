const publicRights = [
    'getProducts',
    'getCategories',
    'getProductVariants',
    'getReviews',
];

const userRights = [
    ...publicRights,
    'getProfile',
    'manageProfile',
    'getBookings',
    'manageBookings',
    'getWallet',
    'manageWallet',
    'getFavorites',
    'manageFavorites',
    'getCollections',
    'manageCollections',
    'getNotifications',
    'manageNotifications',
    'useChatbot',
];

const plusRights = [
    ...userRights,
    'useAiTryOn',
    'useVisualSearch',
    'getAiUsage',
];

const proRights = [
    ...plusRights,
];

const adminRights = [
    ...proRights,
    'admin',
    'getUsers',
    'manageUsers',
    'manageCategories',
    'manageProducts',
    'manageProductVariants',
    'getInventory',
    'manageInventory',
    'getAllBookings',
    'manageAllBookings',
    'getAllWallets',
    'manageAllWallets',
    'getPayments',
    'managePayments',
    'getSubscriptions',
    'manageSubscriptions',
    'getAiUsage',
    'manageAiUsage',
    'manageReviews',
    'getDashboard',
    'manageDashboard',
];

const allRoles = {
    user: userRights,
    plus: plusRights,
    pro: proRights,
    admin: adminRights,
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
    roles,
    roleRights,
};
