import React, { useMemo, useState } from 'react';
import { OrderSheet } from '../types';
import { CheckCircle, MessageCircle, Package, Search, Truck, Clock, History, CalendarCheck } from 'lucide-react';

interface DeliveriesProps {
  orders: OrderSheet[];
  onMarkDelivered: (orderId: string, itemId: string) => void;
}

export const Deliveries: React.FC<DeliveriesProps> = ({ orders, onMarkDelivered }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');

  // ✅ Estado local pra "sumir" da lista imediatamente (mesmo se o pai demorar)
  const [deliveredOverride, setDeliveredOverride] = useState<Record<string, boolean>>({});

  const normalizeText = (v: any) => String(v ?? '').toLowerCase();

  // ✅ Define "entregue" de forma robusta (caso seu backend use outro campo)
  const isDelivered = (item: any, key: string) => {
    if (deliveredOverride[key]) return true;
    return (
      item?.delivered === true ||
      item?.status === 'DELIVERED' ||
      item?.status === 'ENTREGUE' ||
      Boolean(item?.deliveredAt) ||
      Boolean(item?.deliveredDate)
    );
  };

  // ✅ Gera um ID garantido pro item (não depende de item.id existir)
  const buildItemKey = (orderId: string, item: any, index: number) => {
    const raw =
      item?.id ??
      item?.itemId ??
      item?.productId ??
      item?.barcode ??
      `${orderId}-${index}`;
    return `${orderId}::${String(raw)}`;
  };

  // Processa todos os itens de pedidos validados
  const allItems = useMemo(() => {
    return orders
      .filter(o => o.status === 'ENTREGUE')
      .flatMap(order =>
        order.items.map((item: any, index: number) => {
          const key = buildItemKey(order.id, item, index);
          return {
            ...item,
            orderId: order.id,
            orderDate: order.date,
            volunteer: order.volunteerName,
            itemKey: key,       // ✅ chave garantida
            itemIndex: index,   // ✅ índice disponível se precisar
          };
        })
      );
  }, [orders]);

  const filteredItems = useMemo(() => {
    const term = normalizeText(searchTerm);

    return allItems
      .filter((item: any) => {
        const delivered = isDelivered(item, item.itemKey);

        const matchesTab = activeTab === 'PENDING' ? !delivered : delivered;

        const matchesSearch =
          normalizeText(item.customerName).includes(term) ||
          normalizeText(item.productName).includes(term);

        return matchesTab && matchesSearch;
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.orderDate).getTime();
        const dateB = new Date(b.orderDate).getTime();
        return activeTab === 'PENDING' ? dateA - dateB : dateB - dateA;
      });
  }, [allItems, activeTab, searchTerm, deliveredOverride]);

  const pendingCount = useMemo(() => {
    return allItems.filter((i: any) => !isDelivered(i, i.itemKey)).length;
  }, [allItems, deliveredOverride]);

  const handleNotifyArrival = (item: any) => {
    let cleanPhone = String(item.customerPhone ?? '').replace(/\D/g, '');
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) cleanPhone = '55' + cleanPhone;

    const message =
      `Olá *${item.customerName}*! 🎉\n\n` +
      `Boas notícias! Sua encomenda da *Sara Store* acabou de chegar:\n` +
      `📦 *${item.quantity}x ${item.productName}*\n\n` +
      `Já está separado aqui para você retirar. Te aguardamos!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDeliver = (item: any) => {
    if (!window.confirm(`Confirmar que ${item.customerName} retirou o produto?`)) return;

    // ✅ Some da lista na hora
    setDeliveredOverride(prev => ({ ...prev, [item.itemKey]: true }));

    // ✅ Chama o pai com um ID consistente
    // OBS: Estamos passando a parte "raw" do key (depois do "::") como itemId
    const rawItemId = item.itemKey.split('::')[1] ?? item.itemKey;
    onMarkDelivered(item.orderId, rawItemId);
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in text-zinc-100">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            <Truck className="text-green-500" size={32} /> Central de Entregas
          </h2>
          <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest">Gestão Logística</p>
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

      {/* Abas */}
      <div className="flex gap-4 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 ${activeTab === 'PENDING'
            ? 'text-green-500 border-green-500'
            : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
        >
          <Clock size={16} /> Aguardando Retirada ({pendingCount})
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 ${activeTab === 'HISTORY'
            ? 'text-green-500 border-green-500'
            : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
        >
          <History size={16} /> Histórico de Entregues
        </button>
      </div>

      {/* Lista */}
      <div className="grid grid-cols-1 gap-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-zinc-800 border-dashed">
            <Package size={48} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500 uppercase tracking-widest font-bold">
              {activeTab === 'PENDING' ? 'Tudo entregue! Nenhuma pendência.' : 'Nenhum histórico encontrado.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item: any) => (
            <div
              key={item.itemKey} // ✅ key estável
              className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-4 transition-all shadow-lg ${activeTab === 'PENDING'
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                : 'bg-black border-zinc-900 opacity-75'}`}
            >
              {/* Info */}
              <div className="flex-1 flex items-start gap-4 w-full">
                <div className={`p-3 rounded-xl hidden md:block ${activeTab === 'PENDING' ? 'bg-zinc-800 text-green-500' : 'bg-zinc-900 text-zinc-600'}`}>
                  {activeTab === 'PENDING' ? <Package size={24} /> : <CheckCircle size={24} />}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-bold text-lg ${activeTab === 'PENDING' ? 'text-white' : 'text-zinc-500 line-through'}`}>
                      {item.customerName}
                    </h3>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase tracking-wide border border-zinc-700">
                      {String(item.orderDate).split('-').reverse().join('/')}
                    </span>
                  </div>

                  <p className="text-zinc-400 text-sm mb-2 flex items-center gap-1">
                    {activeTab === 'PENDING' ? <Clock size={12} /> : <CalendarCheck size={12} />}
                    {activeTab === 'PENDING' ? 'Aguardando retirada de:' : 'Entregue:'}
                    <strong className={activeTab === 'PENDING' ? 'text-green-400' : 'text-zinc-500'}>
                      {item.quantity}x {item.productName}
                    </strong>
                  </p>

                  <p className="text-xs text-zinc-600">Tel: {item.customerPhone}</p>
                </div>
              </div>

              {/* Ações */}
              {activeTab === 'PENDING' ? (
                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={() => handleNotifyArrival(item)}
                    className="flex-1 md:flex-none px-4 py-3 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-black rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all border border-green-500/20"
                  >
                    <MessageCircle size={16} /> Avisar
                  </button>

                  <button
                    onClick={() => handleDeliver(item)}
                    className="flex-1 md:flex-none px-6 py-3 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all border border-zinc-700"
                  >
                    <CheckCircle size={16} /> Entregar
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-900/50 px-4 py-2 rounded-lg border border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-900" /> Concluído
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
