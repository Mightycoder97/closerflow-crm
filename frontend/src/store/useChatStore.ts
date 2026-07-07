import { create } from 'zustand';
import { Contact, Message, PipelineStage, ChatbotRule } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface ChatState {
  // Chat Inbox State
  chats: Contact[];
  activeChatId: string | null;
  messages: Message[];
  setChats: (chats: Contact[]) => void;
  setActiveChatId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addIncomingMessage: (message: Message) => void;
  updateChatStatus: (chatId: string, newStatus: 'NEW' | 'ENGAGED' | 'QUALIFIED' | 'LOST' | 'WON') => void;

  // Pipeline State
  stages: PipelineStage[];
  setStages: (stages: PipelineStage[]) => void;
  fetchStages: () => Promise<void>;
  moveDeal: (dealId: string, fromStageId: string, toStageId: string) => Promise<void>;
  createDeal: (title: string, amount: number, contactId: string, stageId: string) => Promise<void>;
  deleteDeal: (dealId: string) => Promise<void>;

  // Chatbot Rules State
  chatbotRules: ChatbotRule[];
  setChatbotRules: (rules: ChatbotRule[]) => void;
  fetchChatbotRules: () => Promise<void>;
  createChatbotRule: (triggerKeyword: string, responseContent: string) => Promise<void>;
  toggleChatbotRule: (ruleId: string, isActive: boolean) => Promise<void>;
  deleteChatbotRule: (ruleId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Inbox Actions
  chats: [],
  activeChatId: null,
  messages: [],
  setChats: (chats) => set({ chats }),
  setActiveChatId: (id) => set({ activeChatId: id, messages: [] }),
  setMessages: (messages) => set({ messages }),
  addIncomingMessage: (message) => set((state) => {
    const isForActiveChat = state.activeChatId === message.contact_id;
    const updatedMessages = isForActiveChat 
      ? [...state.messages, message] 
      : state.messages;

    const updatedChats = state.chats.map(chat => {
      if (chat.id === message.contact_id) {
        return { ...chat, updated_at: new Date().toISOString() };
      }
      return chat;
    }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    return {
      messages: updatedMessages,
      chats: updatedChats
    };
  }),
  updateChatStatus: (chatId, newStatus) => set((state) => ({
    chats: state.chats.map(chat => 
      chat.id === chatId ? { ...chat, status: newStatus } : chat
    )
  })),

  // Pipeline Actions
  stages: [],
  setStages: (stages) => set({ stages }),
  fetchStages: async () => {
    try {
      const res = await fetch(`${API_URL}/pipeline/stages`);
      if (res.ok) {
        const data = await res.json();
        set({ stages: data });
      }
    } catch (e) {
      console.error("Error fetching stages:", e);
    }
  },
  moveDeal: async (dealId, fromStageId, toStageId) => {
    // Optimistic Update locally
    const previousStages = get().stages;
    const updatedStages = previousStages.map(stage => {
      if (stage.id === fromStageId) {
        return {
          ...stage,
          deals: stage.deals.filter(d => d.id !== dealId)
        };
      }
      if (stage.id === toStageId) {
        const dealToMove = previousStages
          .find(s => s.id === fromStageId)
          ?.deals.find(d => d.id === dealId);
        
        if (dealToMove) {
          return {
            ...stage,
            deals: [...stage.deals, { ...dealToMove, stage_id: toStageId }]
          };
        }
      }
      return stage;
    });

    set({ stages: updatedStages });

    try {
      const res = await fetch(`${API_URL}/pipeline/deals/${dealId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_id: toStageId }),
      });
      if (!res.ok) {
        throw new Error("Failed to move deal on server");
      }
    } catch (e) {
      console.error("Error moving deal on server, reverting:", e);
      set({ stages: previousStages });
    }
  },
  createDeal: async (title, amount, contactId, stageId) => {
    try {
      const res = await fetch(`${API_URL}/pipeline/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          amount,
          contact_id: contactId,
          stage_id: stageId
        }),
      });
      if (res.ok) {
        // Refrescar etapas del pipeline
        await get().fetchStages();
      }
    } catch (e) {
      console.error("Error creating deal:", e);
    }
  },
  deleteDeal: async (dealId) => {
    try {
      const res = await fetch(`${API_URL}/pipeline/deals/${dealId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await get().fetchStages();
      }
    } catch (e) {
      console.error("Error deleting deal:", e);
    }
  },

  // Chatbot Actions
  chatbotRules: [],
  setChatbotRules: (chatbotRules) => set({ chatbotRules }),
  fetchChatbotRules: async () => {
    try {
      const res = await fetch(`${API_URL}/chatbot/rules`);
      if (res.ok) {
        const data = await res.json();
        set({ chatbotRules: data });
      }
    } catch (e) {
      console.error("Error fetching chatbot rules:", e);
    }
  },
  createChatbotRule: async (triggerKeyword, responseContent) => {
    try {
      const res = await fetch(`${API_URL}/chatbot/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger_keyword: triggerKeyword,
          response_content: responseContent
        }),
      });
      if (res.ok) {
        await get().fetchChatbotRules();
      }
    } catch (e) {
      console.error("Error creating chatbot rule:", e);
    }
  },
  toggleChatbotRule: async (ruleId, isActive) => {
    // Optimistic Update
    const previousRules = get().chatbotRules;
    set({
      chatbotRules: previousRules.map(r => r.id === ruleId ? { ...r, is_active: isActive } : r)
    });

    try {
      const res = await fetch(`${API_URL}/chatbot/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });
      if (!res.ok) {
        throw new Error("Failed to update rule status on server");
      }
    } catch (e) {
      console.error("Error toggling chatbot rule, reverting:", e);
      set({ chatbotRules: previousRules });
    }
  },
  deleteChatbotRule: async (ruleId) => {
    try {
      const res = await fetch(`${API_URL}/chatbot/rules/${ruleId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await get().fetchChatbotRules();
      }
    } catch (e) {
      console.error("Error deleting chatbot rule:", e);
    }
  }
}));
