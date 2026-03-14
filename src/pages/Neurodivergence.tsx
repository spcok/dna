import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { analysisService, AnalysisResponse } from '../services/analysisService';
import { Loader2, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Neurodivergence() {
  const { hasData, snpData } = useAppStore();
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (hasData && snpData && !analysis && !isLoading) {
      runAnalysis();
    }
  }, [hasData, snpData]);

  const runAnalysis = async () => {
    if (!snpData) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await analysisService.analyzeModule('neurodivergence', snpData);
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
        <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center shadow-inner">
          <Brain className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Module Locked</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Please upload and process your DNA data in the <strong>Data Ingestion</strong> module to unlock the Neurodivergence analysis.
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
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Neurodivergence</h1>
          <p className="text-slate-500 font-medium text-lg">Probability radar chart based on dopamine and serotonin transport SNPs.</p>
        </div>
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
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
            <h3 className="text-xl font-bold text-slate-800">Querying Gemini AI</h3>
          </motion.div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-red-700">{error}</p>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {analysis.data.map((item: any) => (
              <motion.div 
                key={item.condition}
                className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <button 
                  onClick={() => setExpandedId(expandedId === item.condition ? null : item.condition)}
                  className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center font-bold text-indigo-600">
                      {(item.likelihood * 100).toFixed(0)}%
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-lg text-slate-900">{item.condition}</h3>
                      <p className="text-sm text-slate-500">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className={cn("w-6 h-6 text-slate-400 transition-transform", expandedId === item.condition && "rotate-90")} />
                </button>

                <AnimatePresence>
                  {expandedId === item.condition && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6"
                    >
                      <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                        <div className="bg-slate-50 p-4 rounded-2xl">
                          <h4 className="font-bold text-xs text-slate-400 uppercase mb-2">Key Markers</h4>
                          <ul className="text-sm text-slate-700 list-disc list-inside">
                            {item.bento_info.key_markers.map((m: string) => <li key={m}>{m}</li>)}
                          </ul>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl">
                          <h4 className="font-bold text-xs text-slate-400 uppercase mb-2">Mechanism</h4>
                          <p className="text-sm text-slate-700">{item.bento_info.mechanism}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl">
                          <h4 className="font-bold text-xs text-slate-400 uppercase mb-2">Common Traits</h4>
                          <ul className="text-sm text-slate-700 list-disc list-inside">
                            {item.bento_info.common_traits.map((t: string) => <li key={t}>{t}</li>)}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
