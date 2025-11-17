// ===============================
// ESTADO GLOBAL (em memória)
// ===============================
const estados = {};

/**
 * Retorna o estado do usuário ou cria um novo
 */
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

/**
 * Atualiza o estado do usuário
 */
function updateState(telefone, newState) {
    if (!estados[telefone]) estados[telefone] = {};
    estados[telefone] = { ...estados[telefone], ...newState };
}

/**
 * Reseta o estado do usuário
 */
function resetState(telefone) {
    estados[telefone] = {
        etapa: "menu",
        dados: {},
        lastMessageId: null,
        silencio: false
    };
}

module.exports = {
    getState,
    updateState,
    resetState
};
