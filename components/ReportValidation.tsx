import React, { useState } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, AlertCircle, Clock, Calendar, User, DollarSign, ListFilter, Search, History, RotateCcw, Package } from 'lucide-react';
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

    // --- FILTROS ---
    const filterList = (list: any[]) => list.filter(item => 
        (filterVolunteer === 'Todos' || item.volunteerName === filterVolunteer) &&
        (filterService === 'Todos' || item.serviceType === filterService)
    );

    const pendingReports = filterList(reports.filter(r => r.status === 'PENDENTE'));
    const pendingOrders = filterList(orders.filter(o => o.status === 'PENDENTE'));
    const validatedReports = filterList(reports.filter(r => r.status === 'VALIDADO'));
    const validatedOrders = filterList(orders.filter(o => o.status === 'ENTREGUE'));

    const toggleCard = (id: string) => setOpenCardId(openCardId === id ? null : id);
    const calculateCardTotal = (items: any[]) => items.filter(i => i.checked !== false).reduce((acc, item) => acc + item.total, 0);

    return (
        <div className="space-y-8 pb-20 animate-fade-in relative z-10">
            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CheckCircle className="text-green-500" /> Validação Pastoral
                    </h2>
                    <p className="text-zinc-400 text-sm">Confira o dinheiro físico e valide as vendas.</p>
                </div>
                
                {/* BARRA DE FILTROS */}
                <div className="flex gap-2 bg-zinc-900 p-1.5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 px-3 border-r border-white/10">
                        <ListFilter size={14} className="text-zinc-500"/>
                        <span className="text-xs font-bold text-zinc-500 uppercase">Filtrar:</span>
                    </div>
                    <select value={filterVolunteer} onChange={e => setFilterVolunteer(e.target.value)} className="bg-transparent text-xs font-bold text-white outline-none p-2 cursor-pointer hover:text-green-400 [&>option]:bg-zinc-900">
                        <option value="Todos">Todos Voluntários</option>
                        {[...new Set([...reports, ...orders].map(r => r.volunteerName))].filter(Boolean).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <select value={filterService} onChange={e => setFilterService(e.target.value)} className="bg-transparent text-xs font-bold text-white outline-none p-2 cursor-pointer hover:text-green-400 [&>option]:bg-zinc-900">
                        <option value="Todos">Todos os Cultos</option>
                        {[...new Set([...reports, ...orders].map(r => r.serviceType))].filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* --- SEÇÃO 1: PENDENTES --- */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle size={16} className="text-yellow-500" /> Pendentes <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full text-xs">{pendingReports.length + pendingOrders.length}</span>
                    </h3>
                </div>

                {pendingReports.length === 0 && pendingOrders.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                        <CheckCircle size={48} className="text-zinc-800 mx-auto mb-3" />
                        <p className="text-zinc-500 font-medium">Tudo limpo! Nenhuma venda pendente.</p>
                    </div>
                ) : (
                    <>
                        {/* PENDENTES - RELATÓRIOS */}
                        {pendingReports.map((report) => {
                            const currentTotal = calculateCardTotal(report.items);
                            const isMatch = Math.abs(currentTotal - report.grandTotal) < 0.01;
                            return (
                                <div key={report.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:border-zinc-700 transition-all">
                                    <div className="p-5 flex justify-between items-center cursor-pointer bg-zinc-900 hover:bg-zinc-800/50" onClick={() => toggleCard(report.id)}>
                                        <div className="flex gap-4 items-center">
                                            <div className="p-3 bg-yellow-500/10 rounded-xl h-fit border border-yellow-500/20">
                                                <DollarSign className="text-yellow-500" size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-lg">{report.serviceType}</h4>
                                                <div className="flex items-center gap-3 text-sm text-zinc-400">
                                                    <span className="flex items-center gap-1"><User size={12}/> {report.volunteerName}</span>
                                                    <span className="flex items-center gap-1"><Clock size={12}/> {report.time || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Total Informado</p>
                                            <p className="text-2xl font-black text-white">R$ {currentTotal.toFixed(2)}</p>
                                            {openCardId === report.id ? <ChevronUp size={16} className="ml-auto mt-2 text-zinc-500"/> : <ChevronDown size={16} className="ml-auto mt-2 text-zinc-500"/>}
                                        </div>
                                    </div>

                                    {openCardId === report.id && (
                                        <div className="p-5 bg-black/40 border-t border-zinc-800 animate-fade-in">
                                            {/* CHECKLIST DE ITENS */}
                                            <div className="space-y-1 mb-6">
                                                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-2 px-3">
                                                    <div className="col-span-1">Qtd</div>
                                                    <div className="col-span-8">Produto</div>
                                                    <div className="col-span-3 text-right">Valor</div>
                                                </div>
                                                {report.items.map((item, idx) => (
                                                    <div key={idx} 
                                                         onClick={() => onToggleReportItem(report.id, idx)}
                                                         className={`grid grid-cols-12 gap-2 p-3 rounded-lg items-center border transition-all cursor-pointer ${item.checked !== false ? 'bg-zinc-800 border-zinc-700' : 'bg-red-900/10 border-red-900/30 opacity-60'}`}>
                                                        <div className="col-span-1 text-green-400 font-mono font-bold text-xs">{item.quantity}x</div>
                                                        <div className="col-span-8">
                                                            <p className={`font-medium text-sm ${item.checked !== false ? 'text-zinc-200' : 'text-red-400 line-through'}`}>{item.productName}</p>
                                                            <p className="text-[10px] text-zinc-500">{item.paymentMethod}</p>
                                                        </div>
                                                        <div className="col-span-3 text-right font-bold text-white text-sm">R$ {item.total.toFixed(2)}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* RESUMO */}
                                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-zinc-800">
                                                <div className="flex gap-2 text-[10px] font-mono">
                                                    <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20">PIX: R$ {report.totalPix.toFixed(2)}</span>
                                                    <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">DIN: R$ {report.totalCash.toFixed(2)}</span>
                                                    <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20">CARD: R$ {(report.totalDebit + report.totalCredit).toFixed(2)}</span>
                                                </div>
                                                <button 
                                                    onClick={() => onValidateReport(report.id, 'Admin')}
                                                    className="w-full md:w-auto px-8 bg-green-600 hover:bg-green-500 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20">
                                                    <CheckCircle size={18} /> Confirmar Recebimento
                                                </button>
                                            </div>
                                            {!isMatch && <p className="text-center text-xs text-red-500 mt-3 font-bold bg-red-500/10 py-2 rounded">⚠️ Atenção: Valor selecionado difere do total original.</p>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* PENDENTES - ENCOMENDAS */}
                        {pendingOrders.map(order => (
                            <div key={order.id} className="bg-zinc-900 border-l-4 border-blue-500 rounded-2xl shadow-lg overflow-hidden">
                                <div className="p-5 flex justify-between items-center cursor-pointer hover:bg-zinc-800/50" onClick={() => toggleCard(order.id)}>
                                    <div className="flex gap-4 items-center">
                                        <div className="p-3 bg-blue-500/10 rounded-xl"><Package className="text-blue-500" size={24}/></div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">Encomenda Pendente</h4>
                                            <p className="text-sm text-zinc-400">Cliente: <span className="text-white font-bold">{order.customerName}</span></p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-white">R$ {order.grandTotal.toFixed(2)}</p>
                                        {openCardId === order.id ? <ChevronUp size={16} className="ml-auto mt-2 text-zinc-500"/> : <ChevronDown size={16} className="ml-auto mt-2 text-zinc-500"/>}
                                    </div>
                                </div>
                                {openCardId === order.id && (
                                    <div className="p-5 bg-black/40 border-t border-zinc-800 animate-fade-in">
                                        <div className="space-y-2 mb-4">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-zinc-800 p-2 rounded-lg text-sm text-zinc-300">
                                                     <span>{item.quantity}x {item.productName}</span>
                                                     <span>R$ {item.total.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => onValidateOrder(order.id, 'Admin')} className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
                                            Confirmar Entrega e Recebimento
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* --- SEÇÃO 2: HISTÓRICO RESTAURADO E EXPANSÍVEL --- */}
            {(validatedReports.length > 0 || validatedOrders.length > 0) && (
                <div className="pt-10 border-t border-white/10 mt-10">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <History size={16} className="text-zinc-600" /> Histórico Validado
                    </h3>
                    
                    <div className="space-y-3">
                        {validatedReports.map(report => (
                            <div key={report.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all">
                                <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-zinc-900/50" onClick={() => toggleCard(report.id)}>
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500 border border-green-500/20"><CheckCircle size={18}/></div>
                                        <div>
                                            <p className="font-bold text-zinc-300 text-sm">{report.serviceType}</p>
                                            <p className="text-xs text-zinc-600">Validado por {report.validatedBy || 'Admin'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-mono font-bold text-zinc-500">R$ {report.grandTotal.toFixed(2)}</p>
                                        {openCardId === report.id ? <ChevronUp size={16} className="text-zinc-600"/> : <ChevronDown size={16} className="text-zinc-600"/>}
                                    </div>
                                </div>

                                {/* DETALHES DO HISTÓRICO (CORREÇÃO AQUI) */}
                                {openCardId === report.id && (
                                    <div className="p-4 bg-black/40 border-t border-zinc-800 animate-fade-in">
                                        <div className="mb-4 space-y-1">
                                            {report.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-xs text-zinc-400 border-b border-white/5 py-2">
                                                    <span>{item.quantity}x {item.productName} <span className="text-zinc-600">({item.paymentMethod})</span></span>
                                                    <span>R$ {item.total.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-end">
                                            <button 
                                                onClick={() => { if(window.confirm('Tem certeza? Isso vai remover o dinheiro do caixa.')) onUnvalidateReport(report.id) }} 
                                                className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-xs font-bold border border-red-500/20 flex items-center gap-2 transition-colors">
                                                <RotateCcw size={14} /> Desfazer Validação
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {validatedOrders.map(order => (
                            <div key={order.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-blue-900/30 transition-all">
                                <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-zinc-900/50" onClick={() => toggleCard(order.id)}>
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 border border-blue-500/20"><Package size={18}/></div>
                                        <div>
                                            <p className="font-bold text-zinc-300 text-sm">Encomenda: {order.customerName}</p>
                                            <p className="text-xs text-zinc-600">Entregue</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-mono font-bold text-zinc-500">R$ {order.grandTotal.toFixed(2)}</p>
                                        {openCardId === order.id ? <ChevronUp size={16} className="text-zinc-600"/> : <ChevronDown size={16} className="text-zinc-600"/>}
                                    </div>
                                </div>
                                {openCardId === order.id && (
                                    <div className="p-4 bg-black/40 border-t border-zinc-800 animate-fade-in">
                                         <div className="mb-4 space-y-1">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-xs text-zinc-400 border-b border-white/5 py-2">
                                                    <span>{item.quantity}x {item.productName}</span>
                                                    <span>R$ {item.total.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-end">
                                            <button onClick={() => onUnvalidateOrder(order.id)} className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-xs font-bold border border-red-500/20 flex items-center gap-2 transition-colors">
                                                <RotateCcw size={14} /> Reabrir Encomenda
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
