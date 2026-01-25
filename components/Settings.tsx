import React, { useState, useEffect } from 'react';
import { AdminUser, Category } from '../types';
import { Trash2, Plus, Settings as SettingsIcon, DollarSign } from 'lucide-react';

interface SettingsProps {
  volunteers: string[];
  services: string[];
  admins: AdminUser[];
  // Props do Sara Points
  pointsConfig: Record<string, number>;
  pointsValue: number;
  onUpdatePointsConfig: (config: Record<string, number>) => void;
  onUpdatePointsValue: (value: number) => void;
  // Props existentes
  onAddVolunteer: (name: string) => void;
  onRemoveVolunteer: (name: string) => void;
  onAddService: (service: string) => void;
  onRemoveService: (service: string) => void;
  onAddAdmin: (admin: Omit<AdminUser, 'id'>) => void;
  onRemoveAdmin: (id: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  volunteers, services, admins, 
  pointsConfig, pointsValue, onUpdatePointsConfig, onUpdatePointsValue,
  onAddVolunteer, onRemoveVolunteer,
  onAddService, onRemoveService,
  onAddAdmin, onRemoveAdmin
}) => {
  const [newVol, setNewVol] = useState('');
  const [newServ, setNewServ] = useState('');
  
  // Estado local para edição dos pontos (Evita lag ao digitar)
  const [tempConfig, setTempConfig] = useState<Record<string, number>>(pointsConfig || {});
  const [tempValue, setTempValue] = useState(pointsValue || 0.10);

  // Sincroniza se o pai atualizar
  useEffect(() => {
    if (pointsConfig) setTempConfig(pointsConfig);
    if (pointsValue) setTempValue(pointsValue);
  }, [pointsConfig, pointsValue]);

  const handleSavePoints = () => {
      onUpdatePointsConfig(tempConfig);
      onUpdatePointsValue(tempValue);
      alert("Configurações de Sara Points salvas com sucesso!");
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <SettingsIcon className="text-indigo-600"/> Configurações
      </h2>

      {/* --- SEÇÃO SARA POINTS --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-yellow-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <DollarSign className="text-yellow-500" /> Economia Sara Points
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* ESQUERDA: PONTOS POR CATEGORIA */}
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-3">GANHAR: Pontos por Categoria</p>
                  <div className="space-y-3">
                      {Object.values(Category).map(cat => (
                          <div key={cat} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200">
                              <span className="text-xs font-bold text-slate-600">{cat}</span>
                              <div className="flex items-center gap-1">
                                  <input 
                                    type="number" 
                                    value={tempConfig[cat] || 0}
                                    onChange={e => setTempConfig({...tempConfig, [cat]: parseInt(e.target.value) || 0})}
                                    className="w-16 text-center font-bold bg-white border border-slate-300 rounded text-indigo-600 outline-none focus:border-indigo-500 transition-colors"
                                  />
                                  <span className="text-[10px] text-slate-400">pts</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* DIREITA: VALOR DO PONTO */}
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-3">GASTAR: Poder de Compra</p>
                  <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100 flex flex-col items-center text-center h-full justify-center">
                      <label className="text-sm font-bold text-yellow-800 block mb-2">Quanto vale 1 Ponto?</label>
                      <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl font-bold text-yellow-600">R$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            value={tempValue}
                            onChange={e => setTempValue(parseFloat(e.target.value))}
                            className="text-4xl font-black bg-transparent border-b-2 border-yellow-400 w-32 text-center outline-none text-slate-800"
                          />
                      </div>
                      <p className="text-xs text-slate-500 mt-2 max-w-[200px]">
                          Isso significa que um cliente com <strong>100 pontos</strong> terá <strong>R$ {(100 * tempValue).toFixed(2)}</strong> de desconto.
                      </p>
                  </div>
              </div>
          </div>
          
          <button onClick={handleSavePoints} className="mt-6 w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              Salvar Regras de Fidelidade
          </button>
      </div>

      {/* --- SEÇÃO GERAL (Voluntários e Cultos) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4">Voluntários</h3>
            <div className="flex gap-2 mb-4"><input value={newVol} onChange={e => setNewVol(e.target.value)} placeholder="Nome..." className="flex-1 border rounded-lg px-3 text-sm outline-none" /><button onClick={() => { if(newVol) { onAddVolunteer(newVol); setNewVol(''); } }} className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200"><Plus size={18}/></button></div>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">{volunteers.map(v => (<div key={v} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded"><span>{v}</span><button onClick={() => onRemoveVolunteer(v)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></div>))}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4">Cultos / Eventos</h3>
            <div className="flex gap-2 mb-4"><input value={newServ} onChange={e => setNewServ(e.target.value)} placeholder="Nome..." className="flex-1 border rounded-lg px-3 text-sm outline-none" /><button onClick={() => { if(newServ) { onAddService(newServ); setNewServ(''); } }} className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200"><Plus size={18}/></button></div>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">{services.map(s => (<div key={s} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded"><span>{s}</span><button onClick={() => onRemoveService(s)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></div>))}</div>
        </div>
      </div>
    </div>
  );
};
