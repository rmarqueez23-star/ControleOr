/**
 * URL base da API.
 */
window.API_HOST = 'http://localhost:3000/api/';

/**
 * Formata um número para a moeda brasileira (BRL).
 * @param {number} amount - O valor a ser formatado.
 * @returns {string} O valor formatado como moeda.
 */
window.formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(amount);
};

/**
 * Formata um número como uma porcentagem com duas casas decimais.
 * @param {number} amount - O valor a ser formatado.
 * @returns {string} O valor formatado como porcentagem.
 */
window.formatPercent = (amount) => {
    return `${amount.toFixed(2)}%`;
};
