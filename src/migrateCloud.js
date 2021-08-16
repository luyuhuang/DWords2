module.exports = {
    '0.0.1' : async function (dav) {
        await dav.createDirectory('/plans');
    },
};
