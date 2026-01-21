import React, { useState } from 'react';
import { OrderSheet, OrderItem } from '../types';
import { CheckCircle, MessageCircle, Package, Search, Truck, Clock } from 'lucide-react';

interface DeliveriesProps {
  orders: OrderSheet[];
  onMarkDelivered: (orderId: string, itemId: string) => void;
}

export const Deliveries: React.FC<DeliveriesProps> = ({ orders, onMarkDelivered }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Filtra apenas pedidos VALIDADOS pela pastora
  // 2. Filtra apenas itens que AINDA NÃO foram entregues (delivered !== true)
  const pendingItems = orders
    .filter(o => o.status === 'ENTREGUE') // Status ENTREGUE no OrderSheet significa "Validado Financeiramente"
    .flatMap(order => 
      order.items
        .filter(item => !item.delivered) // Pega só o que falta entregar
        .map(item => ({ ...item, orderId: order.id, orderDate: order.date, volunteer: order.volunteerName }))
    )
    .filter(item => 
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Lógica do WhatsApp (Mensagem de CHEGADA)
  const handleNotifyArrival = (item: any) => {
    let cleanPhone = item.customerPhone.replace(/\D/g, '');
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) cleanPhone = '55' + cleanPhone;

    const message = `Olá *${item.customerName}*! 🎉\n\nBoas notícias! Sua encomenda da *Sara Store* acabou de chegar:\n📦 *${item.quantity}x ${item.productName}*\n\nJá está separado aqui para você retirar. Te aguardamos!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in text-zinc-100">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-zinc-800 pb-6">
        <div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                <Truck className="text-green-500" size={32}/> Central de Entregas
            </h2>
            <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest">Itens pagos aguardando retirada</p>
        </div>
        
        {/* Busca */}
        <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
            <input 
                placeholder="Buscar cliente ou produto..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-zinc-700 bg-zinc-900 rounded-xl text-sm focus:border-green-500 outline-none text-white placeholder-zinc-600"
            />
        </div>
      </div>

      {/* Lista de Pendências */}
      <div className="grid grid-cols-1 gap-4">
        {pendingItems.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-zinc-800 border-dashed">
                <Package size={48} className="mx-auto text-zinc-700 mb-4"/>
                <p className="text-zinc-500 uppercase tracking-widest font-bold">Nenhuma entrega pendente</p>
            </div>
        ) : (
            pendingItems.map((item, idx) => (
                <div key={`${item.orderId}-${idx}`} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-zinc-700 transition-all shadow-lg">
                    
                    {/* Info do Cliente e Produto */}
                    <div className="flex-1 flex items-start gap-4 w-full">
                        <div className="bg-zinc-800 p-3 rounded-xl text-green-500 hidden md:block">
                            <Package size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-white">{item.customerName}</h3>
                                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase tracking-wide border border-zinc-700">{item.orderDate.split('-').reverse().join('/')}</span>
                            </div>
                            <p className="text-zinc-400 text-sm mb-2 flex items-center gap-1">
                                <Clock size={12}/> Aguardando retirada de: <strong className="text-green-400">{item.quantity}x {item.productName}</strong>
                            </p>
                            <p className="text-xs text-zinc-600">Tel: {item.customerPhone}</p>
                        </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-3 w-full md:w-auto">
                        <button 
                            onClick={() => handleNotifyArrival(item)}
                            className="flex-1 md:flex-none px-4 py-3 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-black rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all border border-green-500/20"
                        >
                            <MessageCircle size={16} /> Avisar Chegada
                        </button>
                        
                        <button 
                            onClick={() => {
                                if(window.confirm(`Confirmar que ${item.customerName} retirou o produto?`)) {
                                    onMarkDelivered(item.orderId, item.id);
                                }
                            }}
                            className="flex-1 md:flex-none px-6 py-3 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all border border-zinc-700"
                        >
                            <CheckCircle size={16} /> Já Entreguei
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};
