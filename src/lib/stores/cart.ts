import { writable } from 'svelte/store';
import type { Kit } from '$lib/types/courses';

export interface CartItem {
  id: string;
  type: 'kit' | 'course';
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

function createCartStore() {
  const { subscribe, set, update } = writable<CartState>({
    items: [],
    isOpen: false
  });

  // Load cart from localStorage on initialization
  if (typeof window !== 'undefined') {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        set({ ...parsedCart, isOpen: false });
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    }
  }

  return {
    subscribe,
    
    addItem: (item: Omit<CartItem, 'quantity'>) => {
      update(state => {
        const existingItem = state.items.find(i => i.id === item.id);
        
        if (existingItem) {
          // Update quantity if item already exists
          const updatedItems = state.items.map(i => 
            i.id === item.id 
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
          const newState = { ...state, items: updatedItems };
          localStorage.setItem('cart', JSON.stringify(newState));
          return newState;
        } else {
          // Add new item
          const newState = { 
            ...state, 
            items: [...state.items, { ...item, quantity: 1 }] 
          };
          localStorage.setItem('cart', JSON.stringify(newState));
          return newState;
        }
      });
    },
    
    removeItem: (itemId: string) => {
      update(state => {
        const newState = { 
          ...state, 
          items: state.items.filter(item => item.id !== itemId) 
        };
        localStorage.setItem('cart', JSON.stringify(newState));
        return newState;
      });
    },
    
    updateQuantity: (itemId: string, quantity: number) => {
      update(state => {
        if (quantity <= 0) {
          const newState = { 
            ...state, 
            items: state.items.filter(item => item.id !== itemId) 
          };
          localStorage.setItem('cart', JSON.stringify(newState));
          return newState;
        }
        
        const newState = {
          ...state,
          items: state.items.map(item => 
            item.id === itemId 
              ? { ...item, quantity }
              : item
          )
        };
        localStorage.setItem('cart', JSON.stringify(newState));
        return newState;
      });
    },
    
    clearCart: () => {
      update(state => {
        const newState = { ...state, items: [] };
        localStorage.setItem('cart', JSON.stringify(newState));
        return newState;
      });
    },
    
    openCart: () => {
      update(state => ({ ...state, isOpen: true }));
    },
    
    closeCart: () => {
      update(state => ({ ...state, isOpen: false }));
    },
    
    toggleCart: () => {
      update(state => ({ ...state, isOpen: !state.isOpen }));
    },
    
    getTotal: () => {
      let total = 0;
      subscribe(state => {
        total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      })();
      return total;
    },
    
    getItemCount: () => {
      let count = 0;
      subscribe(state => {
        count = state.items.reduce((sum, item) => sum + item.quantity, 0);
      })();
      return count;
    }
  };
}

export const cart = createCartStore(); 