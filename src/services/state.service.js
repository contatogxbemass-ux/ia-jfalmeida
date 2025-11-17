const estados = {};

function getState(telefone) {
    if (!estados[telefone]) {
        estados[telefone] = {
            etapa: "menu",
            dados: {},
            lastMessageId: null
        };
    }
    return estados[telefone];
}

function updateState(telefone, newState) {
    estados[telefone] = { ...estados[telefone], ...newState };
}

function resetState(telefone) {
    estados[telefone] = {
        etapa: "menu",
        dados: {},
        lastMessageId: null
    };
}

module.exports = { getState, updateState, resetState };
