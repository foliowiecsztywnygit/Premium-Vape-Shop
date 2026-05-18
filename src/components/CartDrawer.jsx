import React from 'react';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getSubtotal } = useCartStore();

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
        onClick={closeCart}
      />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-ink z-[70] shadow-2xl shadow-cyan-glow border-l border-white/10 flex flex-col text-white font-sans transition-transform duration-300 transform translate-x-0">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-montserrat font-black text-xl tracking-widest uppercase">Koszyk</h2>
          <button onClick={closeCart} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="font-montserrat tracking-widest uppercase">Twój koszyk jest pusty.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 items-center bg-brand-dark p-3 rounded-md border border-white/10">
                {item.image && (
                  <img src={item.image} alt={item.productName} className="w-20 h-20 object-cover rounded-sm bg-gray-800" />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{item.productName}</h3>
                  {item.variantName && <p className="text-xs text-gray-400">Wariant: {item.variantName}</p>}
                  <p className="text-sm font-bold mt-1">{item.unitPrice.toFixed(2)} PLN</p>
                  
                  <div className="flex items-center mt-3 gap-3">
                    <div className="flex items-center border border-white/15 rounded-sm">
                      <button 
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="px-2 py-1 text-gray-400 hover:text-accent-cyan"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-2 text-sm font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        className="px-2 py-1 text-gray-400 hover:text-accent-cyan"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="text-red-500 hover:text-red-400 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-ink">
            <div className="flex justify-between mb-4 font-bold text-lg">
              <span>Suma:</span>
              <span>{getSubtotal().toFixed(2)} PLN</span>
            </div>
            <button 
              onClick={() => {
                closeCart();
                window.history.pushState({}, '', '/checkout');
                window.dispatchEvent(new Event('popstate'));
                window.scrollTo(0,0);
              }}
              className="w-full bg-accent-deep text-white py-4 font-montserrat font-black uppercase tracking-widest hover:bg-accent-cyan hover:text-ink transition-colors rounded-sm shadow-cyan-glow"
            >
              Zarezerwuj i odbierz
            </button>
          </div>
        )}
      </div>
    </>
  );
}
