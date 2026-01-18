import React, { useState, useRef } from 'react';
import { Product, CartItem, PaymentMethod, Category } from '../types';
import { Plus, Minus, Trash2, User, Calendar, Clock, Church, ShoppingBag, CreditCard, Search, CheckCircle, Barcode } from 'lucide-react';

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
  // Configuração
  const [volunteerName, setVolunteerName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportTime, setReportTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

  // Venda
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null); // Referência para manter o foco

  const defaultServices = ["Culto da Família", "Culto Profético", "Arena", "Culto de Fé e Milagres", "Culto Conexão"];

  // Funções do Carrinho
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // --- NOVA LÓGICA DO LEITOR DE CÓDIGO DE BARRAS ---
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        // Tenta achar o produto pelo CÓDIGO DE BARRAS exato ou Nome exato
        const foundProduct = products.find(p => 
            p.barcode === searchTerm || 
            p.name.toLowerCase() === searchTerm.toLowerCase()
        );

        if (foundProduct) {
            addToCart(foundProduct);
            setSearchTerm(''); // Limpa o campo para o próximo produto
            // Mantém o foco no input para leitura contínua
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 10);
        }
    }
  };
  // --------------------------------------------------

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

  // Filtra visualmente enquanto digita (para busca manual)
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.includes(searchTerm) // Também filtra se digitar parte do código
  );

  const handleFinishSale = (method: PaymentMethod) => {
    if (!volunteerName.trim()) { alert("⚠️ Preencha o nome do voluntário."); return; }
    if (!serviceType.trim()) { alert("⚠️ Informe qual é o culto."); return; }
    if (cart.length === 0) { alert("⚠️ Carrinho vazio."); return; }

    onCompleteSale(cart, cartTotal, method, {
      name: volunteerName, service: serviceType, date: reportDate, time: reportTime
    });

    setCart([]);
    setSearchTerm('');
    alert("✅ Venda lançada com sucesso!");
  };

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* 1. Cabeçalho */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="text-indigo-600" size={20} />
            Dados do Relatório
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Voluntário</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <User size={16} className="text-slate-400"/>
                    <input value={volunteerName} onChange={e => setVolunteerName(e.target.value)} placeholder="Nome completo" className="bg-transparent w-full text-sm outline-none text-slate-700" />
                </div>
            </div>
            <div>
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Culto / Evento</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <Church size={16} className="text-slate-400"/>
                    <input list="service-options" value={serviceType} onChange={e => setServiceType(e.target.value)} placeholder="Selecione ou digite..." className="bg-transparent w-full text-sm outline-none text-slate-700" />
                    <datalist id="service-options">{defaultServices.map(s => <option key={s} value={s} />)}</datalist>
                </div>
            </div>
            <div>
                 <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Data</label>
                 <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"><Calendar size={16} className="text-slate-400"/><input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="bg-transparent w-full text-sm outline-none text-slate-700" /></div>
            </div>
            <div>
                 <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Horário</label>
                 <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"><Clock size={16} className="text-slate-400"/><input type="time" value={reportTime} onChange={e => setReportTime(e.target.value)} className="bg-transparent w-full text-sm outline-none text-slate-700" /></div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* 2. Busca / Leitor */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Barcode size={18} className="text-slate-500"/> 
                    Adicionar Itens (Busca ou Leitor)
                </h3>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        ref={searchInputRef}
                        placeholder="Bipe o código de barras ou digite o nome..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={handleSearchKeyDown} // <--- AQUI ESTÁ O SEGREDO
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {searchTerm.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <Barcode size={40} className="mb-2" />
                        <p className="text-sm">Aguardando leitura ou busca...</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredProducts.map(product => (
                            <div key={product.id} onClick={() => addToCart(product)} className="group flex justify-between items-center p-3 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-indigo-100">
                                <div>
                                    <p className="font-medium text-slate-700 group-hover:text-indigo-700">{product.name}</p>
                                    <p className="text-xs text-slate-400 flex items-center gap-1">
                                        {product.barcode && <span className="bg-slate-100 px-1 rounded text-[10px]">{product.barcode}</span>}
                                        <span>• {product.category}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-slate-600 group-hover:text-indigo-600">R$ {product.price.toFixed(2)}</span>
                                    <button className="bg-slate-100 text-slate-400 p-1.5 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* 3. Carrinho */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <ShoppingBag size={20} className="text-indigo-200" />
                    <span className="font-bold">Itens Selecionados</span>
                </div>
                <span className="bg-indigo-500/50 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-400">
                    {cart.reduce((a,b) => a + b.quantity, 0)} itens
                </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                        <p className="text-sm">Nenhum item lançado ainda.</p>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                            <div>
                                <p className="font-medium text-slate-700 text-sm">{item.name}</p>
                                <p className="text-xs text-slate-400">Total: R$ {(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                                <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded transition-all"><Minus size={12}/></button>
                                <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded transition-all"><Plus size={12}/></button>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} className="text-red-300 hover:text-red-500 ml-2 p-1"><Trash2 size={16}/></button>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex justify-between items-baseline mb-6">
                    <span className="text-slate-500 font-medium">Valor Total</span>
                    <span className="text-3xl font-bold text-slate-800">R$ {cartTotal.toFixed(2)}</span>
                </div>
                
                <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Forma de Pagamento</p>
                <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
};

const PaymentButton = ({ label, onClick, disabled }: { label: string, onClick: () => void, disabled: boolean }) => (
    <button onClick={onClick} disabled={disabled} className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex justify-center items-center gap-2 border ${disabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm hover:shadow'}`}>
        {label.includes('Crédito') ? <CreditCard size={14}/> : null} {label}
    </button>
);
