import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Product } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export const analyzeSales = async (transactions: Transaction[], products: Product[]) => {
  try {
    const salesData = JSON.stringify(transactions.slice(0, 50)); // Limit payload
    const inventoryData = JSON.stringify(products);
    
    const prompt = `
      Atue como um consultor financeiro e gestor de eventos para uma igreja.
      Analise os seguintes dados de vendas (em JSON) e estoque atual.
      
      Dados de Vendas (Amostra): ${salesData}
      Dados de Estoque Atual: ${inventoryData}
      
      Por favor, forneça um relatório curto e direto em formato JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING, description: "Uma observação importante sobre o padrão de vendas ou popularidade." },
            suggestion: { type: Type.STRING, description: "Uma ação recomendada (ex: promoção, reabastecimento)." },
            lowStockAlerts: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Lista de nomes de produtos com estoque baixo (menor que 10)"
            },
            projectedRevenue: { type: Type.STRING, description: "Uma estimativa simples de vendas para o próximo evento baseada na média." }
          },
          required: ["insight", "suggestion", "lowStockAlerts", "projectedRevenue"],
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Erro ao analisar vendas com Gemini:", error);
    return null;
  }
};

export const askAssistant = async (question: string, contextData: string) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Você é um assistente voluntário experiente da igreja. Use este contexto de dados para responder à pergunta do usuário de forma amigável e breve:
            
            Contexto: ${contextData}
            
            Pergunta: ${question}`,
        });
        return response.text;
    } catch (error) {
        console.error("Erro no chat assistente:", error);
        return "Desculpe, estou com dificuldades para conectar com o servidor de inteligência no momento.";
    }
}
