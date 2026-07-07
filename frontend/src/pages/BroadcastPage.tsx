import React, { useEffect, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { Megaphone, Users, MessageSquare, Send, CheckCircle2, AlertTriangle, RefreshCcw } from 'lucide-react';

export const BroadcastPage: React.FC = () => {
  const { chats, setChats } = useChatStore();
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  
  // Sending status
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: number; failed: number } | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  // Obtener contactos reales si no están cargados
  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_URL}/chats`);
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (e) {
      console.warn("Falla de API al cargar contactos para difusiones", e);
    }
  };

  useEffect(() => {
    if (chats.length === 0) {
      fetchContacts();
    }
  }, []);

  const handleSelectContact = (contactId: string) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === chats.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(chats.map(c => c.id));
    }
  };

  const handleSendBroadcast = async () => {
    if (selectedContacts.length === 0 || !broadcastMessage.trim() || isSending) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await fetch(`${API_URL}/chats/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_ids: selectedContacts,
          content: broadcastMessage.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSendResult({
          success: data.success_count,
          failed: data.failed_contacts.length
        });
        setBroadcastMessage('');
        setSelectedContacts([]);
      } else {
        throw new Error("HTTP Error");
      }
    } catch (e) {
      console.error("Error sending broadcast campaign:", e);
      setSendResult({
        success: 0,
        failed: selectedContacts.length
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden text-slate-100">
      {/* Header Dashboard Info */}
      <header className="p-6 border-b border-slate-800 bg-slate-950/20 backdrop-blur flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-purple-400" /> Difusiones de Campañas (Broadcast)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Envía mensajes masivos por WhatsApp a tus contactos seleccionados.
          </p>
        </div>
      </header>

      {/* Main Container Grid */}
      <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Contact Selector Checklist (Col Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-4 max-h-full overflow-hidden">
          <div className="flex justify-between items-center shrink-0">
            <h3 className="font-bold text-xs text-slate-400 tracking-wider uppercase flex items-center gap-2">
              <Users className="w-4 h-4" /> Seleccionar Contactos ({selectedContacts.length} de {chats.length})
            </h3>
            
            {chats.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-xs text-purple-400 hover:text-purple-300 font-bold transition-colors"
              >
                {selectedContacts.length === chats.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            )}
          </div>

          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/20 text-slate-500 text-center">
              <Users className="w-12 h-12 stroke-[1.2] mb-3 opacity-40" />
              <p className="text-sm font-semibold">No hay contactos registrados</p>
              <p className="text-xs text-slate-600 mt-1">
                Registra leads o espera a recibir webhooks entrantes para poder enviar una difusión.
              </p>
              <button
                onClick={fetchContacts}
                className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Recargar contactos
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto border border-slate-850 rounded-xl bg-slate-950/20 divide-y divide-slate-850">
              {chats.map(contact => {
                const isChecked = selectedContacts.includes(contact.id);
                return (
                  <div
                    key={contact.id}
                    onClick={() => handleSelectContact(contact.id)}
                    className={`p-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/60 transition-colors ${
                      isChecked ? 'bg-purple-950/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox input wrapper */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // controlamos por onClick del contenedor
                        className="rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-0 cursor-pointer w-4 h-4"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-200">
                          {contact.first_name || 'Cliente'} {contact.last_name || ''}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{contact.phone_number}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {contact.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Compose Message Console (Col Span 1) */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 backdrop-blur-sm flex flex-col gap-4">
            <h3 className="font-bold text-xs text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-400" /> Redactar Difusión
            </h3>
            <p className="text-[11px] text-slate-500">
              Escribe el contenido del mensaje. Se enviará a cada contacto de forma individual.
            </p>

            <div className="flex flex-col gap-3 mt-1">
              <textarea
                rows={5}
                required
                placeholder="Escribe el mensaje de la campaña aquí... (Ej: ¡Hola! Te escribimos porque hay nuevas vacantes abiertas para el curso...)"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs w-full focus:outline-none focus:border-purple-500 text-slate-200 resize-none"
              />
              
              <button
                onClick={handleSendBroadcast}
                disabled={selectedContacts.length === 0 || !broadcastMessage.trim() || isSending}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold rounded-lg transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 text-white"
              >
                <Send className="w-3.5 h-3.5" />
                {isSending ? 'Enviando difusión masiva...' : `Enviar a ${selectedContacts.length} contactos`}
              </button>
            </div>
          </div>

          {/* Broadcast Result Summary card */}
          {sendResult && (
            <div className="bg-slate-950/60 border border-slate-800/85 rounded-xl p-4 flex flex-col gap-3 animate-fade-in">
              <h4 className="font-bold text-xs text-white">Resumen de la Campaña</h4>
              
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Enviados
                  </div>
                  <span className="text-xl font-bold text-white mt-1">{sendResult.success}</span>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" /> Fallidos
                  </div>
                  <span className="text-xl font-bold text-white mt-1">{sendResult.failed}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BroadcastPage;
