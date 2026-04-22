import { create } from 'zustand';

interface ChatStore {
  pendingShopId: string | null;
  openChat: (shopId: string) => void;
  clearPending: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  pendingShopId: null,
  openChat: (shopId) => set({ pendingShopId: shopId }),
  clearPending: () => set({ pendingShopId: null }),
}));
