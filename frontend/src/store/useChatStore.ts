import { create } from 'zustand';
import { Contact, Message } from '../types';

interface ChatState {
  chats: Contact[];
  activeChatId: string | null;
  messages: Message[];
  setChats: (chats: Contact[]) => void;
  setActiveChatId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addIncomingMessage: (message: Message) => void;
  updateChatStatus: (chatId: string, newStatus: 'NEW' | 'ENGAGED' | 'QUALIFIED' | 'LOST' | 'WON') => void;
}

export const useChatStore = create<ChatState>((set) => ({
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
  }))
}));
