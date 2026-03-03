/**
 * Formata mensagens de erro vindas do backend, tratando erros do Zod e erros genéricos.
 */
export const formatErrorMessage = (err: any, defaultMessage: string = 'Ocorreu um erro inesperado.'): string => {
  const errorData = err.response?.data?.error || err.message;
  
  if (!errorData) return defaultMessage;
  
  // Se for uma string, tenta verificar se é um JSON (ZodError)
  if (typeof errorData === 'string') {
    // Remove possíveis aspas extras ou espaços
    const trimmed = errorData.trim();
    
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].message || defaultMessage;
        }
      } catch (e) {
        // Ignora erro de parse e continua
      }
    }
    
    // Se for uma string simples, retorna ela
    return errorData;
  }
  
  // Se já for um array
  if (Array.isArray(errorData)) {
    return errorData.length > 0 ? (errorData[0].message || defaultMessage) : defaultMessage;
  }

  // Se for um objeto com propriedade message
  if (typeof errorData === 'object') {
    if (errorData.message) return errorData.message;
    // Se for o próprio objeto de erro do Zod (raro no client, mas possível)
    if (errorData.errors && Array.isArray(errorData.errors)) {
      return errorData.errors[0].message || defaultMessage;
    }
  }
  
  return defaultMessage;
};
