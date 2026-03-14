-- SQL Script for Supabase Setup
-- Genomic Interpretation Suite

-- 1. Table for extracted SNP chunks
CREATE TABLE IF NOT EXISTS public.extracted_snps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    snps JSONB NOT NULL,
    privacy_check BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table for AI-generated module results
CREATE TABLE IF NOT EXISTS public.module_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL, -- 'ancestry', 'health', 'neuro', 'traits', 'pgx', 'nutrigenomics'
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure one result per module per user (can be updated)
    UNIQUE(user_id, module_id)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.extracted_snps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_results ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Users can only access their own data
CREATE POLICY "Users can view their own extracted snps" 
ON public.extracted_snps FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extracted snps" 
ON public.extracted_snps FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extracted snps" 
ON public.extracted_snps FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own module results" 
ON public.module_results FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own module results" 
ON public.module_results FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own module results" 
ON public.module_results FOR UPDATE 
USING (auth.uid() = user_id);

-- 5. Helper function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.extracted_snps
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
