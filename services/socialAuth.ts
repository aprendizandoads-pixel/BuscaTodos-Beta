
import { SocialConfig, Lead } from "../types";
import { addLog } from "../utils/logger";

interface SocialUser {
  name: string;
  email: string;
  photoUrl?: string;
  phone?: string; // Optional field for user structure
  provider: 'google' | 'facebook' | 'apple';
}

/**
 * Retorna a URI de redirecionamento atual para configuração nos painéis de desenvolvedor
 */
export const getRedirectUri = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

/**
 * Simula/Executa o fluxo de login social
 */
export const initiateSocialLogin = async (
  provider: 'google' | 'facebook' | 'apple',
  config: SocialConfig
): Promise<SocialUser> => {
  
  // 1. Validação de Configuração
  if (provider === 'google' && (!config.googleEnabled || !config.googleClientId)) {
    throw new Error("Login com Google não configurado ou Client ID ausente.");
  }
  if (provider === 'facebook' && (!config.facebookEnabled || !config.facebookAppId)) {
    throw new Error("Login com Facebook não configurado ou App ID ausente.");
  }
  if (provider === 'apple' && (!config.appleEnabled || !config.appleServiceId)) {
    throw new Error("Login com Apple não configurado ou Service ID ausente.");
  }

  addLog('info', 'system', `Iniciando login social com ${provider}...`);

  // 2. Simulação do Fluxo OAuth (Popup)
  // Nota: Em produção real, aqui entraria a chamada gapi.auth2.getAuthInstance().signIn() ou FB.login()
  return new Promise((resolve, reject) => {
    
    // Abre uma janela popup simulada (apenas visual para UX) ou delay
    // Em um ambiente real sem backend configurado, abrir popup pode ser bloqueado ou dar 404.
    
    setTimeout(() => {
        // Dados simulados baseados no provedor.
        // Conforme solicitado: Retornar VAZIO caso não encontre (simulação), ao invés de dados fictícios.
        // Isso obriga o usuário a preencher manualmente se a API não retornar os dados,
        // evitando que apareça "Usuário Exemplo".
        const mockUser: SocialUser = {
            provider,
            name: "", 
            email: "", 
            phone: "", // Retorna vazio conforme comportamento padrão de APIs sociais
            photoUrl: ""
        };

        addLog('success', 'system', `Login social com ${provider} realizado (simulação sem dados retornados).`, mockUser);
        resolve(mockUser);
    }, 1500);
  });
};
