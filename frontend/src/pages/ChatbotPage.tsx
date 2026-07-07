import React, { useEffect, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { Bot, Plus, Trash2, Power, X, Sparkles, MessageSquare } from 'lucide-react';

export const ChatbotPage: React.FC = () => {
  const { chatbotRules, fetchChatbotRules, createChatbotRule, toggleChatbotRule, deleteChatbotRule } = useChatStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [triggerKeyword, setTriggerKeyword] = useState('');
  const [responseContent, setResponseContent] = useState('');

  // Simulator state
  const [simulatedInput, setSimulatedInput] = useState('');
  const [simulatedReply, setSimulatedReply] = useState<string | null>(null);

  useEffect(() => {
    fetchChatbotRules();
  }, []);

  const handleCreateRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerKeyword.trim() || !responseContent.trim()) return;

    await createChatbotRule(triggerKeyword.trim(), responseContent.trim());
    setTriggerKeyword('');
    setResponseContent('');
    setShowAddModal(false);
  };

  const handleToggle = async (ruleId: string, currentStatus: boolean) => {
    await toggleChatbotRule(ruleId, !currentStatus);
  };

  // Chatbot simulator logic
  const handleTestSimulate = () => {
    if (!simulatedInput.trim()) {
      setSimulatedReply(null);
      return;
    }

    const matched = chatbotRules.find(
      rule => rule.is_active && simulatedInput.toLowerCase().includes(rule.trigger_keyword.toLowerCase())
    );

    if (matched) {
      setSimulatedReply(matched.response_content);
    } else {
      setSimulatedReply("Ninguna palabra clave activa coincide. Mensaje ignorado.");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden text-slate-100">
      {/* Header Dashboard Info */}
      <header className="p-6 border-b border-slate-800 bg-slate-950/20 backdrop-blur flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" /> Auto-Respuestas del Chatbot
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configura disparadores automáticos por palabras clave en WhatsApp para ahorrar tiempo.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-semibold rounded-lg transition-all shadow-md shadow-purple-600/20 text-white"
        >
          <Plus className="w-4 h-4" /> Crear Disparador
        </button>
      </header>

      {/* Main Grid: Left Rules List, Right Simulator Console */}
      <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Rules List (Col Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="font-bold text-xs text-slate-400 tracking-wider uppercase flex items-center gap-2">
            Palabras Clave Registradas ({chatbotRules.length})
          </h3>

          {chatbotRules.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/20 text-slate-500 text-center">
              <Bot className="w-12 h-12 stroke-[1.2] mb-3 opacity-40" />
              <p className="text-sm font-semibold">Aún no hay reglas configuradas</p>
              <p className="text-xs text-slate-600 mt-1 max-w-xs">
                Crea tu primera regla de auto-respuesta. Ej: Cuando un cliente diga "precio", respóndele con tu lista de precios.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chatbotRules.map(rule => (
                <div
                  key={rule.id}
                  className={`p-4 bg-slate-950/35 border rounded-xl flex flex-col justify-between gap-4 transition-all duration-300 ${
                    rule.is_active ? 'border-slate-850 hover:border-slate-700' : 'border-slate-900/60 opacity-60'
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 truncate">
                        Clave: "{rule.trigger_keyword}"
                      </span>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Toggle Status Button */}
                        <button
                          onClick={() => handleToggle(rule.id, rule.is_active)}
                          className={`p-1.5 rounded-lg transition-colors border ${
                            rule.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                              : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-850'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => deleteChatbotRule(rule.id)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 font-medium leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-850/50 mt-1 whitespace-pre-wrap">
                      {rule.response_content}
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-850/40 shrink-0">
                    <span>
                      Modificado: {new Date(rule.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="font-semibold">
                      {rule.is_active ? 'Activo' : 'Desactivado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chatbot Test Simulator Console (Col Span 1) */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 backdrop-blur-sm flex flex-col gap-4">
          <h3 className="font-bold text-xs text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" /> Consola de Prueba
          </h3>
          <p className="text-[11px] text-slate-500">
            Prueba tus reglas de chatbot de forma segura simulando un mensaje de cliente.
          </p>

          <div className="flex flex-col gap-2 mt-2">
            <textarea
              rows={3}
              placeholder="Escribe un mensaje de prueba... (Ej: Hola, me gustaría saber el precio del curso)"
              value={simulatedInput}
              onChange={(e) => setSimulatedInput(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs w-full focus:outline-none focus:border-purple-500 text-slate-200 resize-none"
            />
            <button
              onClick={handleTestSimulate}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-xs font-semibold rounded-lg transition-all"
            >
              Simular Recepción
            </button>
          </div>

          {simulatedReply && (
            <div className="flex flex-col gap-2.5 border-t border-slate-850 pt-4 mt-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                Respuesta del Bot
              </span>
              
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-start gap-2.5">
                <div className="p-1 bg-purple-600/10 text-purple-400 rounded shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs text-slate-300 leading-normal whitespace-pre-wrap">
                  {simulatedReply}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl animate-fade-in text-slate-100">
            <div className="p-5 border-b border-slate-850 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">Crear Disparador del Chatbot</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRuleSubmit} className="p-5 flex flex-col gap-4">
              {/* Trigger Keyword Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Palabra Clave</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. precio"
                  value={triggerKeyword}
                  onChange={(e) => setTriggerKeyword(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                />
                <span className="text-[9px] text-slate-500">
                  Si el mensaje del cliente contiene esta palabra clave, el bot responderá de forma automática.
                </span>
              </div>

              {/* Response Content Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Contenido de Auto-Respuesta</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ej. ¡Hola! El costo del curso es de $250 USD y puedes financiarlo en 3 cuotas mensuales de $95 USD."
                  value={responseContent}
                  onChange={(e) => setResponseContent(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs w-full focus:outline-none focus:border-purple-500 text-slate-200 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-850 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-semibold rounded-lg transition-all shadow-md shadow-purple-600/20 text-white"
                >
                  Crear Regla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotPage;
