import React, { useState } from 'react';
import { Customer } from '../types';
import { Trophy, Search, Gift, Phone, Calendar, Plus, Star } from 'lucide-react';

interface LoyaltyProps {
  customers: Customer[];
  onManualAddPoints: (phone: string, points: number) => void;
  onRedeemReward: (phone: string, cost: number) => void;
}

export const Loyalty: React.FC<LoyaltyProps> = ({ customers, onManualAddPoints, onRedeemReward }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Filtra clientes pelo nome ou telefone
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.id.includes(searchTerm)
  ).sort((a, b) => b.points - a.points); // Ordena por quem tem mais pontos

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-zinc-800 pb-6">
        <div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                <Star className="text-yellow-500" fill="#eab308" /> Sara Points
            </h2>
            <p className="text-zinc-500 text-sm mt-1 font-bold tracking-widest uppercase">Programa de Fidelidade</p>
        </div>
        
        {/* BUSCA DE CLIENTE */}
        <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 text-zinc-500" size={20} />
            <input 
                placeholder="Buscar Cliente (Nome ou WhatsApp)..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-yellow-500 transition-colors"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LISTA DE CLIENTES */}
        <div className="lg:col-span-2 space-y-4">
            {filteredCustomers.length === 0 ? (
                <div className="text-center py-10 text-zinc-500">Nenhum cliente encontrado.</div>
            ) : (
                filteredCustomers.map(customer => (
                    <div key={customer.id} onClick={() => setSelectedCustomer(customer)} className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${selectedCustomer?.id === customer.id ? 'bg-zinc-800 border-yellow-500/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-zinc-700 flex items-center justify-center font-bold text-zinc-300">
                                {customer.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">{customer.name}</h3>
                                <p className="text-xs text-zinc-500 flex items-center gap-1"><Phone size={10}/> {customer.id}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black text-yellow-500">{customer.points}</p>
                            <p className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Pontos</p>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* DETALHES E AÇÕES */}
        <div className="lg:col-span-1">
            {selectedCustomer ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-6">
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center mb-3">
                            <Trophy size={40} className="text-yellow-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">{selectedCustomer.name}</h2>
                        <p className="text-zinc-500 text-sm">Cliente desde {new Date(selectedCustomer.history[0]?.date || Date.now()).toLocaleDateString()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-black p-3 rounded-xl border border-zinc-800 text-center">
                            <p className="text-xs text-zinc-500 uppercase">Total Gasto</p>
                            <p className="font-bold text-white">R$ {selectedCustomer.totalSpent.toFixed(2)}</p>
                        </div>
                        <div className="bg-black p-3 rounded-xl border border-zinc-800 text-center">
                            <p className="text-xs text-zinc-500 uppercase">Última Compra</p>
                            <p className="font-bold text-white">{new Date(selectedCustomer.lastPurchase).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* BARRA DE PROGRESSO DO PRÊMIO */}
                    <div className="mb-6">
                        <div className="flex justify-between text-xs font-bold uppercase mb-1">
                            <span className="text-yellow-500">Próximo Prêmio</span>
                            <span className="text-zinc-400">100 pts</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500" style={{ width: `${Math.min((selectedCustomer.points / 100) * 100, 100)}%` }}></div>
                        </div>
                        <p className="text-xs text-center mt-2 text-zinc-500">Faltam {Math.max(0, 100 - selectedCustomer.points)} pontos para resgatar um brinde!</p>
                    </div>

                    {/* BOTÕES DE AÇÃO */}
                    <div className="space-y-3">
                        <button 
                            onClick={() => {
                                if (selectedCustomer.points >= 100) {
                                    if(window.confirm(`Resgatar prêmio para ${selectedCustomer.name}? Isso vai descontar 100 pontos.`)) {
                                        onRedeemReward(selectedCustomer.id, 100);
                                    }
                                } else {
                                    alert("Pontos insuficientes para resgate (Min: 100)");
                                }
                            }}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${selectedCustomer.points >= 100 ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                        >
                            <Gift size={20} /> Resgatar Prêmio (100 pts)
                        </button>
                        
                        {/* Botão de Ajuste Manual (Só para Admin em tese, mas deixei aberto por enquanto) */}
                        <button 
                            onClick={() => {
                                const pts = prompt("Quantos pontos adicionar manualmente?");
                                if (pts) onManualAddPoints(selectedCustomer.id, parseInt(pts));
                            }}
                            className="w-full py-3 bg-zinc-800 text-zinc-300 rounded-xl font-bold hover:bg-zinc-700 flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> Adicionar Manual
                        </button>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-2xl p-8">
                    <Search size={48} className="mb-4 opacity-20" />
                    <p>Selecione um cliente para ver detalhes</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
