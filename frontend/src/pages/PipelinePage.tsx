import React, { useEffect, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { Layers, Plus, Trash2, DollarSign, User, AlertCircle, X } from 'lucide-react';

export const PipelinePage: React.FC = () => {
  const { stages, chats, fetchStages, createDeal, moveDeal, deleteDeal, setChats } = useChatStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealAmount, setNewDealAmount] = useState('0');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  // Cargar contactos reales si la tienda no los cargó
  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_URL}/chats`);
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (e) {
      console.warn("Falla de API al cargar contactos para deals", e);
    }
  };

  useEffect(() => {
    fetchStages();
    if (chats.length === 0) {
      fetchContacts();
    }
  }, []);

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, dealId: string, fromStageId: string) => {
    e.dataTransfer.setData('dealId', dealId);
    e.dataTransfer.setData('fromStageId', fromStageId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, toStageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    const fromStageId = e.dataTransfer.getData('fromStageId');

    if (dealId && fromStageId && fromStageId !== toStageId) {
      await moveDeal(dealId, fromStageId, toStageId);
    }
  };

  const handleOpenAddModal = (stageId: string) => {
    setSelectedStageId(stageId);
    if (chats.length > 0) {
      setSelectedContactId(chats[0].id);
    }
    setShowAddModal(true);
  };

  const handleCreateDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealTitle.trim() || !selectedContactId || !selectedStageId) return;

    await createDeal(
      newDealTitle.trim(),
      parseFloat(newDealAmount) || 0.0,
      selectedContactId,
      selectedStageId
    );

    // Reset y cerrar
    setNewDealTitle('');
    setNewDealAmount('0');
    setShowAddModal(false);
  };

  // Calcular el total financiero del embudo completo
  const totalPipelineValue = stages.reduce((acc, stage) => {
    return acc + stage.deals.reduce((sAcc, deal) => sAcc + (deal.amount || 0), 0);
  }, 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden text-slate-100">
      {/* Header Dashboard Info */}
      <header className="p-6 border-b border-slate-800 bg-slate-950/20 backdrop-blur flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" /> Embudo de Ventas (Pipeline)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Administra tus oportunidades y arrastra los negocios para cambiar de etapa.
          </p>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 px-4 py-2 rounded-lg flex items-center gap-2">
          <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valor Total</p>
            <p className="text-sm font-bold text-emerald-400">${totalPipelineValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</p>
          </div>
        </div>
      </header>

      {/* Kanban Board Container */}
      <div className="flex-1 p-6 overflow-x-auto overflow-y-hidden flex gap-4 items-start select-none">
        {stages.map(stage => {
          const stageTotal = stage.deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="w-72 max-h-full flex flex-col bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-hidden shrink-0 backdrop-blur-sm transition-all duration-300 hover:border-slate-700/80"
            >
              {/* Stage Header */}
              <div className="p-3 border-b border-slate-800/60 bg-slate-950/45 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-xs text-white tracking-wide uppercase">{stage.name}</h3>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {stage.deals.length} {stage.deals.length === 1 ? 'negocio' : 'negocios'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    ${stageTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <button
                    onClick={() => handleOpenAddModal(stage.id)}
                    className="p-1 rounded bg-slate-900 hover:bg-purple-600 hover:text-white border border-slate-800 hover:border-purple-500 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stage Body - Deals List */}
              <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 min-h-[300px]">
                {stage.deals.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800/50 rounded-lg p-4 text-center">
                    <AlertCircle className="w-6 h-6 stroke-[1.2] mb-1 opacity-40" />
                    <p className="text-[10px]">Arrastra un negocio aquí</p>
                  </div>
                ) : (
                  stage.deals.map(deal => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id, stage.id)}
                      className="p-3 bg-slate-900 border border-slate-800/60 hover:border-purple-500/60 rounded-lg cursor-grab active:cursor-grabbing hover:bg-slate-850/80 transition-all duration-300 flex flex-col gap-2 relative group"
                    >
                      {/* Delete Deal Button */}
                      <button
                        onClick={() => deleteDeal(deal.id)}
                        className="absolute right-2 top-2 p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      <div>
                        <h4 className="font-semibold text-xs text-slate-100 pr-5 truncate">{deal.title}</h4>
                        {deal.contact && (
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-500" /> {deal.contact.first_name || 'Cliente'} {deal.contact.last_name || ''}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-slate-800/40 mt-1 shrink-0">
                        <span className="text-[9px] text-slate-500">
                          {new Date(deal.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          ${deal.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modern Add Deal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl animate-fade-in text-slate-100">
            <div className="p-5 border-b border-slate-850 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">Crear Nuevo Negocio</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDealSubmit} className="p-5 flex flex-col gap-4">
              {/* Title Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Nombre del Negocio</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Plan Pro de Programación"
                  value={newDealTitle}
                  onChange={(e) => setNewDealTitle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                />
              </div>

              {/* Amount Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Monto (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newDealAmount}
                    onChange={(e) => setNewDealAmount(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs w-full focus:outline-none focus:border-purple-500 text-slate-200"
                  />
                </div>
              </div>

              {/* Contact Association Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Asociar Contacto (Lead)</label>
                {chats.length === 0 ? (
                  <div className="text-xs text-red-400 p-2 bg-red-500/10 border border-red-500/20 rounded">
                    No hay ningún contacto disponible.
                  </div>
                ) : (
                  <select
                    value={selectedContactId}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500 text-slate-200 cursor-pointer"
                  >
                    {chats.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.first_name || 'Cliente'} {c.last_name || ''} ({c.phone_number})
                      </option>
                    ))}
                  </select>
                )}
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
                  disabled={chats.length === 0}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold rounded-lg transition-all shadow-md shadow-purple-600/20 text-white"
                >
                  Crear Negocio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelinePage;
