import { GoogleGenAI } from "@google/genai";
import { GeminiAdvice, UserData } from "../types";

// Initialize Gemini Client
// Note: In a real production app, ensure API_KEY is set in your environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getFinancialAdvice = async (userData: UserData): Promise<GeminiAdvice> => {
  if (!process.env.API_KEY) {
    // Fallback mock response if no API key is present for demo purposes
    return {
      title: "Análise Preliminar",
      content: "Seu score indica um bom comportamento financeiro, mas existem pendências que podem impactar futuras solicitações de crédito. Recomendamos a quitação das dívidas mais antigas primeiro.",
      actionItems: [
        "Negocie a dívida com o Banco Nacional",
        "Atualize seus dados cadastrais",
        "Ative o Cadastro Positivo"
      ]
    };
  }

  try {
    const prompt = `
      Atue como um consultor financeiro especialista em crédito brasileiro.
      Analise os seguintes dados de um usuário anonimizado:
      Score: ${userData.score} (de 0 a 1000)
      Status CPF: ${userData.status}
      Dívidas em aberto: ${userData.debts.filter(d => d.status === 'Em Aberto').length}
      Valor total aproximado de dívidas: R$ ${userData.debts.reduce((acc, curr) => acc + curr.value, 0).toFixed(2)}
      
      Forneça um conselho curto, direto e motivador.
      Retorne APENAS um JSON com o seguinte formato (sem markdown):
      {
        "title": "Titulo curto do conselho",
        "content": "Texto explicativo de até 2 parágrafos.",
        "actionItems": ["Ação 1", "Ação 2", "Ação 3"]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as GeminiAdvice;

  } catch (error) {
    console.error("Error fetching Gemini advice:", error);
    return {
      title: "Consultor Indisponível",
      content: "Não foi possível gerar uma análise personalizada no momento. Tente novamente mais tarde.",
      actionItems: ["Verifique sua conexão", "Tente novamente em instantes"]
    };
  }
};