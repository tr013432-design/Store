import React, { useState } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, AlertCircle, Clock, Calendar, User, DollarSign, ListFilter, Search } from 'lucide-react';
import { DailyReport, OrderSheet, AdminUser } from '../types';

interface ReportValidationProps {
    reports: DailyReport[];
    orders: OrderSheet[];
    admins: AdminUser[];
    onValidateReport: (id: string, admin: string) => void;
    onValidateOrder: (id: string, admin: string) => void;
    onUnvalidateReport: (id: string) => void;
    onUnvalidateOrder: (id: string) => void;
    onToggleReportItem: (id: string, idx: number) => void;
    onToggleOrderItem: (id: string, idx: number) => void;
}

export const ReportValidation: React.FC<ReportValidationProps> = ({
    reports, orders, admins, onValidateReport, onValidateOrder, onUnvalidateReport, onUnvalidateOrder, onToggleReportItem, onToggleOrderItem
}) => {
    const [filterVolunteer, setFilterVolunteer] = useState('Todos');
    const [filterService, setFilterService] = useState('Todos');
    const [openCardId, setOpenCardId] = useState<string | null>(null);

    // Filtros
    const pendingReports = reports.filter(r => r.status === 'PENDENTE');
    const pendingOrders = orders.filter(o => o.status === 'PENDENTE');

    const filteredReports = pendingReports.filter(r => 
        (filterVolunteer === 'Todos' || r.volunteerName === filterVolunteer) &&
        (filterService === 'Todos' || r.serviceType === filterService)
    );

    const toggleCard = (id: string) => setOpenCardId(openCardId === id ? null : id);

    // Calcular totais do card
    const calculateCardTotal = (items: any[]) => items.filter(i => i.checked !== false).reduce((acc, item) => acc + item.total, 0);

    return (
        <div className="space-y-8 pb-20 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CheckCircle className="text-green-500" /> Validação Pastoral
                    </h2>
                    <p className="text-zinc-400 text-sm">Confira o dinheiro físico e valide as vendas.</p>
                </div>
                
                <div className="flex gap-2 bg-zinc-900 p-1 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 px-3 border-r border-white/10">
                        <ListFilter size={14} className="text-zinc-500"/>
                        <span className="text-xs font-bold text-zinc-500 uppercase">Filtrar:</span>
                    </div>
                    <select value={filterVolunteer} onChange={e => setFilterVolunteer(e.target.value)} className="bg-transparent text-xs font-bold text-white outline-none p-2 cursor-pointer hover:text-green-400">
                        <option value="Todos">Todos Voluntários</option>
                        {[...new Set(reports.map(r => r.volunteerName))].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <select value={filterService} onChange={e => setFilterService(e.target.value)} className="bg-transparent text-xs font-bold text-white outline-none p-2 cursor-pointer hover:text-green-400">
                        <option value="Todos">Todos os Cultos</option>
                        {[...new Set(reports.map(r => r.serviceType))].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* SEÇÃO DE VENDAS (RELATÓRIOS) */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    Vendas Pendentes <span className="bg-zinc-800 text-white px-2 py-0.5 rounded-full text-xs">{filteredReports.length}</span>
                </h3>

                {filteredReports.length === 0 ? (
                    <div className="text-center py-10 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
                        <CheckCircle size={40} className="text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500 font-medium">Nenhuma venda pendente de validação.</p>
                    </div>
                ) : (
                    filteredReports.map((report) => {
                        const currentTotal = calculateCardTotal(report.items);
                        const isMatch = Math.abs(currentTotal - report.grandTotal) < 0.01;
                        
                        return (
                            <div key={report.id} className="bg-white rounded-2xl overflow-hidden shadow-lg transform transition-all hover:scale-[1.01]">
                                {/* CABEÇALHO DO CARD (BRANCO) */}
                                <div className="p-5 border-b border-zinc-100 flex justify-between items-start cursor-pointer bg-white" onClick={() => toggleCard(report.id)}>
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-amber-100 rounded-xl h-fit">
                                            <AlertCircle className="text-amber-600" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-zinc-900 text-lg">{report.serviceType}</h4>
                                            <p className="text-zinc-500 text-sm flex items-center gap-1"><User size={12}/> Resp: {report.volunteerName}</p>
                                            <p className="text-zinc-400 text-xs flex items-center gap-1 mt-1"><Clock size={12}/> {report.time || 'Horário não reg.'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-zinc-400 uppercase font-bold mb-1">Total Caixa</p>
                                        <p className="text-2xl font-black text-zinc-900">R$ {currentTotal.toFixed(2)}</p>
                                        {openCardId === report.id ? <ChevronUp size={16} className="ml-auto mt-2 text-zinc-400"/> : <ChevronDown size={16} className="ml-auto mt-2 text-zinc-400"/>}
                                    </div>
                                </div>

                                {/* CORPO DO CARD (EXPANDIDO) */}
                                {openCardId === report.id && (
                                    <div className="p-5 bg-zinc-50">
                                        {/* LISTA DE ITENS - CORRIGIDO PARA TEXTO ESCURO */}
                                        <div className="mb-6">
                                            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-2">
                                                <div className="col-span-1">Qtd</div>
                                                <div className="col-span-8">Item</div>
                                                <div className="col-span-3 text-right">Valor</div>
                                            </div>
                                            <div className="space-y-2">
                                                {report.items.map((item, idx) => (
                                                    <div key={idx} 
                                                         onClick={() => onToggleReportItem(report.id, idx)}
                                                         className={`grid grid-cols-12 gap-2 p-3 rounded-xl items-center border transition-all cursor-pointer ${item.checked !== false ? 'bg-white border-zinc-200 shadow-sm' : 'bg-red-50 border-red-200 opacity-60'}`}>
                                                        
                                                        <div className="col-span-1 font-bold text-zinc-900 bg-zinc-100 w-6 h-6 flex items-center justify-center rounded-full text-xs">
                                                            {item.quantity}
                                                        </div>
                                                        <div className="col-span-8">
                                                            <p className={`font-bold text-sm ${item.checked !== false ? 'text-zinc-800' : 'text-red-800 line-through'}`}>{item.productName}</p>
                                                            <p className="text-[10px] text-zinc-500">{item.paymentMethod}</p>
                                                        </div>
                                                        <div className="col-span-3 text-right font-bold text-zinc-900">
                                                            R$ {item.total.toFixed(2)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* RESUMO FINANCEIRO */}
                                        <div className="flex gap-2 mb-6 text-xs font-bold bg-white p-3 rounded-xl border border-zinc-200 justify-center">
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg">PIX: R$ {report.totalPix.toFixed(2)}</span>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg">DIN: R$ {report.totalCash.toFixed(2)}</span>
                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg">CARD: R$ {report.totalCredit.toFixed(2)}</span>
                                        </div>

                                        {/* BOTÃO DE VALIDAÇÃO */}
                                        <button 
                                            onClick={() => onValidateReport(report.id, 'Admin')}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]">
                                            <CheckCircle size={20} />
                                            Confirmar Recebimento ({report.items.filter(i => i.checked !== false).length}/{report.items.length})
                                        </button>
                                        {!isMatch && <p className="text-center text-xs text-red-500 mt-2 font-bold">⚠️ O valor selecionado difere do original.</p>}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* SEÇÃO DE ENCOMENDAS */}
            {pendingOrders.length > 0 && (
                <div className="space-y-4 pt-8 border-t border-white/10">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        Encomendas a Entregar <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs">{pendingOrders.length}</span>
                    </h3>
                    {pendingOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border-l-4 border-blue-500">
                             <div className="p-5 flex justify-between items-center">
                                <div>
                                    <h4 className="font-black text-zinc-900 text-lg">Encomenda #{order.id.slice(0,4)}</h4>
                                    <p className="text-zinc-500 text-sm">Cliente: <span className="font-bold text-zinc-800">{order.customerName}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-zinc-900">R$ {order.grandTotal.toFixed(2)}</p>
                                    <button onClick={() => onValidateOrder(order.id, 'Admin')} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">
                                        Marcar Entregue
                                    </button>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
