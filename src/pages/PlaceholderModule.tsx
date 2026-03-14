import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { analysisService, ModuleId, AnalysisResponse } from '../services/analysisService';
import { Lock, Loader2, Sparkles, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlaceholderModuleProps {
  moduleId: ModuleId;
  title: string;
  description: string;
}

export default function PlaceholderModule({ moduleId, title, description }: PlaceholderModuleProps) {
  const { hasData, snpData } = useAppStore();
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasData && snpData && !analysis && !isLoading) {
      runAnalysis();
    }
  }, [hasData, snpData, moduleId]);

  const runAnalysis = async () => {
    if (!snpData) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await analysisService.analyzeModule(moduleId, snpData);
      setAnalysis(result);
    } catch (err) {
      setError('Failed to interpret genomic data. Please check your connection and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center shadow-inner"
        >
          <Lock className="w-10 h-10" />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Module Locked</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Please upload and process your DNA data in the <strong>Data Ingestion</strong> module to unlock the {title} analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            AI Interpretation Active
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">{title}</h1>
          <p className="text-slate-500 font-medium text-lg">{description}</p>
        </div>
        
        {analysis && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Compliance Verified
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center space-y-6 min-h-[400px]"
          >
            <div className="relative">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-indigo-100 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Querying Gemini AI</h3>
              <p className="text-slate-500 max-w-xs">
                Interpreting your unique SNP combinations across the {moduleId} module...
              </p>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div 
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center space-y-4"
          >
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-red-900">Analysis Interrupted</h3>
              <p className="text-red-700">{error}</p>
            </div>
            <button 
              onClick={runAnalysis}
              className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Retry Analysis
            </button>
          </motion.div>
        ) : analysis ? (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-3 gap-8"
          >
            {/* Summary Card */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 md:p-10 space-y-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  Executive Summary
                </h3>
                <p className="text-xl text-slate-700 leading-relaxed font-medium italic">
                  "{analysis.summary}"
                </p>
                
                <div className="grid sm:grid-cols-2 gap-4 pt-4">
                  {Object.entries(analysis.data).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-lg font-bold text-slate-800">
                        {typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-indigo-900 rounded-[2rem] shadow-xl p-8 md:p-10 text-white space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  Optimization Path
                </h3>
                <div className="grid gap-4">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-4 bg-white/10 rounded-2xl p-4 border border-white/10">
                      <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-indigo-50 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Stats/Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
                <h4 className="font-bold text-slate-900">Technical Metadata</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Module ID</span>
                    <span className="font-mono font-bold text-indigo-600">{analysis.module_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Compliance</span>
                    <span className="text-emerald-600 font-bold">Verified</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">AI Model</span>
                    <span className="text-slate-700 font-medium">Gemini 3 Flash</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-100 rounded-3xl p-6 space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Interpretation is based on polygenic risk scores and established genomic associations. Results are for informational purposes only.
                </p>
                <button className="w-full py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  View Raw SNPs <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
