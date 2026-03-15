import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { moduleId, snps, userId } = await req.json()
    
    // Authenticate the user securely
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    // STRICT SYSTEM PROMPT
    const systemInstruction = `
      You are an expert Genomic AI Interpreter. Your task is to interpret human SNP data for the "${moduleId}" module.
      
      STRICT RULES:
      1. DO NOT DIAGNOSE. Only interpret probabilities and associations.
      2. Use "increased/decreased likelihood" instead of "you have X".
      3. If an RSID is null, return null for that specific data point.
      4. Summary must be strictly under 50 words.
      5. Output ONLY valid, minified JSON. No markdown (like \`\`\`json), no preambles.
      6. Include "privacy_check": true.
    `;

    // Dynamic Prompts based on the module being called
    let modulePrompt = "";
    if (moduleId === 'neurodivergence') {
      modulePrompt = `
        Interpret these SNPs for dopamine and serotonin transport probabilities related to ADHD, Autism, and Dyslexia overlap.
        
        REQUIRED JSON SCHEMA:
        {
          "module": "Neurodivergence",
          "privacy_check": true,
          "radar_data": [
            { "trait": "ADHD/Executive Function", "probability": 0.0 to 1.0 },
            { "trait": "Autism Spectrum Overlap", "probability": 0.0 to 1.0 },
            { "trait": "Dyslexia/Language", "probability": 0.0 to 1.0 },
            { "trait": "Sensory Processing / HSP", "probability": 0.0 to 1.0 },
            { "trait": "Tic/Motor Markers", "probability": 0.0 to 1.0 }
          ],
          "key_findings": [
            { "gene": "string", "rsid": "string", "impact": "High" | "Medium" | "Low", "summary": "string" }
          ]
        }
      `;
    } else if (moduleId === 'pgx') {
      modulePrompt = `
        Interpret these SNPs (CYP450 family, SLCO1B1) using CPIC guidelines to calculate Star Alleles and drug metabolism rates.
        
        REQUIRED JSON SCHEMA:
        {
          "module": "Pharmacogenomics",
          "privacy_check": true,
          "metabolism_profiles": [
            { "gene": "string", "inferred_star_allele": "string", "metabolism_rate": "string", "affected_drugs": ["Drug1", "Drug2"] }
          ],
          "medicine_cabinet_warnings": [
            { "drug_class": "string", "warning_level": "Red" | "Yellow" | "Green", "recommendation": "string" }
          ]
        }
      `;
    } else {
      modulePrompt = `Interpret these SNPs for ${moduleId}. Return a structured JSON summary.`;
    }

    // Call Gemini 2.5 Pro (Low temperature for clinical accuracy)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }]},
        contents: [{ parts: [{ text: `SNPs: ${JSON.stringify(snps)}\n\nPrompt: ${modulePrompt}` }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
      })
    })

    const result = await response.json()
    
    // Parse the AI output to ensure it's valid JSON before saving
    let rawText = result.candidates[0].content.parts[0].text
    // Clean up markdown if the AI mistakenly includes it
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
    const interpretedData = JSON.parse(rawText)

    // Cache the result to save tokens on future visits
    await supabase
      .from('module_results')
      .upsert({ user_id: userId, module_id: moduleId, result: interpretedData }, { onConflict: 'user_id,module_id' })

    return new Response(JSON.stringify(interpretedData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})