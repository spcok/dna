import { supabase } from "../lib/supabase";
import { CombinerResult } from "../lib/combiner";

export type ModuleId = 'ancestry' | 'health' | 'neurodivergence' | 'traits' | 'pgx' | 'nutrigenomics';

export type AnalysisResponse = any;

export const analysisService = {
  async analyzeModule(moduleId: ModuleId, snpData: CombinerResult): Promise<AnalysisResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("User must be authenticated to run analysis.");

    // 1. Check Cache First (Zero Token Cost)
    const { data: cachedResult } = await supabase
      .from('module_results')
      .select('result')
      .eq('user_id', user.id)
      .eq('module_id', moduleId)
      .single();

    if (cachedResult) {
      return cachedResult.result as AnalysisResponse;
    }

    // 2. Query Secure Edge Function
    // We send the specific module request. The Edge Function handles the Gemini API.
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('interpret-dna', {
      body: { 
        moduleId: moduleId,
        snps: snpData.snps,
        userId: user.id
      },
    });

    if (edgeError) {
      console.error("Edge Function Error:", edgeError);
      throw new Error("Failed to process genomic data securely.");
    }

    return edgeData as AnalysisResponse;
  }
};