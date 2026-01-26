import React, { useState, useRef, useMemo } from 'react';
import { Product, PaymentMethod, DailyReport, ReportItem, CartItem, Customer } from '../types';
import { Plus, Minus, Trash2, Search, Barcode, Save, FileText, User, Church, Calendar, Clock, ScanLine, Phone, Star, X, CheckCircle, CreditCard, DollarSign } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { BarcodeScanner } from './components/BarcodeScanner';

interface VolunteerSalesProps {
  products: Product[];
  availableVolunteers: string[]; 
  availableServices: string[];   
  customers: Customer[]; 
  pointsValue: number; // Recebe o valor do ponto (ex: 0.10)
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
  
  // --- NOVO: IDENTIFICAÇÃO DO CLIENTE ---
  const [customerPhone, setCustomerPhone] = useState(''); 
  
  const [isScanning, setIsScanning] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Busca o cliente na lista
  const activeCustomer = useMemo(() => {
      const cleanPhone = customerPhone.replace(/\D/g, '');
      return customers.find(c => c.id === cleanPhone);
  }, [customerPhone, customers]);

  const handleScanSuccess = (code: string) => {
    const foundProduct = products.find(p => p.barcode === code);
    if (foundProduct) {
        setCurrentItem({ ...foundProduct, quantity: 1 });
        setSearchTerm(''); 
        setIsScanning(false);
    } else {
        alert(`Produto com código ${code} não encontrado!`);
        setIsScanning(false);
    }
  };

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

    if (method === 'Sara Points') {
        if (!activeCustomer) { alert("Informe o telefone do cliente para usar pontos."); return; }
        // Custo em pontos = Preço em R$ / Valor do Ponto
        const costInPoints = (currentItem.price * currentItem.quantity) / pointsValue;
        
        if (activeCustomer.points < costInPoints) { 
            alert(`Saldo insuficiente! Necessário: ${costInPoints.toFixed(0)} pts`); 
            return; 
        }
    }

    const newItem: ReportItem = {
        productName: currentItem.name,
        quantity: currentItem.quantity,
        paymentMethod: method,
        total: method === 'Sara Points' ? (currentItem.price * currentItem.quantity) : (currentItem.price * currentItem.quantity),
        customerPhone: activeCustomer ? activeCustomer.id : undefined 
    };
    
    setReportItems(prev => [newItem, ...prev]);
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
    setReportItems([]);
    setNotes('');
    setVolunteerName('');
    setCurrentItem(null); 
    setCustomerPhone('');
    alert("Relatório enviado para Validação Pastoral!");
  };

  const totalGeral = reportItems.filter(i => i.paymentMethod !== 'Sara Points').reduce((a,b) => a + b.total, 0);

  return (
    <div className="flex flex-col h-full gap-6 pb-24 lg:pb-0 animate-fade-in">
      {isScanning && <BarcodeScanner onScan={handleScanSuccess} onClose={() => setIsScanning(false)} />}

      {/* CABEÇALHO (Estilo Dark Card) */}
      <div className="bg-zinc-900 p-5 rounded-2xl shadow-lg border border-zinc-800 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 uppercase tracking-wider"><User size={12}/> Voluntário</label>
            <input list="volunteers_list" value={volunteerName} onChange={e => setVolunteerName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-green-500 transition-colors" placeholder="Selecione..." />
            <datalist id="volunteers_list">{availableVolunteers.map(v => <option key={v} value={v} />)}</datalist>
        </div>
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 uppercase tracking-wider"><Church size={12}/> Culto / Evento</label>
            <input list="services_list" value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-green-500 transition-colors" placeholder="Selecione..." />
            <datalist id="services_list">{availableServices.map(s => <option key={s} value={s} />)}</datalist>
        </div>
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 uppercase tracking-wider"><Calendar size={12}/> Data</label>
            <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-green-500 transition-colors" />
        </div>
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 uppercase tracking-wider"><Clock size={12}/> Hora</label>
            <input type="time" value={reportTime} onChange={e => setReportTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-green-500 transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* COLUNA DA ESQUERDA: AÇÕES */}
        <div className="lg:col-span-1 flex flex-col gap-4">
            
            {/* CARD DE ADICIONAR PRODUTO */}
            <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg border border-zinc-800 flex flex-col">
                <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-zinc-800 pb-2">
                    <Barcode size={16} className="text-green-500"/> Adicionar Linha
                </h3>
                
                {/* Busca */}
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 text-zinc-500" size={16} />
                        <input 
                            ref={searchInputRef} 
                            placeholder="Bipe ou digite..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            onKeyDown={handleSearchKeyDown} 
                            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-zinc-700 rounded-xl text-sm text-white outline-none focus:border-green-500 transition-all placeholder-zinc-600" 
                        />
                    </div>
                    <button onClick={() => setIsScanning(true)} className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 hover:text-green-500 hover:border-green-500 transition-all">
                        <ScanLine size={20} />
                    </button>
                </div>

                {currentItem ? (
                    <div className="animate-fade-in space-y-4">
                        {/* Preview do Produto */}
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="font-bold text-white text-lg leading-tight">{currentItem.name}</p>
                                    <p className="text-xs text-zinc-500 mt-1">Código: {currentItem.barcode || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-zinc-400">Unitário</p>
                                    <p className="text-green-400 font-bold">R$ {currentItem.price.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Identificação do Cliente (Opcional) */}
                        <div className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/50 space-y-2">
                            <div className="flex items-center gap-2 border-b border-zinc-700 pb-2">
                                <Phone size={14} className="text-zinc-500"/>
                                <input 
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    placeholder="Tel Cliente (Para Pontos)"
                                    className="bg-transparent w-full text-xs outline-none text-white placeholder-zinc-600"
                                />
                            </div>
                            {activeCustomer ? (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-green-400">{activeCustomer.name}</span>
                                    <div className="text-right">
                                        <span className="font-bold text-yellow-500 flex items-center gap-1 justify-end"><Star size={10}/> {activeCustomer.points} pts</span>
                                        <span className="text-[9px] text-zinc-500">Vale R$ {(activeCustomer.points * pointsValue).toFixed(2)}</span>
                                    </div>
                                </div>
                            ) : customerPhone.length > 8 && (
                                <p className="text-[10px] text-zinc-500 italic">Novo cliente será cadastrado.</p>
                            )}
                        </div>

                        {/* Quantidade */}
                        <div className="flex items-center justify-between bg-black/40 p-2 rounded-xl border border-zinc-800">
                            <button onClick={() => setCurrentItem({...currentItem, quantity: Math.max(1, currentItem.quantity - 1)})} className="p-2 hover:bg-zinc-800 text-zinc-400 rounded-lg transition-colors"><Minus size={16}/></button>
                            <span className="font-bold text-xl text-white w-12 text-center">{currentItem.quantity}</span>
                            <button onClick={() => setCurrentItem({...currentItem, quantity: currentItem.quantity + 1})} className="p-2 hover:bg-zinc-800 text-white rounded-lg transition-colors"><Plus size={16}/></button>
                        </div>

                        {/* Botões de Pagamento */}
                        <div className="grid grid-cols-2 gap-2">
                             <PayBtn label="Dinheiro" icon={DollarSign} onClick={() => addLineToReport('Dinheiro')} />
                             <PayBtn label="Pix" icon={ScanLine} onClick={() => addLineToReport('Pix')} />
                             <PayBtn label="Débito" icon={CreditCard} onClick={() => addLineToReport('Cartão Débito')} />
                             <PayBtn label="Crédito" icon={CreditCard} onClick={() => addLineToReport('Cartão Crédito (1x)')} />
                             
                             {/* Botão Especial Sara Points */}
                             <button 
                                onClick={() => addLineToReport('Sara Points')}
                                disabled={!activeCustomer || (activeCustomer.points * pointsValue) < (currentItem.price * currentItem.quantity)}
                                className={`col-span-2 py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                                    !activeCustomer || (activeCustomer.points * pointsValue) < (currentItem.price * currentItem.quantity)
                                    ? 'bg-zinc-800 text-zinc-600 border-zinc-800 cursor-not-allowed'
                                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                                }`}
                             >
                                <Star size={14} className={activeCustomer && (activeCustomer.points * pointsValue) >= (currentItem.price * currentItem.quantity) ? "fill-yellow-500" : ""} /> 
                                {activeCustomer ? `Usar Pontos (Custa ${((currentItem.price * currentItem.quantity)/pointsValue).toFixed(0)} pts)` : "Identifique o Cliente"}
                             </button>
                        </div>
                        
                        <button onClick={() => setCurrentItem(null)} className="w-full py-2 text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center justify-center gap-1">
                            <X size={12}/> Cancelar seleção
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 py-10 opacity-50">
                        <Barcode size={48} className="mb-2" />
                        <p className="text-xs">Aguardando leitura...</p>
                    </div>
                )}
            </div>

            {/* CARD DE OBSERVAÇÕES */}
            <div className="bg-yellow-900/10 p-4 rounded-2xl border border-yellow-500/20 flex-1">
                <h4 className="font-bold text-yellow-600 text-xs mb-2 flex items-center gap-2 uppercase tracking-wide"><FileText size={14}/> Retirada / Observações</h4>
                <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    className="w-full h-20 bg-transparent resize-none outline-none text-sm text-yellow-500/80 placeholder-yellow-700/30" 
                    placeholder="Ex: Cláudia Oliveira - Chamada..." 
                />
            </div>
        </div>

        {/* COLUNA DA DIREITA: LISTA E TOTAIS */}
        <div className="lg:col-span-2 bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 flex flex-col overflow-hidden">
            <div className="p-4 bg-zinc-950/50 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-zinc-300 text-sm uppercase tracking-wide">Itens do Relatório</h3>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full font-mono">{reportItems.length} linhas</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase font-bold sticky top-0 shadow-md z-10">
                        <tr>
                            <th className="p-4">Qtd</th>
                            <th className="p-4">Produto</th>
                            <th className="p-4">Pagamento</th>
                            <th className="p-4 text-right">Total</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {reportItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4 font-mono text-zinc-400">{item.quantity}x</td>
                                <td className="p-4">
                                    <span className="text-zinc-200 font-medium">{item.productName}</span>
                                    {item.customerPhone && <span className="block text-[10px] text-green-500/70 flex items-center gap-1 mt-0.5"><User size={8}/> Cliente identificado</span>}
                                </td>
                                <td className="p-4">
                                    <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wide ${
                                        item.paymentMethod === 'Sara Points' 
                                        ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' 
                                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                    }`}>
                                        {item.paymentMethod}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-bold text-zinc-300 font-mono">
                                    R$ {item.total.toFixed(2)}
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => setReportItems(prev => prev.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {reportItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-zinc-600">
                        <p className="text-sm">Relatório vazio</p>
                    </div>
                )}
            </div>

            {/* RODAPÉ DO RELATÓRIO */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-900">
                <div className="flex justify-between items-end mb-6">
                    <div className="text-[10px] text-zinc-500 font-mono space-y-1">
                        <p>Total Pix: <span className="text-zinc-300">R$ {reportItems.filter(i => i.paymentMethod === 'Pix').reduce((a,b) => a + b.total, 0).toFixed(2)}</span></p>
                        <p>Total Dinheiro: <span className="text-zinc-300">R$ {reportItems.filter(i => i.paymentMethod === 'Dinheiro').reduce((a,b) => a + b.total, 0).toFixed(2)}</span></p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Total Geral (Financeiro)</p>
                        <p className="text-4xl font-black text-white tracking-tight">R$ {totalGeral.toFixed(2)}</p>
                    </div>
                </div>
                <button 
                    onClick={handleFinalizeReport} 
                    className="w-full bg-green-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] flex justify-center items-center gap-3 transition-all transform active:scale-[0.99]"
                >
                    <Save size={20} /> Finalizar e Enviar para Validação
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

// Componente de botão auxiliar estilizado
const PayBtn = ({ label, icon: Icon, onClick }: { label: string, icon: any, onClick: () => void }) => (
    <button onClick={onClick} className="bg-zinc-800 border border-zinc-700 py-3 rounded-xl text-xs font-bold text-zinc-300 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all flex items-center justify-center gap-2 group">
        <Icon size={14} className="text-zinc-500 group-hover:text-white transition-colors" /> {label}
    </button>
);
