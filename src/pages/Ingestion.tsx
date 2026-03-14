import React, { useState, useEffect } from 'react';
import { parseAncestryDNA, TARGET_RSIDS } from '../lib/combiner';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { Upload, ShieldAlert, FileJson, Activity, Database, BrainCircuit, CheckCircle2, CloudUpload } from 'lucide-react';

export default function Ingestion() {
  const { setSnpData, snpData, hasData } = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Process entirely client-side (The Combiner)
      const data = await parseAncestryDNA(file, TARGET_RSIDS);
      setSnpData(data);
      
      // 2. If user is logged in, push to Supabase
      if (user) {
        setIsUploading(true);
        const { error: uploadError } = await supabase
          .from('extracted_snps')
          .upsert({
            user_id: user.id,
            source: data.source,
            snps: data.snps,
            privacy_check: data.privacy_check
          }, { onConflict: 'user_id' });

        if (uploadError) throw uploadError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Data Ingestion
          </h1>
          <p className="text-slate-500 font-medium">Local-first DNA parsing and analysis engine.</p>
        </div>
        {!user && (
          <button 
            onClick={handleLogin}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            Sign in to Sync
          </button>
        )}
      </header>

      {/* Medical Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
        <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 space-y-2">
          <p className="font-bold uppercase tracking-wider text-amber-700 text-xs">Medical Disclaimer & Privacy Notice</p>
          <p className="leading-relaxed">
            <strong>DO NOT DIAGNOSE.</strong> You are interpreting probabilities based on provided SNP data. You must never state that a user has a condition, only that they possess a genetic variant associated with an increased/decreased likelihood.
          </p>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-200/60 font-medium">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            Privacy Check: All parsing is done 100% client-side. Your raw DNA file never leaves your device.
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              1. Local Ingestion
            </h2>
          </div>
          
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors group relative overflow-hidden">
            <input
              type="file"
              id="dna-upload"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              accept=".txt,.csv"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-4 relative z-0">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-700 text-lg">
                  {file ? file.name : 'Upload Raw DNA Data'}
                </p>
                <p className="text-sm text-slate-500">
                  Supports AncestryDNA & 23andMe (.txt, .csv)
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={processFile}
            disabled={!file || isProcessing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {isProcessing || isUploading ? (
              <>
                <Activity className="w-5 h-5 animate-pulse" />
                {isUploading ? 'Syncing to Cloud...' : 'Processing locally...'}
              </>
            ) : (
              <>
                <BrainCircuit className="w-5 h-5" />
                {hasData ? 'Re-extract & Sync' : 'Extract & Sync'}
              </>
            )}
          </button>
          {error && <p className="text-red-600 text-sm font-medium text-center">{error}</p>}
          
          {!user && hasData && (
            <p className="text-xs text-slate-500 text-center italic">
              Note: Data is currently stored in local memory only. Sign in to sync across devices.
            </p>
          )}
        </div>

        {/* Results Section */}
        <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-8 space-y-6 text-slate-300 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
              <FileJson className="w-5 h-5 text-emerald-400" />
              2. Extracted Payload
            </h2>
            {hasData && snpData && (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-wider uppercase rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                privacy_check: {snpData.privacy_check.toString()}
              </span>
            )}
          </div>
          
          {hasData && snpData ? (
            <>
              <div className="flex items-center justify-between gap-2 text-emerald-400 bg-emerald-400/10 p-3 rounded-xl border border-emerald-400/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">
                    Modules unlocked.
                  </p>
                </div>
                {user && (
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold opacity-70">
                    <CloudUpload className="w-3 h-3" />
                    Synced
                  </div>
                )}
              </div>
              <div className="bg-black/50 rounded-2xl p-5 overflow-x-auto flex-1 border border-white/5">
                <pre className="text-emerald-400 font-mono text-sm leading-relaxed">
                  {JSON.stringify(snpData, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <FileJson className="w-12 h-12 text-slate-600" />
              <p className="text-sm max-w-[250px]">
                Upload and process a file to view the extracted JSON payload and unlock the analytical modules.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
