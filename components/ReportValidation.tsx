import React, { useState, useMemo } from 'react';
import { DailyReport, OrderSheet, AdminUser } from '../types';
import { CheckCircle, ShoppingBag, Phone, User, Users, FileText, Filter, X, ChevronDown, ChevronUp, RotateCcw, CheckSquare, Square, Lock, Key } from 'lucide-react';

interface ReportValidationProps {
  reports: DailyReport[];
  orders: OrderSheet[];
  admins: AdminUser[];
  onValidateReport: (id: string, adminName: string) => void;
  onValidateOrder: (id: string, adminName: string) => void;
  onUnvalidateReport: (id: string) => void;
  onUnvalidateOrder: (id: string) => void;
  onToggleReportItem: (reportId: string, itemIdx: number) => void;
  onToggleOrderItem: (orderId: string, itemIdx: number) => void;
}

export const ReportValidation: React.FC<ReportValidationProps> = ({ 
  reports, orders, admins,
  onValidateReport, onValidateOrder, onUnvalidateReport, onUnvalidateOrder,
  onToggleReportItem, onToggleOrderItem
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [volunteerFilter, setVolunteerFilter] = useState('Todos');
  const [serviceFilter, setServiceFilter] = useState('Todos');

  // --- MODAL AUTH ---
  const [authOpen, setAuthOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: 'REPORT' | 'ORDER', id: string } | null>(null);

  const handleAuthSubmit = () => {
    // Procura o admin pela senha
    const admin = admins.find(a => a.password === authPassword);
    
    if (admin && pendingAction) {
        if (pendingAction.type === 'REPORT') onValidateReport(pendingAction.id, admin.name); // Passa o nome
        if (pendingAction.type === 'ORDER') onValidateOrder(pendingAction.id, admin.name); // Passa o nome
        closeAuth();
    } else {
        alert("Senha incorreta ou usuário não encontrado!");
        setAuthPassword('');
    }
  };

  const requestValidation = (type: 'REPORT' | 'ORDER', id: string) => {
    setPendingAction({ type, id });
    setAuthOpen(true);
    setAuthPassword('');
  };

  const closeAuth = () => {
    setAuthOpen(false);
    setPendingAction(null);
    setAuthPassword('');
  };

  const uniqueVolunteers = useMemo(() => ['Todos', ...Array.from(new Set([...reports, ...orders].map(i => i.volunteerName).filter(Boolean)))], [reports, orders]);
  const uniqueServices = useMemo(() => ['Todos', ...Array.from(new Set([...reports, ...orders].map(i => i.serviceType).filter(Boolean)))], [reports, orders]);
  const filterList = (list: any[]) => list.filter(item => (volunteerFilter === 'Todos' || item.volunteerName === volunteerFilter) && (serviceFilter === 'Todos' || item.serviceType === serviceFilter));

  const pendingReports = filterList(reports.filter(r => r.status === 'PENDENTE'));
  const pendingOrders = filterList(orders.filter(o => o.status === 'PENDENTE'));
  const validatedReports = filterList(reports.filter(r => r.status === 'VALIDADO'));
  const validatedOrders = filterList(orders.filter(o => o.status === 'ENTREGUE'));
  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);
  const clearFilters = () => { setVolunteerFilter('Todos'); setServiceFilter('Todos'); };

  return (
    <div className="space-y-8 pb-20 relative">
      
      {authOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Lock className="text-indigo-600"/> Permissão Necessária</h3>
                    <button onClick={closeAuth}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                </div>
                <p className="text-sm text-slate-500 mb-4">Insira sua senha de Funcionário/Admin para validar este relatório.</p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 focus-within:ring-2 focus-within:ring-indigo-500">
                    <Key size={18} className="text-slate-400"/>
                    <input type="password" autoFocus value={authPassword} onChange={e => setAuthPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuthSubmit()} placeholder="Senha do Admin" className="bg-transparent w-full outline-none text-slate-800"/>
                </div>
                <button onClick={handleAuthSubmit} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">Confirmar Validação</button>
            </div>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><CheckCircle className="text-indigo-600" /> Validação Pastoral</h2>
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 px-2 text-slate-400"><Filter size={16} /><span className="text-xs font-bold uppercase">Filtrar:</span></div>
            <select value={volunteerFilter} onChange={e => setVolunteerFilter(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 outline-none">{uniqueVolunteers.map(v => <option key={v} value={v}>{v === 'Todos' ? 'Todos Voluntários' : v}</option>)}</select>
            <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 outline-none">{uniqueServices.map(s => <option key={s} value={s}>{s === 'Todos' ? 'Todos os Cultos' : s}</option>)}</select>
            {(volunteerFilter !== 'Todos' || serviceFilter !== 'Todos') && (<button onClick={clearFilters} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={18} /></button>)}
        </div>
      </div>

      {/* Pendentes */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Vendas Pendentes ({pendingReports.length})</h3>
        {pendingReports.length === 0 ? <p className="text-sm text-slate-400 italic">Nenhum relatório pendente.</p> : 
            pendingReports.map(report => (
                <ReportCard key={report.id} report={report} isExpanded={expandedId === report.id} onToggle={() => toggleExpand(report.id)} onAction={() => requestValidation('REPORT', report.id)} onToggleItem={onToggleReportItem} />
            ))
        }
      </div>

      {pendingOrders.length > 0 && (
        <div className="mt-6">
            <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2">Encomendas Pendentes ({pendingOrders.length})</h3>
            {pendingOrders.map(order => (
                <OrderCard key={order.id} order={order} isExpanded={expandedId === order.id} onToggle={() => toggleExpand(order.id)} onAction={() => requestValidation('ORDER', order.id)} onToggleItem={onToggleOrderItem} />
            ))}
        </div>
      )}

      {/* Histórico */}
      {(validatedReports.length > 0 || validatedOrders.length > 0) && (
        <div className="mt-12 pt-8 border-t border-slate-200">
            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-6 flex items-center gap-2"><CheckCircle size={16} /> Histórico Validado</h3>
            <div className="space-y-4">
                {validatedReports.map(report => (
                    <ReportCard key={report.id} report={report} isExpanded={expandedId === report.id} onToggle={() => toggleExpand(report.id)} onAction={() => {}} onUndo={() => onUnvalidateReport(report.id)} />
                ))}
                {validatedOrders.map(order => (
                    <OrderCard key={order.id} order={order} isExpanded={expandedId === order.id} onToggle={() => toggleExpand(order.id)} onAction={() => {}} onUndo={() => onUnvalidateOrder(order.id)} />
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

// --- CARDS ---

const ReportCard = ({ report, isExpanded, onToggle, onAction, onUndo, onToggleItem }: any) => {
    const isVal = report.status === 'VALIDADO';
    const checkedCount = report.items.filter((i: any) => i.checked).length;
    const totalItems = report.items.length;
    return (
        <div className={`mb-3 bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? (isVal ? 'shadow-md border-emerald-200' : 'shadow-lg border-amber-400 ring-1 ring-amber-400') : 'shadow-sm border-slate-200'}`}>
            <div onClick={onToggle} className={`p-5 flex justify-between items-center cursor-pointer ${isVal ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                <div className="flex gap-4 items-center">
                    <div className={`p-2 rounded-lg ${isVal ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{isVal ? <CheckCircle size={24}/> : <FileText size={24} />}</div>
                    <div>
                        <h4 className="font-bold text-slate-800">{report.serviceType}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>Resp: {report.volunteerName}</span>
                            {/* MOSTRA QUEM VALIDOU */}
                            {isVal && (
                                <span className="bg-emerald-100 text-emerald-700 px-2 rounded-full font-bold flex items-center gap-1">
                                    Validado {report.validatedBy && `por ${report.validatedBy}`}
                                </span>
                            )}
                            {!isVal && checkedCount > 0 && <span className="bg-amber-50 text-amber-600 px-2 rounded-full font-bold">{checkedCount}/{totalItems} conferidos</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4"><div className="text-right"><p className="text-xs text-slate-400">Total Caixa</p><p className={`text-lg font-bold ${isVal ? 'text-emerald-700' : 'text-slate-800'}`}>R$ {report.grandTotal.toFixed(2)}</p></div>{isExpanded ? <ChevronUp size={20} className="text-slate-300"/> : <ChevronDown size={20} className="text-slate-300"/>}</div>
            </div>
            {isExpanded && (
                <div className="border-t border-slate-100 bg-white p-4 animate-fade-in">
                     <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-4"><table className="w-full text-xs text-left"><thead className="bg-slate-100 font-semibold text-slate-500"><tr>{!isVal && <th className="p-2 w-8"></th>}<th className="p-2">Qtd</th><th className="p-2">Item</th><th className="p-2 text-right">Valor</th></tr></thead><tbody className="divide-y divide-slate-100">{report.items.map((i: any, idx: number) => (<tr key={idx} onClick={() => !isVal && onToggleItem && onToggleItem(report.id, idx)} className={`transition-colors ${!isVal ? 'cursor-pointer hover:bg-white' : ''} ${i.checked ? 'bg-emerald-50/50' : ''}`}>{!isVal && (<td className="p-2">{i.checked ? <CheckSquare size={16} className="text-emerald-500"/> : <Square size={16} className="text-slate-300"/>}</td>)}<td className="p-2 font-medium">{i.quantity}</td><td className={`p-2 ${i.checked ? 'text-emerald-700 font-medium' : 'text-slate-600'}`}>{i.productName} <span className="text-[10px] opacity-70">({i.paymentMethod})</span></td><td className="p-2 text-right">R$ {i.total.toFixed(2)}</td></tr>))}</tbody></table></div>
                    <div className="flex flex-wrap gap-2 mb-4 text-[10px] uppercase font-bold text-slate-500"><span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">Pix: R$ {report.totalPix.toFixed(2)}</span><span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">Din: R$ {report.totalCash.toFixed(2)}</span><span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">Card: R$ {(report.totalDebit + report.totalCredit).toFixed(2)}</span></div>
                    {report.notes && (<div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-xs text-yellow-800 mb-4 font-medium"><span className="font-bold">Observações:</span> {report.notes}</div>)}
                    {!isVal ? (<button onClick={onAction} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-md flex justify-center items-center gap-2">Confirmar Recebimento ({checkedCount}/{totalItems})</button>) : (<div className="flex gap-2"><div className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-xl font-bold text-center text-xs flex justify-center items-center gap-2 border border-emerald-100"><CheckCircle size={14}/> Relatório Finalizado</div><button onClick={() => { if(window.confirm('Tem certeza? Isso vai remover a receita do painel e DEVOLVER os itens ao estoque.')) onUndo() }} className="px-4 py-2 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl border border-slate-200 transition-colors flex items-center gap-2 text-xs font-bold"><RotateCcw size={14}/> Desvalidar</button></div>)}
                </div>
            )}
        </div>
    );
}

const OrderCard = ({ order, isExpanded, onToggle, onAction, onUndo, onToggleItem }: any) => {
    const isVal = order.status === 'ENTREGUE';
    const checkedCount = order.items.filter((i: any) => i.checked).length;
    const totalItems = order.items.length;
    return (
        <div className={`mb-3 bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? (isVal ? 'shadow-md border-emerald-200' : 'shadow-lg border-indigo-500 ring-1 ring-indigo-500') : 'shadow-sm border-slate-200'}`}>
            <div onClick={onToggle} className={`p-5 flex justify-between items-center cursor-pointer ${isVal ? 'bg-slate-50' : 'hover:bg-slate-50'}`}><div className="flex gap-4 items-center"><div className={`p-2 rounded-lg ${isVal ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>{isVal ? <CheckCircle size={24}/> : <ShoppingBag size={24}/>}</div><div><h4 className="font-bold text-slate-800">{order.serviceType}</h4><div className="flex items-center gap-2 text-xs text-slate-500"><span>Resp: {order.volunteerName}</span>{isVal && <span className="bg-emerald-100 text-emerald-700 px-2 rounded-full font-bold">Aprovado {order.validatedBy && `por ${order.validatedBy}`}</span>}{!isVal && checkedCount > 0 && <span className="bg-indigo-50 text-indigo-600 px-2 rounded-full font-bold">{checkedCount}/{totalItems} ok</span>}</div></div></div><div className="flex items-center gap-4"><div className="text-right"><p className="text-xs text-slate-400">Total</p><p className={`text-lg font-bold ${isVal ? 'text-emerald-700' : 'text-indigo-700'}`}>R$ {order.grandTotal.toFixed(2)}</p></div>{isExpanded ? <ChevronUp size={20} className="text-slate-300"/> : <ChevronDown size={20} className="text-slate-300"/>}</div></div>
            {isExpanded && (
                <div className="border-t border-slate-100 bg-white p-4 animate-fade-in"><div className="space-y-2 mb-4">{order.items.map((item: any, idx: number) => (<div key={idx} onClick={() => !isVal && onToggleItem && onToggleItem(order.id, idx)} className={`bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col sm:flex-row justify-between gap-2 text-xs transition-colors ${!isVal ? 'cursor-pointer hover:border-indigo-200' : ''} ${item.checked ? 'border-emerald-400 bg-emerald-50' : ''}`}><div className="flex items-center gap-3">{!isVal && (<div className="text-slate-400">{item.checked ? <CheckCircle size={18} className="text-emerald-500"/> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>}</div>)}<div><div className="font-bold text-slate-700 flex items-center gap-2"><User size={12}/> {item.customerName}</div><div className="text-slate-500 mt-1 flex gap-2"><span className="flex items-center gap-1"><Phone size={10}/> {item.customerPhone}</span><span className="bg-white px-1.5 rounded border border-slate-200 text-slate-600">{item.paymentMethod}</span></div></div></div><div className="text-right"><p className="font-medium text-slate-800">{item.quantity}x {item.productName}</p><p className="text-slate-400">R$ {item.total.toFixed(2)}</p></div></div>))}</div>
                    {!isVal ? (<button onClick={onAction} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 flex justify-center items-center gap-2 shadow-md"><CheckCircle size={18}/> Validar Recebimento ({checkedCount}/{totalItems})</button>) : (<div className="flex gap-2"><div className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-xl font-bold text-center text-xs flex justify-center items-center gap-2 border border-emerald-100"><CheckCircle size={14}/> Encomendas Finalizadas</div><button onClick={() => { if(window.confirm('Reabrir lista de encomendas? Isso removerá a receita do caixa.')) onUndo() }} className="px-4 py-2 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl border border-slate-200 transition-colors flex items-center gap-2 text-xs font-bold"><RotateCcw size={14}/> Reabrir</button></div>)}
                </div>
            )}
        </div>
    );
}
