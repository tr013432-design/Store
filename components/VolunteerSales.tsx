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
  // Estado do "Cabeçalho" do Relatório
  const [volunteerName, setVolunteerName] = useState('');
  const [serviceType, setServiceType] = useState('Culto de Domingo');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportTime, setReportTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

  // Estado da Venda
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Categorias para filtro
  const categories = ['Todos', ...Object.values(Category)];

  // Funções do Carrinho (reutilizando lógica similar ao POS, mas simplificada)
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

  // Filtros de produtos
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFinishSale = (method: PaymentMethod) => {
    if (!volunteerName.trim()) {
      alert("Por favor, preencha o nome do voluntário.");
      return;
    }
    if (cart.length === 0) {
      alert("Adicione produtos antes de finalizar.");
      return;
    }

    onCompleteSale(cart, cartTotal, method, {
      name: volunteerName,
      service: serviceType,
      date: reportDate,
      time: reportTime
    });

    setCart([]);
    alert("Venda registrada no relatório com sucesso!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-20 lg:pb-0">
      
      {/* Coluna 1: Configuração do Relatório (Identificação) */}
      <div className="lg:col-span-3 bg-indigo-700 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row gap-6 items-end md:items-center justify-between">
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label className="block text-xs text-indigo-200 mb-1 flex items-center gap-1"><User size={12}/> Voluntário Responsável</label>
                <input 
                    value={volunteerName}
                    onChange={e => setVolunteerName(e.target.value)}
                    placeholder="Seu nome..."
                    className="w-full bg-indigo-600 border border-indigo-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-indigo-300"
                />
            </div>
            <div>
                <label className="block text-xs text-indigo-200 mb-1 flex items-center gap-1"><Church size={12}/> Culto / Evento</label>
                <select 
                    value={serviceType}
                    onChange={e => setServiceType(e.target.value)}
                    className="w-full bg-indigo-600 border border-indigo-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                    <option>Culto de Domingo</option>
                    <option>Culto de Jovens</option>
                    <option>Escola Bíblica</option>
                    <option>Cantina Extra</option>
                </select>
            </div>
            <div>
                 <label className="block text-xs text-indigo-200 mb-1 flex items-center gap-1"><Calendar size={12}/> Data</label>
                 <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="w-full bg-indigo-600 border border-indigo-500 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
                 <label className="block text-xs text-indigo-200 mb-1 flex items-center gap-1"><Clock size={12}/> Horário</label>
                 <input type="time" value={reportTime} onChange={e => setReportTime(e.target.value)} className="w-full bg-indigo-600 border border-indigo-500 rounded-lg px-3 py-2 text-sm" />
            </div>
        </div>
      </div>

      {/* Coluna 2: Seleção de Produtos */}
      <div className="lg:col-span-2 flex flex-col gap-4 h-[600px]">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
            <input 
                placeholder="Buscar produto..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none"
            >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3 pr-2">
            {filteredProducts.map(product => (
                <div key={product.id} onClick={() => addToCart(product)} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-300 cursor-pointer transition-all flex flex-col gap-2 group">
                    <div className="flex justify-between items-start">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden">
                            <img src={product.imageUrl} className="w-full h-full object-cover" />
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${product.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {product.stock} un
                        </span>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800 text-sm leading-tight">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.category}</p>
                    </div>
                    <div className="mt-auto flex justify-between items-center">
                        <span className="font-bold text-indigo-700">R$ {product.price.toFixed(2)}</span>
                        <div className="bg-indigo-50 p-1 rounded-full text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Plus size={14} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Coluna 3: Resumo e Pagamento */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col h-[600px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex items-center justify-between">
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><ShoppingBag size={18}/> Itens do Culto</h3>
            <span className="text-sm font-semibold text-indigo-600">{cart.reduce((a,b) => a + b.quantity, 0)} itens</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
                <p className="text-center text-slate-400 text-sm mt-10">Nenhum item adicionado ainda.</p>
            ) : (
                cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                        <div>
                            <p className="font-medium text-slate-700">{item.name}</p>
                            <p className="text-xs text-slate-400">R$ {item.price.toFixed(2)} un</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-400 hover:text-slate-600"><Minus size={14}/></button>
                            <span className="w-4 text-center font-medium">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-400 hover:text-slate-600"><Plus size={14}/></button>
                            <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 ml-1"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
            <div className="flex justify-between items-end mb-4">
                <span className="text-slate-500 text-sm">Total do Relatório</span>
                <span className="text-2xl font-bold text-slate-900">R$ {cartTotal.toFixed(2)}</span>
            </div>
            
            <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Forma de Pagamento</p>
            <div className="grid grid-cols-2 gap-2">
                <PaymentButton label="Dinheiro" onClick={() => handleFinishSale('Dinheiro')} disabled={cart.length === 0} />
                <PaymentButton label="Pix" onClick={() => handleFinishSale('Pix')} disabled={cart.length === 0} />
                <PaymentButton label="Débito" onClick={() => handleFinishSale('Cartão Débito')} disabled={cart.length === 0} />
                <PaymentButton label="Crédito (1x)" onClick={() => handleFinishSale('Cartão Crédito (1x)')} disabled={cart.length === 0} />
                <PaymentButton label="Crédito (2x)" onClick={() => handleFinishSale('Cartão Crédito (2x)')} disabled={cart.length === 0} />
                <PaymentButton label="Crédito (3x)" onClick={() => handleFinishSale('Cartão Crédito (3x)')} disabled={cart.length === 0} />
            </div>
        </div>
      </div>
    </div>
  );
};

const PaymentButton = ({ label, onClick, disabled }: { label: string, onClick: () => void, disabled: boolean }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className="bg-white border border-slate-200 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-1"
    >
        {label.includes('Crédito') ? <CreditCard size={12}/> : null}
        {label}
    </button>
);
