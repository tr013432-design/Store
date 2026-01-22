import React, { useState, useRef } from 'react';
import { Product, PaymentMethod, DailyReport, ReportItem, CartItem } from '../types';
import { Plus, Minus, Trash2, Search, Barcode, Save, FileText, User, Church, Calendar, Clock } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface VolunteerSalesProps {
  products: Product[];
  availableVolunteers: string[]; 
  availableServices: string[];   
  onSubmitReport: (report: Omit<DailyReport, 'id' | 'status'>) => void;
}

export const VolunteerSales: React.FC<VolunteerSalesProps> = ({ 
  products, onSubmitReport, availableVolunteers, availableServices 
}) => {
  // --- DADOS GERAIS ---
  const [volunteerName, setVolunteerName] = useLocalStorage('draft_report_volunteer', '');
  const [serviceType, setServiceType] = useLocalStorage('draft_report_service', '');
  const [reportItems, setReportItems] = useLocalStorage<ReportItem[]>('draft_report_list', []);
  const [notes, setNotes] = useLocalStorage('draft_report_notes', '');
  
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportTime, setReportTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

  // --- CORREÇÃO: ITEM EM ANDAMENTO AGORA É SALVO ---
  const [currentItem, setCurrentItem] = useLocalStorage<CartItem | null>('draft_report_current_item', null);
  const [searchTerm, setSearchTerm] = useLocalStorage('draft_report_search', '');
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        const foundProduct = products.find(p => p.barcode === searchTerm || p.name.toLowerCase() === searchTerm.toLowerCase());
        if (foundProduct) {
            setCurrentItem({ ...foundProduct, quantity: 1 });
            setSearchTerm(''); 
        } else {
            alert('Produto não encontrado');
        }
    }
  };

  const addLineToReport = (method: PaymentMethod) => {
    if (!currentItem) return;
    const newItem: ReportItem = {
        productName: currentItem.name,
        quantity: currentItem.quantity,
        paymentMethod: method,
        total: currentItem.price * currentItem.quantity
    };
    setReportItems(prev => [newItem, ...prev]);
    
    // LIMPA APENAS A ÁREA DE SELEÇÃO APÓS ADICIONAR
    setCurrentItem(null);
    
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleFinalizeReport = () => {
    if (!volunteerName || !serviceType) { alert("Preencha Voluntário e Culto"); return; }
    if (reportItems.length === 0) { alert("Relatório vazio"); return; }

    const totalCash = reportItems.filter(i => i.paymentMethod === 'Dinheiro').reduce((a,b) => a + b.total, 0);
    const totalPix = reportItems.filter(i => i.paymentMethod === 'Pix').reduce((a,b) => a + b.total, 0);
    const totalDebit = reportItems.filter(i => i.paymentMethod.includes('Débito')).reduce((a,b) => a + b.total, 0);
    const totalCredit = reportItems.filter(i => i.paymentMethod.includes('Crédito')).reduce((a,b) => a + b.total, 0);

    const reportData = {
        volunteerName,
        serviceType,
        date: reportDate,
        time: reportTime,
        items: reportItems,
        notes,
        totalCash,
        totalPix,
        totalDebit,
        totalCredit,
        grandTotal: totalCash + totalPix + totalDebit + totalCredit
    };

    onSubmitReport(reportData);
    
    // LIMPEZA TOTAL (Só no final)
    setReportItems([]);
    setNotes('');
    setVolunteerName('');
    setCurrentItem(null); 
    
    alert("Relatório enviado para Validação Pastoral!");
  };

  return (
    <div className="flex flex-col h-full gap-6 pb-24 lg:pb-0">
      
      {/* Cabeçalho Editável com Datalists */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
            <label className="text-xs font-bold text-slate-400 flex items-center gap-1"><User size={12}/> VOLUNTÁRIO</label>
            <input list="volunteers_list" value={volunteerName} onChange={e => setVolunteerName(e.target.value)} className="w-full font-medium text-slate-700 border-b border-slate-200 outline-none focus:border-indigo-500 bg-transparent" placeholder="Selecione ou digite..." />
            <datalist id="volunteers_list">
                {availableVolunteers.map(v => <option key={v} value={v} />)}
            </datalist>
        </div>
        <div>
            <label className="text-xs font-bold text-slate-400 flex items-center gap-1"><Church size={12}/> CULTO / EVENTO</label>
            <input list="services_list" value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full font-medium text-slate-700 border-b border-slate-200 outline-none focus:border-indigo-500 bg-transparent" placeholder="Selecione..." />
            <datalist id="services_list">
                {availableServices.map(s => <option key={s} value={s} />)}
            </datalist>
        </div>
        <div><label className="text-xs font-bold text-slate-400 flex items-center gap-1"><Calendar size={12}/> DATA</label><input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="w-full font-medium text-slate-700 border-b border-slate-200 outline-none bg-transparent" /></div>
        <div><label className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock size={12}/> HORA</label><input type="time" value={reportTime} onChange={e => setReportTime(e.target.value)} className="w-full font-medium text-slate-700 border-b border-slate-200 outline-none bg-transparent" /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* ESQUERDA: Adicionar Item */}
        <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Barcode size={20}/> Adicionar Linha</h3>
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        ref={searchInputRef}
                        placeholder="Bipe ou digite..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                {currentItem ? (
                    <div className="animate-fade-in space-y-4">
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                            <p className="font-bold text-indigo-900">{currentItem.name}</p>
                            <p className="text-xs text-indigo-600">R$ {currentItem.price.toFixed(2)} un</p>
                        </div>
                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <button onClick={() => setCurrentItem({...currentItem, quantity: Math.max(1, currentItem.quantity - 1)})} className="p-2 hover:bg-white rounded shadow-sm"><Minus size={16}/></button>
                            <span className="font-bold text-lg w-8 text-center">{currentItem.quantity}</span>
                            <button onClick={() => setCurrentItem({...currentItem, quantity: currentItem.quantity + 1})} className="p-2 hover:bg-white rounded shadow-sm"><Plus size={16}/></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                             <PayBtn label="Dinheiro" onClick={() => addLineToReport('Dinheiro')} />
                             <PayBtn label="Pix" onClick={() => addLineToReport('Pix')} />
                             <PayBtn label="Débito" onClick={() => addLineToReport('Cartão Débito')} />
                             <PayBtn label="Créd. 1x" onClick={() => addLineToReport('Cartão Crédito (1x)')} />
                             <PayBtn label="Créd. 2x" onClick={() => addLineToReport('Cartão Crédito (2x)')} />
                             <PayBtn label="Créd. 3x" onClick={() => addLineToReport('Cartão Crédito (3x)')} />
                        </div>
                        <button onClick={() => setCurrentItem(null)} className="w-full py-2 text-xs text-slate-400 hover:text-red-500">Cancelar seleção</button>
                    </div>
                ) : (
                    <p className="text-center text-slate-400 text-sm py-4">Aguardando leitura...</p>
                )}
            </div>
            <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 flex-1">
                <h4 className="font-bold text-yellow-700 text-sm mb-2 flex items-center gap-2"><FileText size={16}/> Retirada / Observações</h4>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full h-full bg-transparent resize-none outline-none text-sm text-yellow-900 placeholder-yellow-900/40 min-h-[100px]" placeholder="Ex: Cláudia Oliveira - Chama..." />
            </div>
        </div>

        {/* DIREITA: Tabela */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Itens do Relatório</h3>
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{reportItems.length} linhas</span>
            </div>
            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white text-slate-400 sticky top-0 shadow-sm">
                        <tr><th className="p-3">QTD</th><th className="p-3">PRODUTO</th><th className="p-3">PAGAMENTO</th><th className="p-3 text-right">TOTAL</th><th className="p-3"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {reportItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-indigo-50/50">
                                <td className="p-3 font-medium">{item.quantity}</td>
                                <td className="p-3">{item.productName}</td>
                                <td className="p-3"><span className="text-xs border border-slate-200 px-2 py-0.5 rounded text-slate-500 bg-slate-50">{item.paymentMethod}</span></td>
                                <td className="p-3 text-right font-bold text-slate-700">R$ {item.total.toFixed(2)}</td>
                                <td className="p-3 text-right"><button onClick={() => setReportItems(prev => prev.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {reportItems.length === 0 && <div className="p-10 text-center text-slate-300">Relatório vazio</div>}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
                <div className="flex justify-between items-end mb-4">
                    <div className="text-xs text-slate-500 space-y-1">
                        <p>Total Pix: R$ {reportItems.filter(i => i.paymentMethod === 'Pix').reduce((a,b) => a + b.total, 0).toFixed(2)}</p>
                        <p>Total Dinheiro: R$ {reportItems.filter(i => i.paymentMethod === 'Dinheiro').reduce((a,b) => a + b.total, 0).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 font-bold uppercase">Total Geral</p>
                        <p className="text-3xl font-bold text-slate-800">R$ {reportItems.reduce((a,b) => a + b.total, 0).toFixed(2)}</p>
                    </div>
                </div>
                <button onClick={handleFinalizeReport} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex justify-center items-center gap-2 transition-all">
                    <Save size={20} /> Finalizar e Enviar para Validação
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const PayBtn = ({ label, onClick }: { label: string, onClick: () => void }) => (
    <button onClick={onClick} className="bg-white border border-slate-200 py-2 rounded text-[10px] font-bold text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors">
        {label}
    </button>
);
