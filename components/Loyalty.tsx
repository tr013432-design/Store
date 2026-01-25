import React, { useState } from 'react';
import { Customer, Category } from '../types';
import { Trophy, Search, Gift, Phone, Plus, Star, AlertCircle, Settings, Save } from 'lucide-react';

interface LoyaltyProps {
  customers: Customer[];
  pointsConfig?: Record<string, number>; // NOVA PROP
  onUpdatePointsConfig?: (config: Record<string, number>) => void; // NOVA PROP
  onManualAddPoints: (phone: string, points: number) => void;
  onRedeemReward: (phone: string, cost: number) => void;
}

export const Loyalty: React.FC<LoyaltyProps> = ({ customers, pointsConfig, onUpdatePointsConfig, onManualAddPoints, onRedeemReward }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Estado para o painel de configuração
  const [showConfig, setShowConfig] = useState(false);
  const [tempConfig, setTempConfig] = useState<Record<string, number>>(pointsConfig || {});

  // Filtra e ordena
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.id.includes(searchTerm)
  ).sort((a, b) => b.points - a.points);

  const rewardsAvailable = selectedCustomer ? Math.floor(selectedCustomer.points / 100) : 0;
  const pointsToNext = selectedCustomer ? selectedCustomer.points % 100 : 0;
  const missingPoints = 100 - pointsToNext;

  const handleSaveConfig = () => {
      if (onUpdatePointsConfig) {
          onUpdatePointsConfig(tempConfig);
          setShowConfig(false);
          alert("Regras de pontuação atualizadas!");
      }
  };

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
        
        <div className="flex items-center gap-2 w-full md:w-auto">
            {/* BOTÃO CONFIGURAR */}
            <button onClick={() => setShowConfig(!showConfig)} className={`p-3 rounded-xl border transition-colors ${showConfig ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}`}>
                <Settings size={20} />
            </button>

            <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-3.5 text-zinc-500" size={20} />
                <input 
                    placeholder="Buscar Cliente..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-yellow-500 transition-colors"
                />
            </div>
        </div>
      </div>

      {/* PAINEL DE CONFIGURAÇÃO (Toggle) */}
      {showConfig && pointsConfig && (
          <div className="bg-zinc-900 border border-indigo-500/30 p-6 rounded-2xl animate-fade-in mb-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Settings size={18} className="text-indigo-500"/> Configurar Pontos por Categoria</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Object.values(Category).map(cat => (
                      <div key={cat} className="bg-black p-3 rounded-xl border border-zinc-800">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2 h-8">{cat}</label>
                          <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                value={tempConfig[cat] || 0} 
                                onChange={e => setTempConfig({...tempConfig, [cat]: parseInt(e.target.value) || 0})}
                                className="w-full bg-zinc-900 text-white font-bold border border-zinc-700 rounded p-2 text-center outline-none focus:border-indigo-500"
                              />
                              <span className="text-xs text-zinc-500">pts</span>
                          </div>
                      </div>
                  ))}
              </div>
              <button onClick={handleSaveConfig} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-colors">
                  <Save size={18} /> Salvar Regras
              </button>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LISTA */}
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
                            <p className={`text-2xl font-black ${customer.points < 0 ? 'text-red-500' : 'text-yellow-500'}`}>{customer.points}</p>
                            <p className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Pontos</p>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* DETALHES */}
        <div className="lg:col-span-1">
            {selectedCustomer ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-6">
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center mb-3 relative">
                            <Trophy size={40} className="text-yellow-500" />
                            {rewardsAvailable > 0 && <div className="absolute -top-2 -right-2 bg-red-600 text-white font-bold w-8 h-8 flex items-center justify-center rounded-full border-4 border-zinc-900 shadow-lg">{rewardsAvailable}</div>}
                        </div>
                        <h2 className="text-2xl font-bold text-white">{selectedCustomer.name}</h2>
                        {rewardsAvailable > 0 ? <p className="text-yellow-400 font-bold text-sm animate-pulse">🎉 {rewardsAvailable} PRÊMIO(S) DISPONÍVEL(IS)!</p> : <p className="text-zinc-500 text-sm">Continue comprando para ganhar!</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-black p-3 rounded-xl border border-zinc-800 text-center"><p className="text-xs text-zinc-500 uppercase">Total Gasto</p><p className="font-bold text-white">R$ {selectedCustomer.totalSpent.toFixed(2)}</p></div>
                        <div className="bg-black p-3 rounded-xl border border-zinc-800 text-center"><p className="text-xs text-zinc-500 uppercase">Última Compra</p><p className="font-bold text-white">{new Date(selectedCustomer.lastPurchase).toLocaleDateString()}</p></div>
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between text-xs font-bold uppercase mb-1"><span className="text-yellow-500">Próximo Nível</span><span className="text-zinc-400">{pointsToNext} / 100</span></div>
                        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden relative">
                            <div className="absolute inset-0 flex justify-between px-1"><div className="w-px h-full bg-zinc-700/50"></div><div className="w-px h-full bg-zinc-700/50"></div><div className="w-px h-full bg-zinc-700/50"></div></div>
                            <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500" style={{ width: `${pointsToNext}%` }}></div>
                        </div>
                        <p className="text-xs text-center mt-2 text-zinc-500">Faltam <strong>{missingPoints} pontos</strong> para o próximo brinde.</p>
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={() => {
                                if (rewardsAvailable > 0) { if(window.confirm(`CONFIRMAR RESGATE?\n\nIsso vai descontar 100 pontos.`)) onRedeemReward(selectedCustomer.id, 100); } 
                                else { alert(`Faltam ${missingPoints} pontos para liberar o resgate!`); }
                            }}
                            disabled={rewardsAvailable === 0}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${rewardsAvailable > 0 ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transform hover:scale-[1.02]' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'}`}
                        >
                            <Gift size={20} className={rewardsAvailable > 0 ? "animate-bounce" : ""} /> {rewardsAvailable > 0 ? "RESGATAR PRÊMIO (-100)" : "SALDO INSUFICIENTE"}
                        </button>
                        
                        {selectedCustomer.points < 0 && (<div className="bg-red-500/10 border border-red-500/50 p-3 rounded-xl flex items-center gap-2 text-red-400 text-xs"><AlertCircle size={16} /> <span>Erro: Saldo negativo detectado.</span><button onClick={() => onManualAddPoints(selectedCustomer.id, Math.abs(selectedCustomer.points))} className="underline hover:text-white ml-auto">Zerar</button></div>)}

                        <button onClick={() => { const pts = prompt("Adicionar pontos:"); if (pts && !isNaN(parseInt(pts))) onManualAddPoints(selectedCustomer.id, parseInt(pts)); }} className="w-full py-3 bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-xl font-bold hover:bg-zinc-900 hover:text-white flex items-center justify-center gap-2 transition-colors text-xs uppercase tracking-wider"><Plus size={16} /> Ajuste Manual</button>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-2xl p-8"><Search size={48} className="mb-4 opacity-20" /><p>Selecione um cliente para ver detalhes</p></div>
            )}
        </div>
      </div>
    </div>
  );
};
