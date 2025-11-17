const estados = {};

function initState(phone) {
    if (!estados[phone]) {
        estados[phone] = {
            etapa: "menu",
            dados: {},
            lastMessageId: null,
        };
    }
    return estados[phone];
}

function getState(phone) {
    return estados[phone];
}

function updateState(phone, update) {
    estados[phone] = { ...estados[phone], ...update };
}

module.exports = { initState, getState, updateState };
