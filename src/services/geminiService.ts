
import { GoogleGenAI, Type } from "@google/genai";
import { Pet } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getPetFeedingAdvice = async (pet: Pet): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `作为宠物专家，请针对以下宠物信息提供简短的中文喂养建议。
      物种: ${pet.species}
      基因/品种: ${pet.gene}
      体重: ${pet.weight}kg
      当前柜号: ${pet.cabinetId}`,
      config: {
        maxOutputTokens: 200,
        temperature: 0.7,
      }
    });
    return response.text || "暂无建议";
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return "获取喂养建议失败。";
  }
};

export const searchPetInsights = async (query: string): Promise<string[]> => {
    // This could return suggestions for common species or gene types
    try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `基于关键词 "${query}"，返回5个相关的热门宠物物种或基因名称，仅返回名称，用逗号隔开。`,
          config: {
            maxOutputTokens: 50,
            temperature: 0.5,
          }
        });
        return (response.text || "").split(',').map(s => s.trim());
      } catch (error) {
        return [];
      }
}
