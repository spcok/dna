// Supabase Edge Function Template (Deno)
// This file is for reference and manual deployment to your Supabase project.
// Deployment: supabase functions deploy interpret-dna

/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  const { moduleId, snps, userId } = await req.json()

  // 1. Call Gemini API
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Interpret these SNPs for ${moduleId}: ${JSON.stringify(snps)}` }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  })

  const result = await response.json()
  const interpretedData = JSON.parse(result.candidates[0].content.parts[0].text)

  // 2. Cache in Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  await supabase
    .from('module_results')
    .upsert({ user_id: userId, module_id: moduleId, result: interpretedData })

  return new Response(JSON.stringify(interpretedData), { headers: { 'Content-Type': 'application/json' } })
})
*/
