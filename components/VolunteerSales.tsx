import React, { useState, useRef, useMemo } from 'react';
import { Product, PaymentMethod, DailyReport, ReportItem, CartItem, Customer } from '../types';
import { Plus, Minus, Trash2, Search, Barcode, Save, FileText, User, Church, Calendar, Clock, ScanLine, Phone, Star, X, DollarSign, CreditCard } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { BarcodeScanner } from './BarcodeScanner';

interface VolunteerSalesProps {
  products: Product[];
  availableVolunteers: string[]; 
  availableServices: string[];   
  customers: Customer[]; 
  pointsValue: number;
  onSubmitReport: (report: Omit<DailyReport, 'id' | 'status'>) => void;
}

export const VolunteerSales: React.FC<VolunteerSalesProps> = ({ 
  products, onSubmitReport, availableVolunteers, availableServices, customers, pointsValue
}) => {
  // --- DADOS GERAIS ---
  const [volunteerName, setVolunteerName] = useLocalStorage('draft_report_volunteer', '');
  const [serviceType, setServiceType] = useLocalStorage('draft_report_service', '');
  const [reportItems, setReportItems] = useLocalStorage<ReportItem[]>('draft_report_list', []);
  const [notes, setNotes] = useLocalStorage('draft_report_notes', '');
  
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportTime, setReportTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

  const [currentItem, setCurrentItem] = useLocalStorage<CartItem | null>('draft_report_current_item', null);
  const [searchTerm, setSearchTerm] = useLocalStorage('draft_report_search', '');
  const [customerPhone, setCustomerPhone] = useState(''); 
  const [isScanning, setIsScanning] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Busca o cliente na lista
  const activeCustomer = useMemo(() => {
      const cleanPhone = customerPhone.replace(/\D/g, '');
      return customers.find(c => c.id === cleanPhone);
  }, [customerPhone, customers]);

  // Handlers (Scanner, Busca, Adicionar Item, Finalizar) - Mantidos iguais
  const handleScanSuccess = (code: string) => {
    const foundProduct = products.find(p => p.barcode === code);
    if (foundProduct) { setCurrentItem({ ...foundProduct, quantity: 1 }); setSearchTerm(''); setIsScanning(false); } 
    else { alert(`Produto ${code} não encontrado!`); setIsScanning(false); }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        const foundProduct = products.find(p => p.barcode === searchTerm || p.name.toLowerCase() === searchTerm.toLowerCase());
        if (foundProduct) { setCurrentItem({ ...foundProduct, quantity: 1 }); setSearchTerm(''); } 
        else { alert('Produto não encontrado'); }
    }
  };

  const addLineToReport = (method: PaymentMethod) => {
    if (!currentItem) return;
    if (method === 'Sara Points') {
        if (!activeCustomer) { alert("Informe o telefone do cliente para usar pontos."); return; }
        const costInPoints = (currentItem.price * currentItem.quantity) / pointsValue;
        if (activeCustomer.points < costInPoints) { alert(`Saldo insuficiente! Necessário: ${costInPoints.toFixed(0)} pts`); return; }
    }
    const newItem: ReportItem = { productName: currentItem.name, quantity: currentItem.quantity, paymentMethod: method, total: method === 'Sara Points' ? (currentItem.price * currentItem.quantity) : (currentItem.price * currentItem.quantity), customerPhone: activeCustomer ? activeCustomer.id : undefined };
    setReportItems(prev => [newItem, ...prev]); setCurrentItem(null); setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleFinalizeReport = () => {
    if (!volunteerName || !serviceType) { alert("Preencha Voluntário e Culto"); return; }
    if (reportItems.length === 0) { alert("Relatório vazio"); return; }
    const totalCash = reportItems.filter(i => i.paymentMethod === 'Dinheiro').reduce((a,b) => a + b.total, 0);
    const totalPix = reportItems.filter(i => i.paymentMethod === 'Pix').reduce((a,b) => a + b.total, 0);
    const totalDebit = reportItems.filter(i => i.paymentMethod.includes('Débito')).reduce((a,b) => a + b.total, 0);
    const totalCredit = reportItems.filter(i => i.paymentMethod.includes('Crédito')).reduce((a,b) => a + b.total, 0);
    
    onSubmitReport({ volunteerName, serviceType, date: reportDate, time: reportTime, items: reportItems, notes, totalCash, totalPix, totalDebit, totalCredit, grandTotal: totalCash + totalPix + totalDebit + totalCredit });
    setReportItems([]); setNotes(''); setVolunteerName(''); setCurrentItem(null); setCustomerPhone('');
    alert("Relatório enviado para Validação Pastoral!");
  };

  const totalGeral = reportItems.filter(i => i.paymentMethod !== 'Sara Points').reduce((a,b) => a + b.total, 0);

  return (
    <div className="flex flex-col h-full gap-6 pb-24 lg:pb-0 animate-fade-in relative z-10">
      {isScanning && <BarcodeScanner onScan={handleScanSuccess} onClose={() => setIsScanning(false)} />}

      {/* CABEÇALHO (Visual Dark Premium) */}
      <div className="bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-6 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 uppercase tracking-wider"><User size={12} className="text-green-500"/> Voluntário</label>
            <input list="volunteers_list" value={volunteerName} onChange={e => setVolunteerName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-green-500 transition-all" placeholder="Selecione..." />
            <datalist id="volunteers_list">{availableVolunteers.map(v => <option key={v} value={v} />)}</datalist>
        </div>
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 uppercase tracking-wider"><Church size={12} className="text-green-500"/> Culto / Evento</label>
            <input list="services_list" value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-green-500 transition-all" placeholder="Selecione..." />
            <datalist id="services_list">{availableServices.map(s => <option key={s} value={s} />)}</datalist>
        </div>
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 uppercase tracking-wider"><Calendar size={12} className="text-green-500"/> Data</label>
            <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-green-500 transition-all" />
        </div>
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 uppercase tracking-wider"><Clock size={12} className="text-green-500"/> Hora</label>
            <input type="time" value={reportTime} onChange={e => setReportTime(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-green-500 transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* COLUNA DA ESQUERDA: AÇÕES */}
        <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* CARD DE ADICIONAR PRODUTO */}
            <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/10 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-white/10 pb-3">
                    <Barcode size={16} className="text-green-500"/> Adicionar Linha
                </h3>
                
                {/* Busca */}
                <div className="flex gap-2 mb-6">
                    <div className="relative flex-1 group/input">
                        <Search className="absolute left-3 top-3 text-zinc-500 group-focus-within/input:text-green-500 transition-colors" size={18} />
                        <input 
                            ref={searchInputRef} 
                            placeholder="Bipe ou digite o nome..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            onKeyDown={handleSearchKeyDown} 
                            className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-green-500 transition-all placeholder-zinc-600" 
                        />
                    </div>
                    <button onClick={() => setIsScanning(true)} className="p-3 bg-zinc-800/50 border border-white/10 rounded-xl text-zinc-400 hover:text-green-500 hover:border-green-500 transition-all">
                        <ScanLine size={22} />
                    </button>
                </div>

                {currentItem ? (
                    <div className="animate-fade-in space-y-4">
                        {/* Preview do Produto */}
                        <div className="bg-black/60 p-4 rounded-xl border border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="font-bold text-white text-lg leading-tight">{currentItem.name}</p>
                                    <p className="text-xs text-zinc-500 font-mono mt-1 flex items-center gap-1"><Barcode size={10}/> {currentItem.barcode || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Unitário</p>
                                    <p className="text-green-400 font-black text-xl">R$ {currentItem.price.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Identificação do Cliente */}
                        <div className="bg-zinc-800/30 p-4 rounded-xl border border-white/5 space-y-3">
                            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                                <Phone size={16} className="text-zinc-500"/>
                                <input 
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    placeholder="Tel Cliente (Para Pontos)"
                                    className="bg-transparent w-full text-sm outline-none text-white placeholder-zinc-600 font-medium"
                                />
                            </div>
                            {activeCustomer ? (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-white flex items-center gap-1"><User size={12} className="text-green-500"/> {activeCustomer.name}</span>
                                    <div className="text-right bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                                        <span className="font-bold text-yellow-500 flex items-center gap-1 justify-end"><Star size={12} className="fill-yellow-500"/> {activeCustomer.points} pts</span>
                                    </div>
                                </div>
                            ) : customerPhone.length > 8 && (
                                <p className="text-xs text-zinc-500 italic pl-7">Novo cliente será cadastrado automaticamente.</p>
                            )}
                        </div>

                        {/* Quantidade */}
                        <div className="flex items-center justify-between bg-black/60 p-2 rounded-xl border border-white/10">
                            <button onClick={() => setCurrentItem({...currentItem, quantity: Math.max(1, currentItem.quantity - 1)})} className="p-3 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors"><Minus size={18}/></button>
                            <span className="font-black text-2xl text-white w-16 text-center">{currentItem.quantity}</span>
                            <button onClick={() => setCurrentItem({...currentItem, quantity: currentItem.quantity + 1})} className="p-3 hover:bg-white/10 text-white rounded-lg transition-colors"><Plus size={18}/></button>
                        </div>

                        {/* Botões de Pagamento */}
                        <div className="grid grid-cols-2 gap-3">
                             <PayBtn label="Dinheiro" icon={DollarSign} onClick={() => addLineToReport('Dinheiro')} />
                             <PayBtn label="Pix" icon={ScanLine} onClick={() => addLineToReport('Pix')} />
                             <PayBtn label="Débito" icon={CreditCard} onClick={() => addLineToReport('Cartão Débito')} />
                             <PayBtn label="Crédito" icon={CreditCard} onClick={() => addLineToReport('Cartão Crédito (1x)')} />
                             
                             <button 
                                onClick={() => addLineToReport('Sara Points')}
                                disabled={!activeCustomer || (activeCustomer.points * pointsValue) < (currentItem.price * currentItem.quantity)}
                                className={`col-span-2 py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                                    !activeCustomer || (activeCustomer.points * pointsValue) < (currentItem.price * currentItem.quantity)
                                    ? 'bg-zinc-800/50 text-zinc-600 border-white/5 cursor-not-allowed'
                                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                                }`}
                             >
                                <Star size={14} className={activeCustomer && (activeCustomer.points * pointsValue) >= (currentItem.price * currentItem.quantity) ? "fill-yellow-500" : ""} /> 
                                {activeCustomer ? `Usar Pontos (Custa ${((currentItem.price * currentItem.quantity)/pointsValue).toFixed(0)} pts)` : "Identifique o Cliente para usar pontos"}
                             </button>
                        </div>
                        
                        <button onClick={() => setCurrentItem(null)} className="w-full py-3 text-xs font-bold text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all flex items-center justify-center gap-2">
                            <X size={14}/> Cancelar seleção
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 py-10 opacity-50">
                        <Barcode size={64} className="mb-4 text-zinc-800" strokeWidth={1} />
                        <p className="text-sm font-medium">Aguardando leitura do produto...</p>
                    </div>
                )}
            </div>

            {/* CARD DE OBSERVAÇÕES */}
            <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 flex-1 relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h4 className="font-bold text-zinc-400 text-sm mb-3 flex items-center gap-2 uppercase tracking-wide"><FileText size={16} className="text-yellow-500"/> Retirada / Observações</h4>
                <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-3 resize-none outline-none text-sm text-white placeholder-zinc-600 focus:border-yellow-500/50 transition-all" 
                    placeholder="Ex: Retirado por Fulano..." 
                />
            </div>
        </div>

        {/* COLUNA DA DIREITA: LISTA E TOTAIS */}
        <div className="lg:col-span-2 bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10 flex flex-col overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="p-5 bg-black/40 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2"><ShoppingCart size={16} className="text-green-500"/> Itens do Relatório</h3>
                <span className="text-[10px] bg-green-500/10 text-green-500 px-3 py-1 rounded-full font-bold uppercase tracking-wider">{reportItems.length} LINHAS</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20">
                <table className="w-full text-sm text-left">
                    <thead className="bg-black/60 text-zinc-500 text-[10px] uppercase font-bold sticky top-0 shadow-md z-10 backdrop-blur-md">
                        <tr>
                            <th className="p-4 tracking-wider">Qtd</th>
                            <th className="p-4 tracking-wider">Produto</th>
                            <th className="p-4 tracking-wider">Pagamento</th>
                            <th className="p-4 text-right tracking-wider">Total</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {reportItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4 font-mono text-green-500 font-bold">{item.quantity}x</td>
                                <td className="p-4">
                                    <span className="text-white font-medium text-base">{item.productName}</span>
                                    {item.customerPhone && <span className="block text-[10px] text-zinc-400 flex items-center gap-1 mt-1"><User size={10} className="text-green-500"/> Cliente identificado</span>}
                                </td>
                                <td className="p-4">
                                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide border ${
                                        item.paymentMethod === 'Sara Points' 
                                        ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' 
                                        : 'bg-zinc-800/50 text-zinc-300 border-white/10'
                                    }`}>
                                        {item.paymentMethod}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-black text-white text-base">
                                    R$ {item.total.toFixed(2)}
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => setReportItems(prev => prev.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg">
                                        <Trash2 size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {reportItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
                        <ShoppingBag size={48} className="mb-4 text-zinc-800" strokeWidth={1} />
                        <p className="text-sm font-medium">Nenhum item adicionado ainda.</p>
                    </div>
                )}
            </div>

            {/* RODAPÉ DO RELATÓRIO */}
            <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl">
                <div className="flex justify-between items-end mb-6">
                    <div className="text-xs text-zinc-400 font-medium space-y-2">
                        <p className="flex items-center gap-2"><ScanLine size={14} className="text-green-500"/> Total Pix: <span className="text-white font-bold ml-auto">R$ {reportItems.filter(i => i.paymentMethod === 'Pix').reduce((a,b) => a + b.total, 0).toFixed(2)}</span></p>
                        <p className="flex items-center gap-2"><DollarSign size={14} className="text-green-500"/> Total Dinheiro: <span className="text-white font-bold ml-auto">R$ {reportItems.filter(i => i.paymentMethod === 'Dinheiro').reduce((a,b) => a + b.total, 0).toFixed(2)}</span></p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest mb-1">Total Geral (Financeiro)</p>
                        <p className="text-4xl font-black text-white tracking-tight leading-none">R$ {totalGeral.toFixed(2)}</p>
                    </div>
                </div>
                <button 
                    onClick={handleFinalizeReport} 
                    className="w-full bg-gradient-to-br from-green-600 to-green-700 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:from-green-500 hover:to-green-600 shadow-lg shadow-green-900/30 flex justify-center items-center gap-3 transition-all transform active:scale-[0.99] text-sm"
                >
                    <Save size={20} /> Finalizar e Enviar para Validação
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const PayBtn = ({ label, icon: Icon, onClick }: { label: string, icon: any, onClick: () => void }) => (
    <button onClick={onClick} className="bg-zinc-800/50 border border-white/5 py-3 rounded-xl text-xs font-bold text-zinc-300 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all flex items-center justify-center gap-2 group">
        <Icon size={16} className="text-zinc-500 group-hover:text-white transition-colors" /> {label}
    </button>
);

// Ícones adicionais necessários para o novo visual
import { ShoppingCart, ShoppingBag } from 'lucide-react';
