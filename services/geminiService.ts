import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Product } from "../types";

// Mantendo a correção da API Key que fizemos antes
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export const analyzeSales = async (transactions: Transaction[], products: Product[]) => {
  try {
    const salesData = JSON.stringify(transactions.slice(0, 50)); 
    const inventoryData = JSON.stringify(products);
    
    // Prompt atualizado com a persona Sofia e pedindo a Sugestão
    const prompt = `
      Atue como Sofia, a consultora analítica da Rodrigues Growth Partners.
      Analise os dados de vendas (JSON) e estoque abaixo.
      Seja fria, precisa e foque em resultados.
      
      Dados de Vendas: ${salesData}
      Dados de Estoque: ${inventoryData}
      
      Gere um JSON com os campos:
      1. insight: O diagnóstico do problema ou padrão encontrado.
      2. suggestion: UMA AÇÃO PRÁTICA de Vendas ou Marketing para melhorar os resultados (ex: criar combo, ajustar preço).
      3. lowStockAlerts: Lista de produtos com estoque baixo.
      4. projectedRevenue: Estimativa de receita futura.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // <--- Mantido o modelo original que você ordenou
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING, description: "Diagnóstico analítico do padrão de vendas." },
            suggestion: { type: Type.STRING, description: "Ação estratégica recomendada para aumentar lucro." }, // Novo campo
            lowStockAlerts: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Produtos com estoque crítico"
            },
            projectedRevenue: { type: Type.STRING, description: "Estimativa de receita" }
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
            model: 'gemini-3-flash-preview', // <--- Mantido aqui também
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
