import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import InboxPage from './features/chat/components/InboxPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Ruta principal: Bandeja Compartida */}
        <Route path="/inbox" element={<InboxPage />} />

        {/* Páginas legales (requeridas por Meta para publicar la app) */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        
        {/* Redireccionar cualquier ruta no definida al inbox */}
        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
