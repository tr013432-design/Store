import React, { useState, useRef } from 'react';
import { Product, OrderItem, OrderSheet, PaymentMethod } from '../types';
import { Plus, Minus, Trash2, User, Phone, Users, Search, Package, Save, Barcode, CreditCard } from 'lucide-react';

interface OrdersProps {
  products: Product[];
  availableVolunteers: string[]; // Nova prop
  availableServices: string[];   // Nova prop
  onSubmitOrders: (orderSheet: Omit<OrderSheet, 'id' | 'status'>) => void;
}

export const Orders: React.FC<OrdersProps> = ({ products, onSubmitOrders, availableVolunteers, availableServices }) => {
  const [volunteerName, setVolunteerName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [orderList, setOrderList] = useState<OrderItem[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  const [customerName, setCustomerName] = useState('');
  const [customerTeam, setCustomerTeam] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const handleAddOrder = (method: PaymentMethod) => {
    if (!selectedProduct) return;
    if (!customerName || !customerPhone) { alert("⚠️ Nome e Telefone do cliente são obrigatórios!"); return; }

    const newItem: OrderItem = {
        id: Date.now().toString(),
        productName: selectedProduct.name,
        quantity: quantity,
        total: selectedProduct.price * quantity,
        paymentMethod: method,
        customerName,
        customerTeam,
        customerPhone
    };

    setOrderList(prev => [newItem, ...prev]);
    setSelectedProduct(null);
    setCustomerName(''); setCustomerTeam(''); setCustomerPhone(''); setQuantity(1);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleFinalize = () => {
    if (!volunteerName || !serviceType) { alert("Preencha Voluntário e Culto"); return; }
    if (orderList.length === 0) { alert("Lista vazia"); return; }

    const totalCash = orderList.filter(i => i.paymentMethod === 'Dinheiro').reduce((a,b) => a + b.total, 0);
    const totalPix = orderList.filter(i => i.paymentMethod === 'Pix').reduce((a,b) => a + b.total, 0);
    const totalDebit = orderList.filter(i => i.paymentMethod.includes('Débito')).reduce((a,b) => a + b.total, 0);
    const totalCredit = orderList.filter(i => i.paymentMethod.includes('Crédito')).reduce((a,b) => a + b.total, 0);

    onSubmitOrders({
        volunteerName,
        serviceType,
        date,
        items: orderList,
        totalCash,
        totalPix,
        totalDebit,
        totalCredit,
        grandTotal: totalCash + totalPix + totalDebit + totalCredit
    });

    setOrderList([]);
    setVolunteerName('');
    alert("📝 Lista de Encomendas salva com sucesso!");
  };

  return (
    <div className="flex flex-col h-full gap-6 pb-24 lg:pb-0">
      
      {/* Cabeçalho Editável */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
            <label className="text-xs font-bold text-slate-400">RESPONSÁVEL</label>
            <input list="volunteers_ord" value={volunteerName} onChange={e => setVolunteerName(e.target.value)} className="w-full font-medium text-slate-700 border-b border-slate-200 outline-none focus:border-indigo-500" placeholder="Seu nome" />
            <datalist id="volunteers_ord">{availableVolunteers.map(v => <option key={v} value={v} />)}</datalist>
        </div>
        <div>
            <label className="text-xs font-bold text-slate-400">CULTO</label>
            <input list="services_ord" value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full font-medium text-slate-700 border-b border-slate-200 outline-none focus:border-indigo-500" placeholder="Selecione..." />
            <datalist id="services_ord">{availableServices.map(s => <option key={s} value={s} />)}</datalist>
        </div>
        <div><label className="text-xs font-bold text-slate-400">DATA</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full font-medium text-slate-700 border-b border-slate-200 outline-none" /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Package size={20} className="text-indigo-600"/> Nova Encomenda</h3>
            <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input ref={searchInputRef} placeholder="Bipe ou digite o produto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={handleSearchKeyDown} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" />
            </div>
            {selectedProduct ? (
                <div className="animate-fade-in space-y-4 border-t border-slate-100 pt-4">
                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                        <p className="font-bold text-indigo-900">{selectedProduct.name}</p>
                        <p className="text-xs text-indigo-600">R$ {selectedProduct.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 uppercase">Quantidade:</span>
                        <div className="flex items-center bg-slate-100 rounded-lg">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-slate-200 rounded"><Minus size={14}/></button>
                            <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-slate-200 rounded"><Plus size={14}/></button>
                        </div>
                    </div>
                    <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Dados do Cliente</p>
                        <div className="flex items-center gap-2 border-b border-slate-300 pb-1"><User size={16} className="text-slate-400"/><input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome da Pessoa" className="bg-transparent w-full text-sm outline-none" /></div>
                        <div className="flex items-center gap-2 border-b border-slate-300 pb-1"><Users size={16} className="text-slate-400"/><input value={customerTeam} onChange={e => setCustomerTeam(e.target.value)} placeholder="Equipe (Opcional)" className="bg-transparent w-full text-sm outline-none" /></div>
                        <div className="flex items-center gap-2 border-b border-slate-300 pb-1"><Phone size={16} className="text-slate-400"/><input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Telefone / WhatsApp" className="bg-transparent w-full text-sm outline-none" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <PayBtn label="Dinheiro" onClick={() => handleAddOrder('Dinheiro')} />
                        <PayBtn label="Pix" onClick={() => handleAddOrder('Pix')} />
                        <PayBtn label="Débito" onClick={() => handleAddOrder('Cartão Débito')} />
                        <PayBtn label="Crédito 1x" onClick={() => handleAddOrder('Cartão Crédito (1x)')} />
                        <PayBtn label="Crédito 2x" onClick={() => handleAddOrder('Cartão Crédito (2x)')} />
                        <PayBtn label="Crédito 3x" onClick={() => handleAddOrder('Cartão Crédito (3x)')} />
                    </div>
                    <button onClick={() => setSelectedProduct(null)} className="w-full py-2 text-xs text-slate-400 hover:text-red-500">Cancelar seleção</button>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-2 border-2 border-dashed border-slate-100 rounded-xl">
                    <Barcode size={40} className="opacity-50"/>
                    <p className="text-sm">Selecione um produto para começar</p>
                </div>
            )}
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Lista de Encomendas</h3>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">{orderList.length} pedidos</span>
            </div>
            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white text-slate-400 sticky top-0 shadow-sm z-10">
                        <tr><th className="p-3">CLIENTE</th><th className="p-3">PAGAMENTO</th><th className="p-3">PRODUTO</th><th className="p-3 text-right">TOTAL</th><th className="p-3"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {orderList.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="p-3"><p className="font-bold text-slate-700">{item.customerName}</p><p className="text-xs text-slate-500">{item.customerPhone}</p></td>
                                <td className="p-3"><span className="text-xs border border-slate-200 px-2 py-0.5 rounded text-slate-500 bg-white">{item.paymentMethod}</span></td>
                                <td className="p-3"><span className="font-medium text-slate-700">{item.quantity}x</span> {item.productName}</td>
                                <td className="p-3 text-right font-bold text-indigo-600">R$ {item.total.toFixed(2)}</td>
                                <td className="p-3 text-right"><button onClick={() => setOrderList(prev => prev.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button onClick={handleFinalize} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex justify-center items-center gap-2 transition-all">
                    <Save size={20} /> Salvar Lista e Enviar para Validação
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
const PayBtn = ({ label, onClick }: { label: string, onClick: () => void }) => (
    <button onClick={onClick} className="bg-white border border-slate-200 py-2 rounded text-[10px] font-bold text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors flex justify-center items-center gap-1">
        {label.includes('Crédito') ? <CreditCard size={10}/> : null}{label}
    </button>
);
