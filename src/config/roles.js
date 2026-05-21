const allRoles = {
    user: [
        'admin'
    ],

    plus: [
        'admin'
    ],

    pro: [
        'admin'
    ],

    admin: [
        'admin'
    ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
    roles,
    roleRights,
};