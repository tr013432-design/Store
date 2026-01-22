import React, { useState, useRef } from 'react';
import { Product, OrderItem, OrderSheet, PaymentMethod } from '../types';
import { Plus, Minus, Trash2, User, Phone, Users, Search, Package, Save, Barcode, CreditCard, MessageCircle } from 'lucide-react';
// 1. IMPORTANDO O HOOK DE MEMÓRIA
import { useLocalStorage } from '../hooks/useLocalStorage';

interface OrdersProps {
  products: Product[];
  availableVolunteers: string[];
  availableServices: string[];
  onSubmitOrders: (orderSheet: Omit<OrderSheet, 'id' | 'status'>) => void;
}

export const Orders: React.FC<OrdersProps> = ({ products, onSubmitOrders, availableVolunteers, availableServices }) => {
  // 2. BLINDAGEM: Usando useLocalStorage em vez de useState
  // Esses dados agora sobrevivem se você recarregar a página ou mudar de aba!
  const [volunteerName, setVolunteerName] = useLocalStorage('draft_orders_volunteer', '');
  const [serviceType, setServiceType] = useLocalStorage('draft_orders_service', '');
  const [orderList, setOrderList] = useLocalStorage<OrderItem[]>('draft_orders_list', []);
  
  // Data geralmente não precisa salvar, pode ser o dia atual sempre
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Estados temporários (formulário de adição) não precisam de persistência pesada
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

  const handleRemoveItem = (id: string) => {
    setOrderList(prev => prev.filter(item => item.id !== id));
  };

  // --- LÓGICA WHATSAPP (SOFIA) ---
  const handleWhatsApp = (item: OrderItem) => {
    let cleanPhone = item.customerPhone.replace(/\D/g, '');
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
        cleanPhone = '55' + cleanPhone;
    }
    const message = `Olá *${item.customerName}*! 👋\n\nSeu pedido na *Sara Store* está pronto:\n📦 *${item.quantity}x ${item.productName}*\n\nPode vir retirar no balcão!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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

    // LIMPEZA: Só limpa depois de salvar com sucesso
    setOrderList([]);
    setVolunteerName('');
    alert("📝 Lista de Encomendas salva com sucesso!");
  };

  return (
    <div className="flex flex-col h-full gap-6 pb-24 lg:pb-0">
      
      {/* Cabeçalho Editável */}
      <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">RESPONSÁVEL</label>
            <input list="volunteers_ord" value={volunteerName} onChange={e => setVolunteerName(e.target.value)} className="w-full font-bold text-zinc-200 border-b border-zinc-700 bg-transparent outline-none focus:border-green-500 transition-colors py-1" placeholder="Seu nome" />
            <datalist id="volunteers_ord">{availableVolunteers.map(v => <option key={v} value={v} />)}</datalist>
        </div>
        <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">CULTO</label>
            <input list="services_ord" value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full font-bold text-zinc-200 border-b border-zinc-700 bg-transparent outline-none focus:border-green-500 transition-colors py-1" placeholder="Selecione..." />
            <datalist id="services_ord">{availableServices.map(s => <option key={s} value={s} />)}</datalist>
        </div>
        <div><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">DATA</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full font-bold text-zinc-200 border-b border-zinc-700 bg-transparent outline-none focus:border-green-500 transition-colors py-1" /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col gap-4">
            <h3 className="font-bold text-white flex items-center gap-2 uppercase tracking-wide"><Package size={20} className="text-green-500"/> Nova Encomenda</h3>
            <div className="relative">
                <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
                <input ref={searchInputRef} placeholder="Bipe ou digite..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={handleSearchKeyDown} className="w-full pl-10 pr-4 py-3 border border-zinc-700 bg-black rounded-xl text-sm focus:border-green-500 outline-none text-white placeholder-zinc-600" />
            </div>
            {selectedProduct ? (
                <div className="animate-fade-in space-y-4 border-t border-zinc-800 pt-4">
                    <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                        <p className="font-bold text-green-400 text-lg">{selectedProduct.name}</p>
                        <p className="text-xs text-zinc-400">Preço unitário: R$ {selectedProduct.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Qtd:</span>
                        <div className="flex items-center bg-black border border-zinc-700 rounded-lg">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-zinc-800 text-zinc-400 rounded"><Minus size={14}/></button>
                            <span className="w-10 text-center font-bold text-sm text-white">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-zinc-800 text-zinc-400 rounded"><Plus size={14}/></button>
                        </div>
                    </div>
                    <div className="space-y-3 bg-black p-3 rounded-xl border border-zinc-800">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Dados do Cliente</p>
                        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2"><User size={16} className="text-zinc-600"/><input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome da Pessoa" className="bg-transparent w-full text-sm outline-none text-white placeholder-zinc-700" /></div>
                        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2"><Users size={16} className="text-zinc-600"/><input value={customerTeam} onChange={e => setCustomerTeam(e.target.value)} placeholder="Equipe (Opcional)" className="bg-transparent w-full text-sm outline-none text-white placeholder-zinc-700" /></div>
                        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2"><Phone size={16} className="text-zinc-600"/><input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Telefone (WhatsApp)" className="bg-transparent w-full text-sm outline-none text-white placeholder-zinc-700" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <PayBtn label="Dinheiro" onClick={() => handleAddOrder('Dinheiro')} />
                        <PayBtn label="Pix" onClick={() => handleAddOrder('Pix')} />
                        <PayBtn label="Débito" onClick={() => handleAddOrder('Cartão Débito')} />
                        <PayBtn label="Crédito 1x" onClick={() => handleAddOrder('Cartão Crédito (1x)')} />
                        <PayBtn label="Crédito 2x" onClick={() => handleAddOrder('Cartão Crédito (2x)')} />
                        <PayBtn label="Crédito 3x" onClick={() => handleAddOrder('Cartão Crédito (3x)')} />
                    </div>
                    <button onClick={() => setSelectedProduct(null)} className="w-full py-2 text-xs text-zinc-500 hover:text-red-500 uppercase tracking-wider font-bold">Cancelar</button>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-2 border-2 border-dashed border-zinc-800 rounded-xl min-h-[200px]">
                    <Barcode size={40} className="opacity-50"/>
                    <p className="text-xs uppercase tracking-widest">Selecione um produto</p>
                </div>
            )}
        </div>
        <div className="lg:col-span-2 bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden">
            <div className="p-4 bg-black/50 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-white uppercase tracking-wide">Lista de Encomendas</h3>
                <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded-full font-bold uppercase tracking-widest">{orderList.length} pedidos</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="text-zinc-500 sticky top-0 bg-zinc-900 shadow-lg z-10 text-[10px] uppercase tracking-widest">
                        <tr><th className="p-4">Cliente</th><th className="p-4">Pagamento</th><th className="p-4">Produto</th><th className="p-4 text-right">Total</th><th className="p-4 text-center">Ações</th></tr>
                    </thead>
                    <tbody>
                        {orderList.map(item => (
                            <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                <td className="p-4">
                                    <p className="font-bold text-white">{item.customerName}</p>
                                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                                        <Phone size={10} /> {item.customerPhone}
                                    </div>
                                </td>
                                <td className="p-4 text-zinc-400 text-xs">{item.paymentMethod}</td>
                                <td className="p-4">
                                    <span className="text-green-400 font-bold">{item.quantity}x</span> {item.productName}
                                </td>
                                <td className="p-4 text-right font-bold text-white">R$ {item.total.toFixed(2)}</td>
                                <td className="p-4 text-center flex justify-center gap-2">
                                    <button onClick={() => handleWhatsApp(item)} className="p-2 bg-green-900/30 text-green-500 rounded hover:bg-green-500 hover:text-black transition-colors" title="Avisar no WhatsApp">
                                        <MessageCircle size={16} />
                                    </button>
                                    <button onClick={() => handleRemoveItem(item.id)} className="p-2 bg-red-900/30 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors" title="Excluir">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orderList.length === 0 && <div className="p-10 text-center text-zinc-600 text-sm">Nenhuma encomenda na lista.</div>}
            </div>
            <div className="p-4 border-t border-zinc-800 bg-black/30">
                <button onClick={handleFinalize} className="w-full bg-green-600 text-black py-3 rounded-xl font-bold hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] flex justify-center items-center gap-2 transition-all uppercase tracking-widest text-sm">
                    <Save size={18} /> Salvar Lista
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const PayBtn = ({ label, onClick }: { label: string, onClick: () => void }) => (
    <button onClick={onClick} className="bg-black border border-zinc-700 py-3 rounded-lg text-[10px] font-bold text-zinc-400 hover:border-green-500 hover:text-green-500 transition-all uppercase tracking-widest flex justify-center items-center gap-1">
        {label.includes('Crédito') ? <CreditCard size={12}/> : null}{label}
    </button>
);
