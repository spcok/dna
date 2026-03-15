import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { analysisService } from '../services/analysisService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Brain, AlertCircle, Activity, Info } from 'lucide-react';

// Define the shape of our new perfect JSON
interface NeuroData {
  module: string;
  privacy_check: boolean;
  radar_data: Array<{
    trait: string;
    probability: number;
  }>;
  key_findings: Array<{
    gene: string;
    rsid: string;
    impact: 'High' | 'Medium' | 'Low';
    summary: string;
  }>;
}

export default function Neurodivergence() {
  const { snpData, getCachedModule, setModuleCache } = useAppStore();
  const [data, setData] = useState<NeuroData | null>(null);
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
      const cached = getCachedModule('neurodivergence');
      if (cached) {
        setData(cached as unknown as NeuroData);
        setLoading(false);
        return;
      }

      try {
        // 2. Process via analysisService (which handles Supabase caching and AI query)
        const result = await analysisService.analyzeModule('neurodivergence', snpData);
        
        // 3. Update local cache
        setModuleCache('neurodivergence', result);
        setData(result as unknown as NeuroData);
      } catch (err: any) {
        setError(err.message || 'Failed to load neurogenetics profile.');
      } finally {
        setLoading(false);
      }
    }

    fetchModuleData();
  }, [snpData, getCachedModule, setModuleCache]);

  if (loading) return <div className="flex justify-center items-center h-screen animate-pulse text-indigo-500">Sequencing Neural Pathways...</div>;
  if (error) return <div className="p-6 bg-red-50 text-red-600 rounded-lg shadow-sm">Error: {error}</div>;
  if (!data) return null;

  // Format data for the radar chart (converting 0.55 to 55 for visual scaling)
  const chartData = (data.radar_data || []).map(d => ({
    subject: d.trait,
    A: d.probability * 100,
    fullMark: 100,
  }));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      
      <header className="border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Brain className="w-8 h-8 text-indigo-600" />
          Neurological Profile
        </h1>
        <p className="text-gray-500 mt-2">
          Mapping your dopaminergic, serotonergic, and structural neuro-pathways.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Radar Chart Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Cognitive Processing Overlap</h2>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Probability (%)"
                  dataKey="A"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fill="#4f46e5"
                  fillOpacity={0.4}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Propensity']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Findings Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500"/>
            Genetic Highlights
          </h2>
          
          {(data.key_findings || []).map((finding, index) => (
            <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {finding.gene}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">{finding.rsid}</span>
                </div>
                {/* Impact Badge */}
                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                  finding.impact === 'High' ? 'bg-rose-100 text-rose-700' :
                  finding.impact === 'Medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {finding.impact} Impact
                </span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{finding.summary}</p>
            </div>
          ))}
          
          <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-sm text-blue-800 mt-6">
            <Info className="w-5 h-5 shrink-0" />
            <p><strong>Note:</strong> Genetics represent probabilities, not destinies. Environmental factors and neuroplasticity play massive roles in how these traits manifest.</p>
          </div>
        </div>

      </div>
    </div>
  );
}