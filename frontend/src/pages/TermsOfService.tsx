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

const TermsOfService: React.FC = () => {
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <Link to="/inbox" style={linkStyle}>← Volver al inicio</Link>

        <h1 style={h1Style}>Términos de Servicio</h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          Última actualización: Julio 2026
        </p>

        <p>
          Bienvenido a <strong>CloserFlow</strong>. Al acceder y utilizar nuestra plataforma,
          usted acepta estos Términos de Servicio. Por favor, léalos atentamente.
        </p>

        <h2 style={h2Style}>1. Descripción del servicio</h2>
        <p>
          CloserFlow es una plataforma de gestión de relaciones con clientes (CRM) que permite
          a las empresas gestionar sus comunicaciones de WhatsApp Business, organizar su
          pipeline de ventas, y obtener análisis de conversaciones mediante inteligencia artificial.
        </p>

        <h2 style={h2Style}>2. Requisitos de uso</h2>
        <p>Para utilizar CloserFlow, usted debe:</p>
        <ul style={listStyle}>
          <li>Ser mayor de 18 años o tener la capacidad legal para celebrar contratos.</li>
          <li>Proporcionar información precisa y actualizada al registrarse.</li>
          <li>Tener una cuenta de WhatsApp Business API activa y configurada.</li>
          <li>Cumplir con las <a href="https://www.whatsapp.com/legal/business-policy" style={{ color: '#60a5fa' }}>Políticas de WhatsApp Business</a> y la <a href="https://www.whatsapp.com/legal/commerce-policy" style={{ color: '#60a5fa' }}>Política de Comercio de WhatsApp</a>.</li>
        </ul>

        <h2 style={h2Style}>3. Responsabilidades del usuario</h2>
        <p>Al usar CloserFlow, usted se compromete a:</p>
        <ul style={listStyle}>
          <li>No enviar mensajes de spam o no solicitados a través de la plataforma.</li>
          <li>Obtener el consentimiento previo de los destinatarios antes de enviar mensajes comerciales.</li>
          <li>No utilizar la plataforma para actividades ilegales o fraudulentas.</li>
          <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
          <li>Cumplir con todas las leyes aplicables, incluyendo la Ley N° 29733 de Protección de Datos Personales del Perú.</li>
        </ul>

        <h2 style={h2Style}>4. Propiedad intelectual</h2>
        <p>
          <strong>CloserFlow:</strong> La plataforma, su diseño, código, marca y logotipos son
          propiedad exclusiva de CloserFlow. Queda prohibida su reproducción sin autorización.
        </p>
        <p>
          <strong>Datos del usuario:</strong> Usted conserva la propiedad de todos los datos
          que ingrese en la plataforma, incluyendo conversaciones, contactos y análisis generados.
        </p>

        <h2 style={h2Style}>5. Disponibilidad del servicio</h2>
        <p>
          CloserFlow se encuentra actualmente en fase beta. Si bien nos esforzamos por
          mantener la disponibilidad del servicio, no garantizamos un tiempo de actividad
          del 100%. Podremos realizar mantenimientos programados con previo aviso.
        </p>
        <p>
          La disponibilidad del servicio de mensajería depende de Meta (WhatsApp Business API)
          y está sujeta a sus propios términos y condiciones.
        </p>

        <h2 style={h2Style}>6. Limitación de responsabilidad</h2>
        <p>
          CloserFlow no será responsable por:
        </p>
        <ul style={listStyle}>
          <li>Interrupciones del servicio causadas por terceros (Meta, proveedores de hosting, etc.).</li>
          <li>Pérdida de datos debido a fallos en servicios externos.</li>
          <li>Daños indirectos, incidentales o consecuentes derivados del uso de la plataforma.</li>
          <li>Contenido de los mensajes enviados por los usuarios a través de la plataforma.</li>
        </ul>

        <h2 style={h2Style}>7. Suspensión y terminación</h2>
        <p>
          Nos reservamos el derecho de suspender o cancelar su cuenta si detectamos
          violaciones a estos términos, uso abusivo de la plataforma, o incumplimiento
          de las políticas de WhatsApp. Usted puede cancelar su cuenta en cualquier momento
          contactándonos.
        </p>

        <h2 style={h2Style}>8. Modificaciones</h2>
        <p>
          Nos reservamos el derecho de modificar estos términos en cualquier momento.
          Los cambios serán notificados a través de la plataforma o por correo electrónico.
          El uso continuado del servicio después de la notificación constituye la aceptación
          de los nuevos términos.
        </p>

        <h2 style={h2Style}>9. Ley aplicable</h2>
        <p>
          Estos términos se rigen por las leyes de la República del Perú. Cualquier
          disputa será resuelta ante los tribunales competentes de la ciudad de Lima, Perú.
        </p>

        <h2 style={h2Style}>10. Contacto</h2>
        <p>
          Para consultas sobre estos términos, contáctenos en:
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

export default TermsOfService;
