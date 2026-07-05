import React, { useState, useEffect } from 'react';
import { useChatStore } from '../../../store/useChatStore';
import { wsClient } from '../../../services/webSocketClient';
import { MessageSquare, User, Sparkles, Send, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';
import { Contact, Message, AIAnalysis } from '../../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const InboxPage: React.FC = () => {
  const { chats, activeChatId, messages, setChats, setActiveChatId, setMessages, updateChatStatus } = useChatStore();
  const [inputText, setInputText] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // 1. Obtener los chats reales desde el backend al cargar la página
  const fetchChats = async () => {
    try {
      const res = await fetch(`${API_URL}/chats`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setChats(data);
        } else {
          loadDummyChats();
        }
      } else {
        loadDummyChats();
      }
    } catch (e) {
      console.warn("Falla de API, cargando datos de prueba:", e);
      loadDummyChats();
    }
  };

  const loadDummyChats = () => {
    const dummyChats: Contact[] = [
      {
        id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
        business_profile_id: 'b1',
        first_name: 'Mateo',
        last_name: 'Gomez',
        phone_number: '+54 9 11 2345-6789',
        email: 'mateo@mail.com',
        status: 'ENGAGED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2a3b4c5d-6e7f-8g9h-0i1j-2k3l4m5n6o7p',
        business_profile_id: 'b1',
        first_name: 'Sofía',
        last_name: 'Díaz',
        phone_number: '+54 9 11 9876-5432',
        email: 'sofia@mail.com',
        status: 'NEW',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    setChats(dummyChats);
  };

  useEffect(() => {
    wsClient.connect();
    fetchChats();
    
    return () => {
      wsClient.disconnect();
    };
  }, [setChats]);

  // Cada vez que llega un mensaje por WebSockets, actualizamos la lista
  useEffect(() => {
    // Si hay un mensaje nuevo del ws que modifica los chats, re-consultamos
    // En producción se maneja de forma local, pero por simplicidad refrescamos la lista
    const interval = setInterval(fetchChats, 4000);
    return () => clearInterval(interval);
  }, []);

  // 2. Obtener los mensajes del chat seleccionado desde el backend
  const handleSelectChat = async (chatId: string) => {
    setActiveChatId(chatId);
    setAiAnalysis(null); 
    
    try {
      const res = await fetch(`${API_URL}/chats/${chatId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      } else {
        loadDummyMessages(chatId);
      }
    } catch (e) {
      console.warn("Falla de API, cargando mensajes de prueba:", e);
      loadDummyMessages(chatId);
    }
  };

  const loadDummyMessages = (chatId: string) => {
    const dummyMessages: Message[] = [
      {
        id: 'm1',
        contact_id: chatId,
        direction: 'INBOUND',
        content: 'Hola, vi su anuncio del curso online de programación. ¿Tienen opción de pago en cuotas?',
        message_type: 'TEXT',
        meta_message_id: 'meta_1',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'm2',
        contact_id: chatId,
        direction: 'OUTBOUND',
        content: 'Hola! Sí, claro. Contamos con financiamiento interno de hasta 3 cuotas mensuales.',
        message_type: 'TEXT',
        meta_message_id: 'meta_2',
        created_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'm3',
        contact_id: chatId,
        direction: 'INBOUND',
        content: 'Excelente, ¿me pasas los costos totales de las cuotas? El precio al contado se me sale un poco de presupuesto.',
        message_type: 'TEXT',
        meta_message_id: 'meta_3',
        created_at: new Date(Date.now() - 600000).toISOString()
      }
    ];
    setMessages(dummyMessages);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    const newMsg: Message = {
      id: Math.random().toString(),
      contact_id: activeChatId,
      direction: 'OUTBOUND',
      content: inputText,
      message_type: 'TEXT',
      meta_message_id: 'temp_meta_' + Math.random(),
      created_at: new Date().toISOString()
    };
    
    setMessages([...messages, newMsg]);
    setInputText('');
  };

  // Disparar llamada a IA real o simular
  const handleRequestAIHelp = async () => {
    if (!activeChatId) return;
    setLoadingAI(true);
    setAiAnalysis(null);

    try {
      const res = await fetch(`${API_URL}/chats/${activeChatId}/analyze`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data);
      } else {
        throw new Error("API Error");
      }
    } catch (e) {
      console.warn("Falla de API de IA, simulando análisis:", e);
      // Fallback
      setTimeout(() => {
        setAiAnalysis({
          summary: "El prospecto muestra alto interés en el curso pero tiene una objeción de presupuesto. Prefiere pagar financiado.",
          detected_objections: ["Precio / Presupuesto"],
          suggested_stage: "NEGOCIACION"
        });
        setLoadingAI(false);
      }, 1500);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleApplyAIStage = () => {
    if (activeChatId && aiAnalysis) {
      updateChatStatus(activeChatId, aiAnalysis.suggested_stage as any);
      setAiAnalysis(null);
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="flex h-screen overflow-hidden bg-white text-slate-800">
      {/* Column 1: Chat List */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-slate-800" /> CloserFlow
          </h1>
          <p className="text-xs text-slate-500 mt-1">Bandeja Compartida de Ventas</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              className={`w-full p-4 text-left transition-colors flex flex-col gap-1 ${
                activeChatId === chat.id ? 'bg-slate-100' : 'bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-900">{chat.first_name || 'Cliente'} {chat.last_name || ''}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {chat.status}
                </span>
              </div>
              <span className="text-xs text-slate-500">{chat.phone_number}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Column 2: Chat Window */}
      <div className="flex-1 flex flex-col h-full bg-white">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-slate-950">{activeChat.first_name || 'Cliente'} {activeChat.last_name || ''}</h2>
                <p className="text-xs text-slate-500">{activeChat.phone_number}</p>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 flex flex-col gap-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[70%] ${
                    msg.direction === 'OUTBOUND' ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <div
                    className={`p-3 text-sm ${
                      msg.direction === 'OUTBOUND' ? 'chat-bubble-outbound' : 'chat-bubble-inbound'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 flex gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje de WhatsApp..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 text-sm"
              />
              <button
                type="submit"
                className="p-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-12 h-12 stroke-[1.2] mb-2" />
            <p className="text-sm">Selecciona una conversación para iniciar</p>
          </div>
        )}
      </div>

      {/* Column 3: AI Sidebar */}
      <div className="w-80 border-l border-slate-200 flex flex-col bg-white">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
            <User className="w-4 h-4" /> Perfil y Atribución
          </h3>
        </div>
        
        {activeChat ? (
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Filtro de Nicho</span>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs mt-1 text-slate-700">
                🚀 <strong>Venta de Intangibles</strong> (Cursos)
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <button
                onClick={handleRequestAIHelp}
                disabled={loadingAI}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold rounded-md hover:bg-slate-200 transition-all"
              >
                <Sparkles className="w-4 h-4 text-slate-700" />
                {loadingAI ? 'Analizando conversación...' : 'Pedir sugerencia de IA'}
              </button>
            </div>

            {aiAnalysis && (
              <div className="p-3.5 border border-slate-200 rounded-lg flex flex-col gap-3 bg-slate-50/50 animate-fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Análisis de DeepSeek
                </div>
                
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Resumen</span>
                  <p className="text-xs text-slate-600 leading-normal mt-0.5">{aiAnalysis.summary}</p>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Objeciones</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {aiAnalysis.detected_objections.map((ob, i) => (
                      <span key={i} className="text-[10px] font-medium bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> {ob}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Etapa Sugerida</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {aiAnalysis.suggested_stage}
                    </span>
                    <button
                      onClick={handleApplyAIStage}
                      className="text-[10px] font-bold bg-slate-900 text-white py-1 px-2.5 rounded hover:bg-slate-850 flex items-center gap-0.5"
                    >
                      Aplicar <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 p-4 text-center text-xs">
            No hay ningún chat activo seleccionado.
          </div>
        )}
      </div>
    </div>
  );
};
export default InboxPage;
