/**
 * Substitui variáveis dinâmicas em textos de campanhas
 * 
 * Uso:
 * const texto = "<p>Olá, {{nome}}! Sua doação de {{valor}} foi recebida.</p>";
 * const dados = { nome: "João", valor: "R$ 100,00" };
 * const resultado = replaceCampainTextVariables(texto, dados);
 * // Resultado: "<p>Olá, João! Sua doação de R$ 100,00 foi recebida.</p>"
 */

/**
 * Substitui variáveis no formato {{variavel}} por valores reais
 * @param {string} text - Texto com variáveis no formato {{nome_variavel}}
 * @param {Object} variables - Objeto com os valores das variáveis
 * @returns {string} Texto com variáveis substituídas
 */
export const replaceCampainTextVariables = (text, variables = {}) => {
  if (!text || typeof text !== "string") {
    return text;
  }

  let result = text;

  // Substitui cada variável encontrada no texto
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
    const value = variables[key] !== undefined ? variables[key] : "";
    result = result.replace(regex, value);
  });

  return result;
};

/**
 * Extrai todas as variáveis de um texto
 * @param {string} text - Texto com variáveis
 * @returns {Array<string>} Lista de nomes de variáveis encontradas
 */
export const extractVariablesFromText = (text) => {
  if (!text || typeof text !== "string") {
    return [];
  }

  const regex = /{{(\s*\w+\s*)}}/g;
  const matches = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const variableName = match[1].trim();
    if (!matches.includes(variableName)) {
      matches.push(variableName);
    }
  }

  return matches;
};

/**
 * Valida se todas as variáveis necessárias foram fornecidas
 * @param {string} text - Texto com variáveis
 * @param {Object} variables - Objeto com os valores das variáveis
 * @returns {Object} { valid: boolean, missing: Array<string> }
 */
export const validateTextVariables = (text, variables = {}) => {
  const requiredVariables = extractVariablesFromText(text);
  const providedVariables = Object.keys(variables);
  const missing = requiredVariables.filter(
    (v) => !providedVariables.includes(v)
  );

  return {
    valid: missing.length === 0,
    missing,
    required: requiredVariables,
  };
};

/**
 * Variáveis comuns que podem ser usadas nos textos
 * Adicione mais conforme necessário para seu projeto
 */
export const COMMON_VARIABLES = {
  // Dados do doador
  DONOR_NAME: "nome_doador",
  DONOR_EMAIL: "email_doador",
  DONOR_PHONE: "telefone_doador",
  DONOR_CPF: "cpf_doador",

  // Dados da doação
  DONATION_VALUE: "valor_doacao",
  DONATION_DATE: "data_doacao",
  DONATION_ID: "id_doacao",
  DONATION_METHOD: "metodo_pagamento",

  // Dados da campanha
  CAMPAIGN_NAME: "nome_campanha",
  CAMPAIGN_GOAL: "meta_campanha",
  CAMPAIGN_CURRENT: "arrecadado_campanha",

  // Dados gerais
  CURRENT_DATE: "data_atual",
  CURRENT_YEAR: "ano_atual",
  COMPANY_NAME: "nome_empresa",
  COMPANY_EMAIL: "email_empresa",
  COMPANY_PHONE: "telefone_empresa",
};

/**
 * Exemplo de uso completo
 */
export const exampleUsage = () => {
  const textTemplate = `
    <h1>Olá, {{nome_doador}}!</h1>
    <p>Obrigado pela sua doação de <strong>{{valor_doacao}}</strong>.</p>
    <p>Data: {{data_doacao}}</p>
    <p>Campanha: {{nome_campanha}}</p>
    <br/>
    <em>Equipe {{nome_empresa}}</em>
  `;

  const variables = {
    nome_doador: "João Silva",
    valor_doacao: "R$ 150,00",
    data_doacao: "05/12/2023",
    nome_campanha: "Natal Solidário 2023",
    nome_empresa: "DemigTools",
  };

  // Validar variáveis
  const validation = validateTextVariables(textTemplate, variables);
  console.log("Validação:", validation);

  // Substituir variáveis
  const finalText = replaceCampainTextVariables(textTemplate, variables);
  console.log("Texto final:", finalText);

  return finalText;
};

