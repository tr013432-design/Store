import React, { useState } from 'react';
import { Product, CartItem, Category } from '../types';
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, QrCode } from 'lucide-react';

interface POSProps {
  products: Product[];
  onCompleteSale: (items: CartItem[], total: number, method: 'Dinheiro' | 'Cartão' | 'Pix') => void;
}

export const POS: React.FC<POSProps> = ({ products, onCompleteSale }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['Todos', ...Object.values(Category)];

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCheckout = (method: 'Dinheiro' | 'Cartão' | 'Pix') => {
    if (cart.length === 0) return;
    onCompleteSale(cart, cartTotal, method);
    setCart([]);
    alert('Venda realizada com sucesso!');
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-2rem)] gap-6">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20 lg:pb-0">
          {filteredProducts.map(product => (
            <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 cursor-pointer hover:shadow-md transition-all hover:border-indigo-200 group flex flex-col"
            >
              <div className="aspect-square bg-slate-100 rounded-lg mb-3 overflow-hidden relative">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold text-slate-700 shadow-sm">
                    R$ {product.price.toFixed(2)}
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1 leading-tight">{product.name}</h3>
              <p className="text-xs text-slate-500 mb-auto">{product.category}</p>
              <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {product.stock} un
                  </span>
                  <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-full hover:bg-indigo-600 hover:text-white transition-colors">
                    <Plus size={14} />
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-96 bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col h-[50vh] lg:h-auto fixed bottom-0 lg:static left-0 z-50 lg:z-0">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl lg:bg-white">
          <div className="flex items-center gap-2 text-slate-800">
            <ShoppingCart className="text-indigo-600" />
            <h2 className="font-bold text-lg">Carrinho</h2>
          </div>
          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-bold">
            {cart.reduce((acc, i) => acc + i.quantity, 0)} itens
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <ShoppingCart size={48} className="opacity-20" />
                <p className="text-sm">Seu carrinho está vazio</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-800 truncate text-sm">{item.name}</h4>
                  <p className="text-xs text-slate-500">R$ {item.price.toFixed(2)} un</p>
                </div>
                <div className="flex items-center gap-3 ml-2">
                  <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 h-8">
                    <button onClick={() => updateQuantity(item.id, -1)} className="px-2 h-full hover:bg-slate-50 text-slate-600 rounded-l-lg transition-colors">
                        <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-slate-700">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="px-2 h-full hover:bg-slate-50 text-slate-600 rounded-r-lg transition-colors">
                        <Plus size={12} />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 bg-slate-50 rounded-b-2xl border-t border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-500 font-medium">Total a Pagar</span>
            <span className="text-2xl font-bold text-slate-900">R$ {cartTotal.toFixed(2)}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button 
                onClick={() => handleCheckout('Dinheiro')}
                disabled={cart.length === 0}
                className="flex flex-col items-center justify-center gap-1 p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
                <Banknote size={20} />
                <span className="text-xs font-medium">Dinheiro</span>
            </button>
            <button 
                onClick={() => handleCheckout('Pix')}
                disabled={cart.length === 0}
                className="flex flex-col items-center justify-center gap-1 p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
                <QrCode size={20} />
                <span className="text-xs font-medium">Pix</span>
            </button>
            <button 
                onClick={() => handleCheckout('Cartão')}
                disabled={cart.length === 0}
                className="flex flex-col items-center justify-center gap-1 p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
                <CreditCard size={20} />
                <span className="text-xs font-medium">Cartão</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};