import React, { useState } from 'react';
import { DailyReport } from '../types';
import { CheckCircle, Clock, FileText, ChevronDown, ChevronUp, AlertCircle, DollarSign } from 'lucide-react';

interface ReportValidationProps {
  reports: DailyReport[];
  onValidate: (reportId: string) => void;
}

export const ReportValidation: React.FC<ReportValidationProps> = ({ reports, onValidate }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pendingReports = reports.filter(r => r.status === 'PENDENTE');
  const validatedReports = reports.filter(r => r.status === 'VALIDADO');

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="text-indigo-600" /> Validação Pastoral
        </h2>
      </div>

      {/* Seção de Pendentes */}
      <div>
        <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertCircle size={16} /> Relatórios Aguardando Conferência ({pendingReports.length})
        </h3>

        {pendingReports.length === 0 ? (
            <p className="text-slate-400 text-sm italic bg-slate-50 p-4 rounded-xl border border-slate-200">Nenhum relatório pendente.</p>
        ) : (
            <div className="space-y-4">
                {pendingReports.map(report => (
                    <ReportCard key={report.id} report={report} isExpanded={expandedId === report.id} onToggle={() => toggleExpand(report.id)} onAction={() => onValidate(report.id)} />
                ))}
            </div>
        )}
      </div>

      {/* Seção de Validados (Histórico) */}
      <div className="opacity-70">
        <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2 mt-8">
            <CheckCircle size={16} /> Histórico Validado Recentemente
        </h3>
        <div className="space-y-4">
            {validatedReports.slice(0, 5).map(report => (
                <div key={report.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center">
                    <div>
                        <p className="font-bold text-slate-700">{report.serviceType}</p>
                        <p className="text-xs text-slate-500">{new Date(report.date).toLocaleDateString('pt-BR')} por {report.volunteerName}</p>
                    </div>
                    <span className="text-emerald-600 font-bold text-sm bg-emerald-100 px-3 py-1 rounded-full">Validado</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// Card detalhado que imita a folha de papel
const ReportCard = ({ report, isExpanded, onToggle, onAction }: { report: DailyReport, isExpanded: boolean, onToggle: () => void, onAction: () => void }) => {
    return (
        <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'shadow-lg border-indigo-200' : 'shadow-sm border-slate-200'}`}>
            {/* Cabeçalho do Card */}
            <div onClick={onToggle} className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50">
                <div className="flex gap-4 items-center">
                    <div className="bg-amber-100 text-amber-600 p-2 rounded-lg">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">{report.serviceType}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><Clock size={12}/> {report.date} - {report.time}</span>
                            <span className="flex items-center gap-1">Resp: <strong>{report.volunteerName}</strong></span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400">Total do Relatório</p>
                        <p className="text-xl font-bold text-indigo-700">R$ {report.grandTotal.toFixed(2)}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="text-slate-400"/> : <ChevronDown className="text-slate-400"/>}
                </div>
            </div>

            {/* Conteúdo Expandido (A Tabela Igual ao Papel) */}
            {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-6 animate-fade-in">
                    
                    {/* Tabela de Itens */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">QTD</th>
                                    <th className="p-3">PRODUTO</th>
                                    <th className="p-3">FORMA PAG.</th>
                                    <th className="p-3 text-right">VALOR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {report.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="p-3 font-medium text-slate-700">{item.quantity}</td>
                                        <td className="p-3 text-slate-600">{item.productName}</td>
                                        <td className="p-3">
                                            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">
                                                {item.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right font-medium text-slate-800">R$ {item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Rodapé do Relatório (Resumo Financeiro) */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <SummaryBox label="Dinheiro" value={report.totalCash} />
                        <SummaryBox label="Pix" value={report.totalPix} />
                        <SummaryBox label="Débito" value={report.totalDebit} />
                        <SummaryBox label="Crédito" value={report.totalCredit} />
                        <div className="bg-indigo-600 text-white p-3 rounded-xl flex flex-col justify-center items-center shadow-lg transform scale-105">
                            <span className="text-xs font-medium opacity-80 mb-1">TOTAL GERAL</span>
                            <span className="text-lg font-bold">R$ {report.grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Campo de Observações (Retirada do Devocional) */}
                    {report.notes && (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-6">
                            <h5 className="text-xs font-bold text-yellow-700 uppercase mb-2">Retirada / Observações</h5>
                            <p className="text-sm text-yellow-900 whitespace-pre-line font-medium handwriting">{report.notes}</p>
                        </div>
                    )}

                    {/* Botão de Ação */}
                    <div className="flex justify-end pt-4 border-t border-slate-200">
                        <button 
                            onClick={onAction}
                            className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200 font-bold flex items-center gap-2 transition-all"
                        >
                            <CheckCircle size={20} /> Confirmar e Validar Caixa
                        </button>
                    </div>
                </div>
            )}
            <style>{`
                .handwriting {
                    font-family: 'Courier New', Courier, monospace;
                }
            `}</style>
        </div>
    );
}

const SummaryBox = ({ label, value }: { label: string, value: number }) => (
    <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-center items-center">
        <span className="text-xs text-slate-400 font-medium uppercase mb-1">{label}</span>
        <span className="text-sm font-bold text-slate-700">R$ {value.toFixed(2)}</span>
    </div>
);
