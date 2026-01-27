import React, { useState } from 'react';
import { AdminUser } from '../types';
import { Save, Plus, Trash2, Shield, Users, Church, Coins, Settings as SettingsIcon } from 'lucide-react';

interface SettingsProps {
  volunteers: string[];
  services: string[];
  admins: AdminUser[];
  pointsConfig: Record<string, number>;
  pointsValue: number;
  onUpdatePointsConfig: (config: Record<string, number>) => void;
  onUpdatePointsValue: (val: number) => void;
  onAddVolunteer: (name: string) => void;
  onRemoveVolunteer: (name: string) => void;
  onAddService: (service: string) => void;
  onRemoveService: (service: string) => void;
  onAddAdmin: (admin: Omit<AdminUser, 'id'>) => void;
  onRemoveAdmin: (id: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  volunteers, services, admins, pointsConfig, pointsValue,
  onUpdatePointsConfig, onUpdatePointsValue,
  onAddVolunteer, onRemoveVolunteer,
  onAddService, onRemoveService,
  onAddAdmin, onRemoveAdmin
}) => {
  // Estados locais para inputs
  const [newVol, setNewVol] = useState('');
  const [newService, setNewService] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  
  // Estado local para config de pontos (para editar antes de salvar)
  const [localPointsConfig, setLocalPointsConfig] = useState(pointsConfig);
  const [localPointsValue, setLocalPointsValue] = useState(pointsValue);

  const handleSavePoints = () => {
      onUpdatePointsConfig(localPointsConfig);
      onUpdatePointsValue(localPointsValue);
      alert("Regras de fidelidade salvas!");
  };

  const handleAddVol = () => { if(newVol) { onAddVolunteer(newVol); setNewVol(''); } };
  const handleAddServ = () => { if(newService) { onAddService(newService); setNewService(''); } };
  const handleAddAdm = () => { 
      if(newAdminName && newAdminEmail && newAdminPass) { 
          onAddAdmin({ name: newAdminName, email: newAdminEmail, password: newAdminPass });
          setNewAdminName(''); setNewAdminEmail(''); setNewAdminPass('');
      } 
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in relative z-10">
      
      {/* CABEÇALHO */}
      <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
            <SettingsIcon className="text-green-500" /> Configurações do Sistema
        </h2>
        <p className="text-zinc-400 text-sm mt-1">Gerencie regras, acessos e cadastros auxiliares.</p>
      </div>

      {/* BLOCO 1: FIDELIDADE (SARA POINTS) */}
      <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 relative overflow-hidden">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
              <Coins className="text-yellow-500"/> Regras de Fidelidade (Sara Points)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Pontos por Categoria (Ganho)</p>
                  {Object.entries(localPointsConfig).map(([cat, val]) => (
                      <div key={cat} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                          <span className="text-sm text-zinc-300">{cat}</span>
                          <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                value={val} 
                                onChange={e => setLocalPointsConfig({...localPointsConfig, [cat]: Number(e.target.value)})}
                                className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-right text-white font-bold outline-none focus:border-yellow-500"
                              />
                              <span className="text-xs text-yellow-500 font-bold">pts</span>
                          </div>
                      </div>
                  ))}
              </div>

              <div className="space-y-6">
                  <div className="bg-yellow-500/5 p-5 rounded-2xl border border-yellow-500/10 text-center">
                      <p className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-2">Valor Financeiro do Ponto</p>
                      <div className="flex justify-center items-end gap-2">
                          <span className="text-2xl font-bold text-zinc-500 mb-1">R$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            value={localPointsValue} 
                            onChange={e => setLocalPointsValue(Number(e.target.value))}
                            className="w-32 bg-transparent text-5xl font-black text-white text-center outline-none border-b-2 border-yellow-500/50 focus:border-yellow-500"
                          />
                      </div>
                      <p className="text-xs text-zinc-500 mt-4">Isso significa que 100 pontos valem R$ {(100 * localPointsValue).toFixed(2)} de desconto.</p>
                  </div>
                  
                  <button onClick={handleSavePoints} className="w-full bg-yellow-600 text-white py-4 rounded-xl font-bold hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-900/20 flex items-center justify-center gap-2">
                      <Save size={20}/> Salvar Regras
                  </button>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* BLOCO 2: VOLUNTÁRIOS */}
          <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                  <Users className="text-blue-500"/> Voluntários
              </h3>
              <div className="flex gap-2 mb-4">
                  <input 
                    value={newVol} 
                    onChange={e => setNewVol(e.target.value)} 
                    placeholder="Nome do voluntário..." 
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                  />
                  <button onClick={handleAddVol} className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-500"><Plus size={20}/></button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {volunteers.map(v => (
                      <div key={v} className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5 group">
                          <span className="text-sm text-zinc-300">{v}</span>
                          <button onClick={() => onRemoveVolunteer(v)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                      </div>
                  ))}
              </div>
          </div>

          {/* BLOCO 3: CULTOS */}
          <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                  <Church className="text-purple-500"/> Cultos / Eventos
              </h3>
              <div className="flex gap-2 mb-4">
                  <input 
                    value={newService} 
                    onChange={e => setNewService(e.target.value)} 
                    placeholder="Nome do culto..." 
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-purple-500"
                  />
                  <button onClick={handleAddServ} className="bg-purple-600 text-white p-2 rounded-xl hover:bg-purple-500"><Plus size={20}/></button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {services.map(s => (
                      <div key={s} className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5 group">
                          <span className="text-sm text-zinc-300">{s}</span>
                          <button onClick={() => onRemoveService(s)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* BLOCO 4: ADMINS */}
      <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
              <Shield className="text-red-500"/> Gestão de Acessos (Admins)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end bg-black/20 p-4 rounded-xl border border-white/5">
              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Nome</label>
                  <input value={newAdminName} onChange={e => setNewAdminName(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 outline-none" placeholder="Ex: Pastor João" />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">E-mail</label>
                  <input value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 outline-none" placeholder="email@sara.com" />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Senha</label>
                  <input value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 outline-none" placeholder="******" />
              </div>
              <button onClick={handleAddAdm} className="bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-500 transition-colors shadow-lg">Adicionar</button>
          </div>

          <div className="space-y-2">
              {admins.map(admin => (
                  <div key={admin.id} className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                      <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-xs">{admin.name.substring(0,2).toUpperCase()}</div>
                          <div>
                              <p className="font-bold text-white text-sm">{admin.name}</p>
                              <p className="text-xs text-zinc-500">{admin.email}</p>
                          </div>
                      </div>
                      <button onClick={() => { if(window.confirm('Remover admin?')) onRemoveAdmin(admin.id) }} className="text-zinc-600 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                  </div>
              ))}
          </div>
      </div>

    </div>
  );
};
