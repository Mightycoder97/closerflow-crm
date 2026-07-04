import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import InboxPage from './features/chat/components/InboxPage';

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Ruta principal: Bandeja Compartida */}
        <Route path="/inbox" element={<InboxPage />} />
        
        {/* Redireccionar cualquier ruta no definida al inbox */}
        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
