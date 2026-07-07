import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './pages/Layout';
import InboxPage from './features/chat/components/InboxPage';
import PipelinePage from './pages/PipelinePage';
import ChatbotPage from './pages/ChatbotPage';
import BroadcastPage from './pages/BroadcastPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Páginas legales externas (requeridas por Meta) */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* Aplicación con Shell Layout y navegación lateral */}
        <Route path="/" element={<Layout />}>
          <Route path="inbox" element={<InboxPage />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="chatbot" element={<ChatbotPage />} />
          <Route path="broadcast" element={<BroadcastPage />} />
          
          {/* Index redirige al inbox */}
          <Route index element={<Navigate to="/inbox" replace />} />
        </Route>
        
        {/* Redireccionar cualquier ruta no definida al inbox */}
        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
