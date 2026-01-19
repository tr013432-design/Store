import React, { useState } from 'react';
import { Plus, Trash2, Settings as SettingsIcon, User, Church } from 'lucide-react';

interface SettingsProps {
  volunteers: string[];
  services: string[];
  onAddVolunteer: (name: string) => void;
  onRemoveVolunteer: (name: string) => void;
  onAddService: (service: string) => void;
  onRemoveService: (service: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  volunteers, services, onAddVolunteer, onRemoveVolunteer, onAddService, onRemoveService 
}) => {
  const [newVol, setNewVol] = useState('');
  const [newService, setNewService] = useState('');

  const handleAddVol = () => {
    if (newVol.trim()) {
      onAddVolunteer(newVol.trim());
      setNewVol('');
    }
  };

  const handleAddServ = () => {
    if (newService.trim()) {
      onAddService(newService.trim());
      setNewService('');
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
            <SettingsIcon size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
            <p className="text-sm text-slate-500">Gerencie as listas padrões do sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* GERENCIAR VOLUNTÁRIOS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <User size={20} className="text-indigo-600"/> Voluntários Cadastrados
            </h3>
            
            <div className="flex gap-2 mb-6">
                <input 
                    value={newVol}
                    onChange={e => setNewVol(e.target.value)}
                    placeholder="Nome do Voluntário..."
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    onKeyDown={e => e.key === 'Enter' && handleAddVol()}
                />
                <button onClick={handleAddVol} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700">
                    <Plus size={20} />
                </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {volunteers.map(vol => (
                    <div key={vol} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                        <span className="text-sm font-medium text-slate-700">{vol}</span>
                        <button onClick={() => onRemoveVolunteer(vol)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                {volunteers.length === 0 && <p className="text-sm text-slate-400 italic text-center">Nenhum voluntário cadastrado.</p>}
            </div>
        </div>

        {/* GERENCIAR CULTOS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Church size={20} className="text-indigo-600"/> Cultos e Eventos
            </h3>
            
            <div className="flex gap-2 mb-6">
                <input 
                    value={newService}
                    onChange={e => setNewService(e.target.value)}
                    placeholder="Nome do Culto..."
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    onKeyDown={e => e.key === 'Enter' && handleAddServ()}
                />
                <button onClick={handleAddServ} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700">
                    <Plus size={20} />
                </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {services.map(serv => (
                    <div key={serv} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                        <span className="text-sm font-medium text-slate-700">{serv}</span>
                        <button onClick={() => onRemoveService(serv)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                 {services.length === 0 && <p className="text-sm text-slate-400 italic text-center">Nenhum culto cadastrado.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};
