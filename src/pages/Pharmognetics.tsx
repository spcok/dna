import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { analysisService } from '../services/analysisService';
import { Pill, AlertTriangle, CheckCircle, Info, Activity, ShieldAlert } from 'lucide-react';

interface PGxData {
  module: string;
  privacy_check: boolean;
  metabolism_profiles: Array<{
    gene: string;
    inferred_star_allele: string;
    metabolism_rate: string;
    affected_drugs: string[];
  }>;
  medicine_cabinet_warnings: Array<{
    drug_class: string;
    warning_level: 'Red' | 'Yellow' | 'Green';
    recommendation: string;
  }>;
}

export default function Pharmacogenomics() {
  const { snpData, getCachedModule, setModuleCache } = useAppStore();
  const [data, setData] = useState<PGxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModuleData() {
      if (!snpData) {
        setError('No SNP data available. Please upload your DNA file.');
        setLoading(false);
        return;
      }

      // 1. Check local cache
      const cached = getCachedModule('pgx');
      if (cached) {
        setData(cached.data as PGxData);
        setLoading(false);
        return;
      }

      try {
        // 2. Process via analysisService
        const result = await analysisService.analyzeModule('pgx', snpData);
        
        // 3. Update local cache
        setModuleCache('pgx', result);
        setData(result.data as PGxData);
      } catch (err: any) {
        setError(err.message || 'Failed to load pharmacogenomics profile.');
      } finally {
        setLoading(false);
      }
    }

    fetchModuleData();
  }, [snpData, getCachedModule, setModuleCache]);

  if (loading) return <div className="flex justify-center items-center h-screen animate-pulse text-teal-500">Analyzing Metabolic Pathways...</div>;
  if (error) return <div className="p-6 bg-red-50 text-red-600 rounded-lg shadow-sm">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      
      <header className="border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Pill className="w-8 h-8 text-teal-600" />
          Pharmacogenomics (PGx)
        </h1>
        <p className="text-gray-500 mt-2">
          Your digital medicine cabinet. CPIC-aligned insights into how your liver enzymes metabolize specific medications.
        </p>
      </header>

      {/* The Medicine Cabinet (Actionable Warnings) */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-gray-500"/>
          Digital Medicine Cabinet
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data.medicine_cabinet_warnings || []).map((warning, idx) => {
            const isRed = warning.warning_level === 'Red';
            const isYellow = warning.warning_level === 'Yellow';
            const isGreen = warning.warning_level === 'Green';

            return (
              <div key={idx} className={`p-5 rounded-xl border-l-4 ${
                isRed ? 'bg-red-50 border-red-500' : 
                isYellow ? 'bg-amber-50 border-amber-500' : 
                'bg-emerald-50 border-emerald-500'
              }`}>
                <div className="flex items-start gap-3">
                  {isGreen ? <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" /> : 
                             <AlertTriangle className={`w-6 h-6 shrink-0 mt-0.5 ${isRed ? 'text-red-600' : 'text-amber-600'}`} />}
                  <div>
                    <h3 className={`font-semibold ${isRed ? 'text-red-900' : isYellow ? 'text-amber-900' : 'text-emerald-900'}`}>
                      {warning.drug_class}
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-0.5 rounded ${
                        isRed ? 'bg-red-200 text-red-800' : 
                        isYellow ? 'bg-amber-200 text-amber-800' : 
                        'bg-emerald-200 text-emerald-800'
                      }`}>
                        {warning.warning_level} Risk
                      </span>
                    </h3>
                    <p className={`text-sm mt-1 leading-relaxed ${isRed ? 'text-red-800' : isYellow ? 'text-amber-800' : 'text-emerald-800'}`}>
                      {warning.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metabolic Raw Profiles (The Science) */}
      <div className="pt-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-500"/>
          Liver Enzyme Profile (CYP450)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(data.metabolism_profiles || []).map((profile, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-bold bg-gray-100 text-gray-800">
                  {profile.gene}
                </span>
                <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded">
                  {profile.inferred_star_allele}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Rate: <span className="text-teal-700">{profile.metabolism_rate}</span>
              </p>
              <div className="mt-3 pt-3 border-t border-gray-50">
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Affected Drugs</p>
                <div className="flex flex-wrap gap-1">
                  {(profile.affected_drugs || []).map((drug, i) => (
                    <span key={i} className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full">
                      {drug}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-sm text-blue-800 mt-6">
        <Info className="w-5 h-5 shrink-0" />
        <p><strong>Clinical Disclaimer:</strong> This tool is for educational purposes. Never change your medication dosage without consulting a prescribing physician. These interpretations are based on CPIC guidelines but require clinical validation.</p>
      </div>

    </div>
  );
}