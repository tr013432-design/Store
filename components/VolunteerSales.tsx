import React, { useState } from 'react';
import { Product, CartItem, PaymentMethod, Category } from '../types';
import { Plus, Minus, Trash2, User, Calendar, Clock, Church, ShoppingBag, CreditCard } from 'lucide-react';

interface VolunteerSalesProps {
  products: Product[];
  onCompleteSale: (
    items: CartItem[], 
    total: number, 
    method: PaymentMethod, 
    volunteerData: { name: string; service: string; date: string; time: string }
  ) => void;
}

export const VolunteerSales: React.FC<VolunteerSalesProps> = ({ products, onCompleteSale }) => {
  // Dados do Cabeçalho (Relatório)
  const [volunteerName, setVolunteerName] = useState('');
  const [serviceType, setServiceType] = useState('Culto de Domingo');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportTime, setReportTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

  // Dados da Venda
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const categories = ['Todos', ...Object.values(Category)];

  // Lógica do Carrinho
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

  const handleFinishSale = (method: PaymentMethod) => {
    if (!volunteerName.trim()) {
      alert("⚠️ Atenção: Preencha o nome do voluntário antes de vender.");
      return;
    }
    if (cart.length === 0) return;

    onCompleteSale(cart, cartTotal, method, {
      name: volunteerName,
      service: serviceType,
      date: reportDate,
      time: reportTime
    });

    setCart([]);
    alert("✅ Venda registrada no relatório!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-20 lg:pb-0">
      
      {/* 1. Identificação do Relatório */}
      <div className="lg:col-span-3 bg-indigo-700 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row gap-6">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label className="text-xs text-indigo-200 mb-1 flex items-center gap-1"><User size={12}/> Nome do Voluntário</label>
                <input 
                    value={volunteerName}
                    onChange={e => setVolunteerName(e.target.value)}
                    placeholder="Quem está vendendo?"
                    className="w-full bg-indigo-600 border border-indigo-500 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 placeholder-indigo-300"
                />
            </div>
            <div>
                <label className="text-xs text-indigo-200 mb-1 flex items-center gap-1"><Church size={12}/> Culto / Evento</label>
                <select 
                    value={serviceType}
                    onChange={e => setServiceType(e.target.value)}
                    className="w-full bg-indigo-600 border border-indigo-500 rounded-lg px-3 py-2 text-sm"
                >
                    <option>Culto de Domingo</option>
                    <option>Culto de Jovens</option>
                    <option>Escola Bíblica</option>
                    <option>Cantina Extra</option>
                </select>
            </div>
            <div>
                 <label className="text-xs text-indigo-200 mb-1 flex items-center gap-1"><Calendar size={12}/> Data</label>
                 <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="w-full bg-indigo-600 border border-indigo-500 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
                 <label className="text-xs text-indigo-200 mb-1 flex items-center gap-1"><Clock size={12}/> Horário</label>
                 <input type="time" value={reportTime} onChange={e => setReportTime(e.target.value)} className="w-full bg-indigo-600 border border-indigo-500 rounded-lg px-3 py-2 text-sm" />
            </div>
        </div>
      </div>

      {/* 2. Seleção de Produtos */}
      <div className="lg:col-span-2 flex flex-col gap-4 h-[600px]">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
            <input 
                placeholder="Buscar produto..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
            />
            <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
            >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3 pr-2">
            {filteredProducts.map(product => (
                <div key={product.id} onClick={() => addToCart(product)} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-300 cursor-pointer flex flex-col gap-2 group">
                    <div className="flex justify-between items-start">
                        <img src={product.imageUrl} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${product.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {product.stock} un
                        </span>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800 text-sm">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.category}</p>
                    </div>
                    <div className="mt-auto flex justify-between items-center">
                        <span className="font-bold text-indigo-700">R$ {product.price.toFixed(2)}</span>
                        <Plus size={16} className="text-indigo-600 bg-indigo-50 rounded-full p-0.5" />
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* 3. Carrinho e Pagamento */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col h-[600px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><ShoppingBag size={18}/> Itens</h3>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{cart.reduce((a,b) => a + b.quantity, 0)} total</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? <p className="text-center text-slate-400 text-sm mt-10">Carrinho vazio</p> : 
                cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                        <div>
                            <p className="font-medium text-slate-700">{item.name}</p>
                            <p className="text-xs text-slate-400">R$ {item.price.toFixed(2)} un</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-400 hover:text-slate-600"><Minus size={14}/></button>
                            <span className="font-medium">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-400 hover:text-slate-600"><Plus size={14}/></button>
                            <button onClick={() => removeFromCart(item.id)} className="text-red-400 ml-1"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))
            }
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
            <div className="flex justify-between items-end mb-4">
                <span className="text-slate-500 text-sm">Total</span>
                <span className="text-2xl font-bold text-slate-900">R$ {cartTotal.toFixed(2)}</span>
            </div>
            
            <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Pagamento</p>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleFinishSale('Dinheiro')} disabled={cart.length === 0} className="btn-pay">Dinheiro</button>
                <button onClick={() => handleFinishSale('Pix')} disabled={cart.length === 0} className="btn-pay">Pix</button>
                <button onClick={() => handleFinishSale('Cartão Débito')} disabled={cart.length === 0} className="btn-pay">Débito</button>
                <button onClick={() => handleFinishSale('Cartão Crédito (1x)')} disabled={cart.length === 0} className="btn-pay">Crédito 1x</button>
                <button onClick={() => handleFinishSale('Cartão Crédito (2x)')} disabled={cart.length === 0} className="btn-pay">Crédito 2x</button>
                <button onClick={() => handleFinishSale('Cartão Crédito (3x)')} disabled={cart.length === 0} className="btn-pay">Crédito 3x</button>
            </div>
        </div>
      </div>
      <style>{`
        .btn-pay {
            background: white; border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px;
            font-size: 11px; font-weight: 600; color: #475569; transition: all 0.2s;
        }
        .btn-pay:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
        .btn-pay:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
};
