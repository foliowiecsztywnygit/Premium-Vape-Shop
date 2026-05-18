import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      addItem: (product) => set((state) => {
        const existing = state.items.find(
          item => item.productId === product.productId && item.variantId === product.variantId
        );
        if (existing) {
          return {
            items: state.items.map(item =>
              item.productId === product.productId && item.variantId === product.variantId
                ? { ...item, quantity: item.quantity + product.quantity }
                : item
            )
          };
        }
        return { items: [...state.items, product] };
      }),
      removeItem: (productId, variantId) => set((state) => ({
        items: state.items.filter(item => !(item.productId === productId && item.variantId === variantId))
      })),
      updateQuantity: (productId, variantId, quantity) => set((state) => ({
        items: state.items.map(item => 
          item.productId === productId && item.variantId === variantId
            ? { ...item, quantity: Math.max(1, quantity) }
            : item
        )
      })),
      clearCart: () => set({ items: [] }),
      getSubtotal: () => {
        const { items } = get();
        return items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
      }
    }),
    {
      name: 'pvs-cart',
    }
  )
);
