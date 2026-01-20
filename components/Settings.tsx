import React, { useState } from 'react';
import { Plus, Trash2, Settings as SettingsIcon, User, Church, Shield, Key, Mail } from 'lucide-react';
import { AdminUser } from '../types';

interface SettingsProps {
  volunteers: string[];
  services: string[];
  admins: AdminUser[]; // Recebe a lista de admins
  onAddVolunteer: (name: string) => void;
  onRemoveVolunteer: (name: string) => void;
  onAddService: (service: string) => void;
  onRemoveService: (service: string) => void;
  onAddAdmin: (admin: Omit<AdminUser, 'id'>) => void; // Função para criar admin
  onRemoveAdmin: (id: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  volunteers, services, admins, 
  onAddVolunteer, onRemoveVolunteer, 
  onAddService, onRemoveService,
  onAddAdmin, onRemoveAdmin
}) => {
  // Estados locais
  const [newVol, setNewVol] = useState('');
  const [newService, setNewService] = useState('');
  
  // Estado para novo Admin
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const handleAddVol = () => { if (newVol.trim()) { onAddVolunteer(newVol.trim()); setNewVol(''); } };
  const handleAddServ = () => { if (newService.trim()) { onAddService(newService.trim()); setNewService(''); } };

  const handleAddAdmin = () => {
    if (adminName && adminEmail && adminPass) {
        onAddAdmin({ name: adminName, email: adminEmail, password: adminPass });
        setAdminName('');
        setAdminEmail('');
        setAdminPass('');
        alert('Funcionário cadastrado com sucesso!');
    } else {
        alert('Preencha todos os campos para cadastrar um funcionário.');
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><SettingsIcon size={24} /></div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
            <p className="text-sm text-slate-500">Gerencie voluntários, cultos e acessos administrativos</p>
        </div>
      </div>

      {/* --- SEÇÃO DE ADMINISTRAÇÃO (NOVA) --- */}
      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl shadow-sm">
        <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
            <Shield size={20} className="text-indigo-600"/> Gestão de Funcionários (Acesso ADM)
        </h3>
        <p className="text-xs text-indigo-700 mb-4">Estes usuários poderão validar relatórios financeiros e acessar o painel restrito.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-indigo-200">
                <User size={16} className="text-indigo-400"/>
                <input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Nome" className="w-full text-sm outline-none"/>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-indigo-200">
                <Mail size={16} className="text-indigo-400"/>
                <input value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="Email" className="w-full text-sm outline-none"/>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-indigo-200">
                <Key size={16} className="text-indigo-400"/>
                <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="Senha" className="w-full text-sm outline-none"/>
            </div>
            <button onClick={handleAddAdmin} className="bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                Cadastrar
            </button>
        </div>

        <div className="space-y-2 mt-4">
            {admins.map(admin => (
                <div key={admin.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-indigo-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                            {admin.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">{admin.name}</p>
                            <p className="text-xs text-slate-400">{admin.email}</p>
                        </div>
                    </div>
                    <button onClick={() => onRemoveAdmin(admin.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                </div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* VOLUNTÁRIOS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><User size={20} className="text-indigo-600"/> Lista de Voluntários</h3>
            <div className="flex gap-2 mb-6">
                <input value={newVol} onChange={e => setNewVol(e.target.value)} placeholder="Nome..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
                <button onClick={handleAddVol} className="bg-indigo-600 text-white p-2 rounded-lg"><Plus size={20} /></button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {volunteers.map(vol => (
                    <div key={vol} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                        <span className="text-sm font-medium text-slate-700">{vol}</span>
                        <button onClick={() => onRemoveVolunteer(vol)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
        </div>

        {/* CULTOS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Church size={20} className="text-indigo-600"/> Lista de Cultos</h3>
            <div className="flex gap-2 mb-6">
                <input value={newService} onChange={e => setNewService(e.target.value)} placeholder="Nome do Culto..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
                <button onClick={handleAddServ} className="bg-indigo-600 text-white p-2 rounded-lg"><Plus size={20} /></button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {services.map(serv => (
                    <div key={serv} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                        <span className="text-sm font-medium text-slate-700">{serv}</span>
                        <button onClick={() => onRemoveService(serv)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
