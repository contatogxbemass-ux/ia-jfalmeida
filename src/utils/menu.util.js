const tenants = require("../config/tenants.config");

/**
 * Gera o menu correto baseado no tenantId
 */
function getMenuForTenant(tenantId) {
  const config = tenants[tenantId] || tenants["default"];
  return config.menu;
}

module.exports = {
  getMenuForTenant,
};
