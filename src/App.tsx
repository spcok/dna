import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Ingestion from './pages/Ingestion';
import PlaceholderModule from './pages/PlaceholderModule';
import Neurodivergence from './pages/Neurodivergence';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Ingestion />} />
          <Route path="ancestry" element={<PlaceholderModule moduleId="ancestry" title="Ancestry / Origins" description="Global migratory heat map and genetic clusters." />} />
          <Route path="health" element={<PlaceholderModule moduleId="health" title="Health & Body Systems" description="Polygenic risk score (PRS) dials for major body systems." />} />
          <Route path="neurodivergence" element={<Neurodivergence />} />
          <Route path="traits" element={<PlaceholderModule moduleId="traits" title="Traits" description="Physical, sensory, and circadian trait flip-cards." />} />
          <Route path="pgx" element={<PlaceholderModule moduleId="pgx" title="Pharmacogenomics (PGx)" description="Traffic-light color-coded medicine cabinet for drug metabolism." />} />
          <Route path="nutrigenomics" element={<PlaceholderModule moduleId="nutrigenomics" title="Nutrigenomics" description="Fuel & Engine gauge for macronutrient and vitamin optimizations." />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
