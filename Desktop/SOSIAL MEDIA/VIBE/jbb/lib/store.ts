import { create } from 'zustand';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    seller: {
      name: string;
    };
  };
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setItems: (items: CartItem[]) => void;
  addItem: (product: any) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => void;
  total: number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  total: 0,
  setIsOpen: (isOpen) => set({ isOpen }),
  setItems: (items) => {
    const total = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    set({ items, total });
  },
  addItem: async (product) => {
    const res = await fetch('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId: product.id, quantity: 1 }),
    });
    if (res.ok) {
      const data = await fetch('/api/cart').then(r => r.json());
      get().setItems(data);
      get().setIsOpen(true); // Open cart automatically
    }
  },
  removeItem: async (id) => {
    const res = await fetch('/api/cart', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      const data = await fetch('/api/cart').then(r => r.json());
      get().setItems(data);
    }
  },
  clearCart: () => set({ items: [], total: 0 }),
}));
