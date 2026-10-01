"use server";

import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Verifica se a chave existe
const apiKey = process.env.GEMINI_API_KEY;

export async function parseActivityWithAI(text: string) {
  if (!apiKey) {
    return { error: "A chave GEMINI_API_KEY não está configurada no .env" };
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Você é um assistente especializado em classificar registros de diário de atividades.
Extraia as seguintes informações do texto do usuário se existirem. Se uma informação subjetiva (como impacto, energia) não for dita claramente, retorne null.
Responda APENAS em JSON válido, com a seguinte estrutura:
{
  "title": string,
  "description": string,
  "area": "Carreira" | "Renda" | "Projetos" | "Estudos" | "Casa" | "Vida pessoal" | "Administrativo" | "Lazer" | null,
  "activityType": "Concentração" | "Criativa" | "Operacional" | "Administrativa" | "Física" | "Social" | "Descanso" | null,
  "startTime": "HH:MM" (string) | null,
  "endTime": "HH:MM" (string) | null,
  "durationMinutes": number | null,
  "importance": number (1 a 5) | null,
  "impact": number (1 a 5) | null,
  "returns": array of strings (from: "Renda imediata", "Renda futura", "Carreira", "Projeto pessoal", "Conhecimento", "Manutenção", "Bem-estar", "Lazer"),
  "energyBefore": "Baixa" | "Média" | "Alta" | null,
  "energyAfter": "Baixa" | "Média" | "Alta" | null
}

Texto do usuário: "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const rawJson = response.text;
    if (!rawJson) return { error: "Sem resposta da IA" };

    const parsed = JSON.parse(rawJson);
    return { data: parsed };
  } catch (err: any) {
    console.error("Erro no Gemini:", err);
    return { error: err.message || "Erro ao conectar com a IA" };
  }
}

export async function saveActivity(data: any) {
  try {
    // Normalizar a data para objeto Date
    let date = new Date();
    if (data.date) {
        date = new Date(data.date);
    }
    
    await prisma.activity.create({
      data: {
        ...data,
        date: date,
        returns: data.returns ? JSON.stringify(data.returns) : null
      }
    });
    
    revalidatePath("/");
    revalidatePath("/semana");
    revalidatePath("/dados");
    
    return { success: true };
  } catch (error: any) {
    console.error("Save error:", error);
    return { error: error.message };
  }
}

export async function deleteActivity(id: string) {
  try {
    await prisma.activity.delete({
      where: { id }
    });
    revalidatePath("/");
    revalidatePath("/semana");
    revalidatePath("/dados");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateActivity(id: string, data: any) {
  try {
    let date = new Date();
    if (data.date) {
        date = new Date(data.date);
    }
    
    await prisma.activity.update({
      where: { id },
      data: {
        ...data,
        date: date,
        returns: data.returns ? JSON.stringify(data.returns) : null
      }
    });
    
    revalidatePath("/");
    revalidatePath("/semana");
    revalidatePath("/dados");
    
    return { success: true };
  } catch (error: any) {
    console.error("Update error:", error);
    return { error: error.message };
  }
}

export async function getActivity(id: string) {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id }
    });
    return { data: activity };
  } catch (error: any) {
    return { error: error.message };
  }
}

