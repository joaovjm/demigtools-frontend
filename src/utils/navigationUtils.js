/**
 * Função utilitária para navegação com suporte a Ctrl+Click para abrir em nova aba
 * 
 * @param {Event} event - O evento de clique do mouse
 * @param {string} path - O caminho para navegar (ex: "/donor/123")
 * @param {Function} navigate - A função navigate do React Router
 */
export const navigateWithNewTab = (event, path, navigate) => {
  // Verifica se Ctrl (Windows/Linux) ou Cmd (Mac) está pressionado
  if (event.ctrlKey || event.metaKey) {
    // Abre em nova aba
    window.open(path, '_blank');
  } else {
    // Navegação normal
    navigate(path);
  }
};

/**
 * Função para obter o caminho completo (considerando a base URL da aplicação)
 * 
 * @param {string} path - O caminho relativo
 * @returns {string} - O caminho completo
 */
export const getFullPath = (path) => {
  // Se já começa com /, usa como está
  if (path.startsWith('/')) {
    return path;
  }
  return `/${path}`;
};

export default navigateWithNewTab;

