import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "../lib/supabase";
import { CombinerResult, SNP_DICTIONARY } from "../lib/combiner";

// Initialize Gemini
// In this environment, the API key is injected into process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export type ModuleId = 'ancestry' | 'health' | 'neurodivergence' | 'traits' | 'pgx' | 'nutrigenomics';

export interface AnalysisResponse {
  module_id: ModuleId;
  summary: string;
  data: any;
  recommendations: string[];
  compliance_check: boolean;
}

/**
 * Analysis Service
 * Handles module-specific SNP chunking, AI querying, and result caching.
 */
export const analysisService = {
  /**
   * Performs analysis for a specific module.
   * Checks cache first, then queries Gemini.
   */
  async analyzeModule(moduleId: ModuleId, snpData: CombinerResult): Promise<AnalysisResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Check Cache (Supabase module_results)
    if (user) {
      const { data: cachedResult } = await supabase
        .from('module_results')
        .select('result')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .single();

      if (cachedResult) {
        return cachedResult.result as AnalysisResponse;
      }
    }

    // 2. Filter SNPs for this module
    const relevantSnps: Record<string, string | null> = {};
    const targetRsids = SNP_DICTIONARY[moduleId] || [];
    for (const rsid of targetRsids) {
      if (snpData.snps[rsid] !== undefined) {
        relevantSnps[rsid] = snpData.snps[rsid];
      }
    }

    // 3. Query Gemini
    const result = await this.queryGemini(moduleId, relevantSnps);

    // 4. Cache Result
    if (user && result) {
      await supabase
        .from('module_results')
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          result: result
        }, { onConflict: 'user_id,module_id' });
    }

    return result;
  },

  /**
   * Internal method to query Gemini with module-specific prompts and schemas.
   */
  async queryGemini(moduleId: ModuleId, snps: Record<string, string | null>): Promise<AnalysisResponse> {
    const model = "gemini-3-flash-preview";
    
    const systemInstruction = `
      You are an expert Genomic AI Interpreter. 
      Your task is to interpret human SNP data for the "${moduleId}" module.
      
      STRICT RULES:
      1. DO NOT DIAGNOSE. Only interpret probabilities and associations.
      2. Use "increased/decreased likelihood" instead of "you have X".
      3. If an RSID is null, return null for that specific data point.
      4. Summary must be strictly under 50 words.
      5. Output ONLY valid, minified JSON. No markdown, no preambles.
      6. Include "compliance_check": true.
    `;

    const prompts: Record<ModuleId, string> = {
      ancestry: "Interpret these SNPs for ancient migration paths and genetic clusters. Focus on deep ancestry markers.",
      health: "Interpret these SNPs for polygenic risk scores across major body systems (Cardiovascular, Metabolic, Immune).",
      neurodivergence: "Interpret these SNPs (focusing on DRD2, DRD4, COMT) for dopamine and serotonin transport probabilities related to ADHD, Autism, and Dyslexia overlap.",
      traits: "Interpret these SNPs for physical (ACTN3), sensory, and circadian (CLOCK) traits.",
      pgx: "Interpret these SNPs (CYP450) for drug metabolism rates (Ultra-rapid, Normal, Intermediate, Poor).",
      nutrigenomics: "Interpret these SNPs for macronutrient sensitivity and vitamin absorption optimizations."
    };

    const schemas: Record<ModuleId, any> = {
      neurodivergence: {
        type: Type.OBJECT,
        properties: {
          module_id: { type: Type.STRING },
          summary: { type: Type.STRING },
          compliance_check: { type: Type.BOOLEAN },
          data: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                condition: { type: Type.STRING },
                likelihood: { type: Type.NUMBER },
                description: { type: Type.STRING },
                bento_info: {
                  type: Type.OBJECT,
                  properties: {
                    key_markers: { type: Type.ARRAY, items: { type: Type.STRING } },
                    mechanism: { type: Type.STRING },
                    common_traits: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              required: ["condition", "likelihood", "description", "bento_info"]
            }
          },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["module_id", "summary", "data", "compliance_check"]
      },
      // Default schema for others (can be specialized later)
      traits: {
        type: Type.OBJECT,
        properties: {
          module_id: { type: Type.STRING },
          summary: { type: Type.STRING },
          compliance_check: { type: Type.BOOLEAN },
          data: { type: Type.OBJECT },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["module_id", "summary", "data", "compliance_check"]
      },
      ancestry: { type: Type.OBJECT, properties: { module_id: { type: Type.STRING }, summary: { type: Type.STRING }, compliance_check: { type: Type.BOOLEAN }, data: { type: Type.OBJECT }, recommendations: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["module_id", "summary", "data", "compliance_check"] },
      health: { type: Type.OBJECT, properties: { module_id: { type: Type.STRING }, summary: { type: Type.STRING }, compliance_check: { type: Type.BOOLEAN }, data: { type: Type.OBJECT }, recommendations: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["module_id", "summary", "data", "compliance_check"] },
      pgx: { type: Type.OBJECT, properties: { module_id: { type: Type.STRING }, summary: { type: Type.STRING }, compliance_check: { type: Type.BOOLEAN }, data: { type: Type.OBJECT }, recommendations: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["module_id", "summary", "data", "compliance_check"] },
      nutrigenomics: { type: Type.OBJECT, properties: { module_id: { type: Type.STRING }, summary: { type: Type.STRING }, compliance_check: { type: Type.BOOLEAN }, data: { type: Type.OBJECT }, recommendations: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["module_id", "summary", "data", "compliance_check"] }
    };

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: `SNPs: ${JSON.stringify(snps)}\n\nPrompt: ${prompts[moduleId]}`,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schemas[moduleId] || schemas.traits
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error(`Gemini Query Error (${moduleId}):`, error);
      throw error;
    }
  }
};
