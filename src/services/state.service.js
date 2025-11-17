const estados = {};

function getState(telefone) {
    if (!estados[telefone]) {
        estados[telefone] = {
            etapa: "menu",
            dados: {},
            lastMessageId: null,
            silencio: false
        };
    }
    return estados[telefone];
}

function updateState(telefone, newState) {
    if (!estados[telefone]) estados[telefone] = {};
    estados[telefone] = { ...estados[telefone], ...newState };
}

function resetState(telefone) {
    estados[telefone] = {
        etapa: "menu",
        dados: {},
        lastMessageId: null,
        silencio: false
    };
}

module.exports = { getState, updateState, resetState };
