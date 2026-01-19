import React, { useState, useRef } from 'react';
import { Product, OrderItem, OrderSheet } from '../types';
import { Plus, Minus, Trash2, User, Phone, Users, Search, Package, Save, Barcode } from 'lucide-react';

interface OrdersProps {
  products: Product[];
  onSubmitOrders: (orderSheet: Omit<OrderSheet, 'id' | 'status'>) => void;
}

export const Orders: React.FC<OrdersProps> = ({ products, onSubmitOrders }) => {
  // Cabeçalho
  const [volunteerName, setVolunteerName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Lista de Encomendas
  const [orderList, setOrderList] = useState<OrderItem[]>([]);

  // Estado do Item Atual (Sendo adicionado)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  // Dados do Cliente (Para o item atual)
  const [customerName, setCustomerName] = useState('');
  const [customerTeam, setCustomerTeam] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const defaultServices = ["Culto da Família", "Culto Profético", "Arena", "Culto de Fé e Milagres", "Culto Conexão"];

  // 1. Buscar Produto
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        const found = products.find(p => p.barcode === searchTerm || p.name.toLowerCase() === searchTerm.toLowerCase());
        if (found) {
            setSelectedProduct(found);
            setSearchTerm('');
            setQuantity(1);
        } else {
            alert('Produto não encontrado');
        }
    }
  };

  // 2. Adicionar à Lista
  const handleAddOrder = () => {
    if (!selectedProduct) return;
    if (!customerName || !customerPhone) {
        alert("⚠️ Nome e Telefone do cliente são obrigatórios para encomendas!");
        return;
    }

    const newItem: OrderItem = {
        id: Date.now().toString(),
        productName: selectedProduct.name,
        quantity: quantity,
        total: selectedProduct.price * quantity,
        customerName,
        customerTeam,
        customerPhone
    };

    setOrderList(prev => [newItem, ...prev]);
    
    // Limpar campos de entrada para o próximo
    setSelectedProduct(null);
    setCustomerName('');
    setCustomerTeam('');
    setCustomerPhone('');
    setQuantity(1);
    
    // Focar de volta na busca
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  // 3. Finalizar Folha de Encomendas
  const handleFinalize = () => {
    if (!volunteerName || !serviceType) { alert("Preencha Voluntário e Culto"); return; }
    if (orderList.length === 0) { alert("Lista vazia"); return; }

    onSubmitOrders({
        volunteerName,
        serviceType,
        date,
        items: orderList
    });

    setOrderList([]);
    setVolunteerName('');
    alert("📝 Lista de Encomendas salva com sucesso!");
  };

  return (
    <div className="flex flex-col h-full gap-6 pb-24 lg:pb-0">
      
      {/* Cabeçalho */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
            <label className="text-xs font-bold text-slate-400">RESPONSÁVEL</label>
            <input value={volunteerName} onChange={e => setVolunteerName(e.target.value)} className="w-full font-medium text-slate-700 border-b border-slate-200 outline-none focus:border-indigo-500" placeholder="Seu nome" />
        </div>
        <div>
            <label className="text-xs font-bold text-slate-400">CULTO</label>
            <input list="services_ord" value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full font-medium text-slate-700 border-b border-slate-200 outline-none focus:border-indigo-500" placeholder="Selecione..." />
            <datalist id="services_ord">{defaultServices.map(s => <option key={s} value={s} />)}</datalist>
        </div>
        <div>
            <label className="text-xs font-bold text-slate-400">DATA</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full font-medium text-slate-700 border-b border-slate-200 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* ESQUERDA: Formulário de Encomenda */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Package size={20} className="text-indigo-600"/> Nova Encomenda</h3>
            
            {/* Busca */}
            <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                    ref={searchInputRef}
                    placeholder="Bipe ou digite o produto..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                />
            </div>

            {selectedProduct ? (
                <div className="animate-fade-in space-y-4 border-t border-slate-100 pt-4">
                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                        <p className="font-bold text-indigo-900">{selectedProduct.name}</p>
                        <p className="text-xs text-indigo-600">R$ {selectedProduct.price.toFixed(2)}</p>
                    </div>

                    {/* Quantidade */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 uppercase">Quantidade:</span>
                        <div className="flex items-center bg-slate-100 rounded-lg">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-slate-200 rounded"><Minus size={14}/></button>
                            <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-slate-200 rounded"><Plus size={14}/></button>
                        </div>
                    </div>

                    {/* Campos do Cliente */}
                    <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Dados do Cliente</p>
                        <div className="flex items-center gap-2 border-b border-slate-300 pb-1">
                            <User size={16} className="text-slate-400"/>
                            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome da Pessoa" className="bg-transparent w-full text-sm outline-none" />
                        </div>
                        <div className="flex items-center gap-2 border-b border-slate-300 pb-1">
                            <Users size={16} className="text-slate-400"/>
                            <input value={customerTeam} onChange={e => setCustomerTeam(e.target.value)} placeholder="Equipe (Opcional)" className="bg-transparent w-full text-sm outline-none" />
                        </div>
                        <div className="flex items-center gap-2 border-b border-slate-300 pb-1">
                            <Phone size={16} className="text-slate-400"/>
                            <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Telefone / WhatsApp" className="bg-transparent w-full text-sm outline-none" />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => setSelectedProduct(null)} className="flex-1 py-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                        <button onClick={handleAddOrder} className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 shadow-md transition-all font-bold">Adicionar Encomenda</button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-2 border-2 border-dashed border-slate-100 rounded-xl">
                    <Barcode size={40} className="opacity-50"/>
                    <p className="text-sm">Selecione um produto para começar</p>
                </div>
            )}
        </div>

        {/* DIREITA: Lista de Encomendas */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Lista de Encomendas do Culto</h3>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">{orderList.length} pedidos</span>
            </div>

            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white text-slate-400 sticky top-0 shadow-sm z-10">
                        <tr>
                            <th className="p-3 font-semibold">CLIENTE</th>
                            <th className="p-3 font-semibold">CONTATO</th>
                            <th className="p-3 font-semibold">PRODUTO</th>
                            <th className="p-3 font-semibold text-right">TOTAL</th>
                            <th className="p-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {orderList.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="p-3">
                                    <p className="font-bold text-slate-700">{item.customerName}</p>
                                    <p className="text-xs text-slate-500">{item.customerTeam}</p>
                                </td>
                                <td className="p-3 text-slate-600">{item.customerPhone}</td>
                                <td className="p-3">
                                    <span className="font-medium text-slate-700">{item.quantity}x</span> {item.productName}
                                </td>
                                <td className="p-3 text-right font-bold text-indigo-600">R$ {item.total.toFixed(2)}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => setOrderList(prev => prev.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orderList.length === 0 && <div className="p-10 text-center text-slate-300">Nenhuma encomenda registrada.</div>}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button 
                    onClick={handleFinalize}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex justify-center items-center gap-2 transition-all"
                >
                    <Save size={20} /> Salvar Lista de Encomendas
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
