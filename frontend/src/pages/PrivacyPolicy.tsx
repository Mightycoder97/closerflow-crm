import React from 'react';
import { Link } from 'react-router-dom';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#0f172a',
  color: '#e2e8f0',
  padding: '2rem',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};

const containerStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
  lineHeight: 1.8,
};

const h1Style: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  color: '#f8fafc',
  marginBottom: '0.5rem',
  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const h2Style: React.CSSProperties = {
  fontSize: '1.3rem',
  fontWeight: 600,
  color: '#f1f5f9',
  marginTop: '2rem',
  marginBottom: '0.75rem',
  borderBottom: '1px solid #334155',
  paddingBottom: '0.5rem',
};

const linkStyle: React.CSSProperties = {
  color: '#60a5fa',
  textDecoration: 'none',
  fontSize: '0.95rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '2rem',
};

const listStyle: React.CSSProperties = {
  paddingLeft: '1.5rem',
  marginBottom: '1rem',
};

const PrivacyPolicy: React.FC = () => {
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <Link to="/inbox" style={linkStyle}>← Volver al inicio</Link>

        <h1 style={h1Style}>Política de Privacidad</h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          Última actualización: Julio 2026
        </p>

        <p>
          En <strong>CloserFlow</strong>, nos comprometemos a proteger la privacidad de nuestros
          usuarios y sus clientes. Esta política describe cómo recopilamos, usamos y protegemos
          la información personal a través de nuestra plataforma de gestión de relaciones con
          clientes (CRM) por WhatsApp.
        </p>

        <h2 style={h2Style}>1. Información que recopilamos</h2>
        <p>Recopilamos la siguiente información a través de nuestra plataforma:</p>
        <ul style={listStyle}>
          <li><strong>Datos del usuario (empresa):</strong> nombre, correo electrónico, nombre de la empresa, número de teléfono de WhatsApp Business.</li>
          <li><strong>Datos de contactos (clientes):</strong> nombre de perfil de WhatsApp, número de teléfono, historial de mensajes intercambiados a través de la plataforma.</li>
          <li><strong>Datos de uso:</strong> interacciones con la plataforma, análisis de conversaciones solicitados, etapas del pipeline de ventas.</li>
        </ul>

        <h2 style={h2Style}>2. Cómo usamos la información</h2>
        <p>Utilizamos la información recopilada para:</p>
        <ul style={listStyle}>
          <li>Gestionar y organizar las conversaciones de WhatsApp Business.</li>
          <li>Proporcionar análisis de conversaciones mediante inteligencia artificial.</li>
          <li>Administrar el pipeline de ventas y seguimiento de leads.</li>
          <li>Asignar conversaciones a agentes de ventas.</li>
          <li>Mejorar la funcionalidad y experiencia de la plataforma.</li>
        </ul>

        <h2 style={h2Style}>3. Servicios de terceros</h2>
        <p>CloserFlow utiliza los siguientes servicios de terceros para operar:</p>
        <ul style={listStyle}>
          <li><strong>Meta (WhatsApp Business API):</strong> para el envío y recepción de mensajes de WhatsApp. Sujeto a la <a href="https://www.whatsapp.com/legal/privacy-policy" style={{ color: '#60a5fa' }}>Política de Privacidad de WhatsApp</a>.</li>
          <li><strong>Supabase:</strong> para almacenamiento seguro de datos en bases de datos PostgreSQL.</li>
          <li><strong>Servicios de IA (DeepSeek/OpenAI):</strong> para análisis de conversaciones bajo demanda. Los datos se envían de forma anónima y no se almacenan por estos proveedores.</li>
          <li><strong>Render:</strong> para el alojamiento del servidor backend.</li>
          <li><strong>Vercel:</strong> para el alojamiento de la interfaz web.</li>
        </ul>

        <h2 style={h2Style}>4. Almacenamiento y seguridad</h2>
        <p>
          Los datos se almacenan en servidores seguros proporcionados por Supabase (AWS).
          Implementamos medidas de seguridad que incluyen:
        </p>
        <ul style={listStyle}>
          <li>Cifrado en tránsito (HTTPS/TLS) para todas las comunicaciones.</li>
          <li>Validación de firma HMAC para webhooks de Meta.</li>
          <li>Autenticación basada en tokens para acceso a la API.</li>
          <li>Aislamiento de datos por empresa (multi-tenant).</li>
        </ul>

        <h2 style={h2Style}>5. Retención de datos</h2>
        <p>
          Los datos se conservan mientras la cuenta de la empresa esté activa en la plataforma.
          Al cancelar el servicio, los datos se eliminarán dentro de los 30 días siguientes,
          salvo obligaciones legales que requieran su conservación.
        </p>

        <h2 style={h2Style}>6. Derechos del usuario</h2>
        <p>De acuerdo con la Ley N° 29733 (Ley de Protección de Datos Personales del Perú), usted tiene derecho a:</p>
        <ul style={listStyle}>
          <li><strong>Acceso:</strong> solicitar una copia de sus datos personales.</li>
          <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
          <li><strong>Cancelación:</strong> solicitar la eliminación de sus datos.</li>
          <li><strong>Oposición:</strong> oponerse al tratamiento de sus datos.</li>
        </ul>

        <h2 style={h2Style}>7. Contacto</h2>
        <p>
          Para ejercer sus derechos o realizar consultas sobre esta política, contáctenos en:
        </p>
        <ul style={listStyle}>
          <li><strong>Email:</strong> soporte@closerflow.com</li>
          <li><strong>Plataforma:</strong> closerflow-crm.vercel.app</li>
        </ul>

        <div style={{ marginTop: '3rem', padding: '1rem', borderTop: '1px solid #334155', color: '#64748b', fontSize: '0.85rem' }}>
          © 2026 CloserFlow. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
