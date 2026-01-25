import React, { useState } from 'react';
import { Customer } from '../types';
import { Plus, Search, Edit2, Trash2, User, Users, Phone, MapPin, Save, X } from 'lucide-react';

interface CustomersProps {
  customers: Customer[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export const Customers: React.FC<CustomersProps> = ({ customers, onSaveCustomer, onDeleteCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado do Formulário
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '', phone: '', team: '', church: '', points: 0
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setFormData(customer);
      setIsEditing(true);
    } else {
      setFormData({ name: '', phone: '', team: '', church: '', points: 0, totalSpent: 0, history: [] });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) { alert("Nome e Telefone são obrigatórios!"); return; }

    const cleanPhone = formData.phone.replace(/\D/g, ''); // Usa apenas números para o ID

    const newCustomer: Customer = {
      ...formData as Customer,
      id: isEditing ? formData.id! : cleanPhone, // Se editando mantém ID, se novo usa telefone
      phone: formData.phone,
      totalSpent: formData.totalSpent || 0,
      lastPurchase: formData.lastPurchase || new Date().toISOString(),
      history: formData.history || []
    };

    onSaveCustomer(newCustomer);
    setIsModalOpen(false);
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm) ||
    c.team?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="text-indigo-600" /> Gestão de Clientes
            </h2>
            <p className="text-slate-500 text-sm">Cadastre membros, equipes e igrejas.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            <Plus size={20}/> Novo Cliente
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-2">
        <Search className="text-slate-400" />
        <input placeholder="Buscar por nome, telefone ou equipe..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 outline-none text-slate-700 font-medium bg-transparent" />
      </div>

      {/* Lista */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
            <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {c.name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{c.name}</h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1"><Phone size={10}/> {c.phone}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full">{c.points} pts</span>
                    </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center text-xs text-slate-500">
                    <div className="flex gap-3">
                        {c.team && <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded"><Users size={12}/> {c.team}</span>}
                        {c.church && <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded"><MapPin size={12}/> {c.church}</span>}
                    </div>
                </div>

                {/* Ações (Aparecem no Hover) */}
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2">
                    <button onClick={() => handleOpenModal(c)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded"><Edit2 size={16}/></button>
                    <button onClick={() => {if(window.confirm('Excluir cliente?')) onDeleteCustomer(c.id)}} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                </div>
            </div>
        ))}
      </div>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                    <button type="button" onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                        <div className="flex items-center gap-2 border-b border-slate-200 py-2">
                            <User size={18} className="text-slate-400"/>
                            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full outline-none text-slate-700" placeholder="Ex: João Silva" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Telefone (WhatsApp)</label>
                        <div className="flex items-center gap-2 border-b border-slate-200 py-2">
                            <Phone size={18} className="text-slate-400"/>
                            <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full outline-none text-slate-700" placeholder="Ex: 21 99999-9999" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Equipe</label>
                            <div className="flex items-center gap-2 border-b border-slate-200 py-2">
                                <Users size={18} className="text-slate-400"/>
                                <input value={formData.team} onChange={e => setFormData({...formData, team: e.target.value})} className="w-full outline-none text-slate-700" placeholder="Ex: Águias" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Igreja</label>
                            <div className="flex items-center gap-2 border-b border-slate-200 py-2">
                                <MapPin size={18} className="text-slate-400"/>
                                <input value={formData.church} onChange={e => setFormData({...formData, church: e.target.value})} className="w-full outline-none text-slate-700" placeholder="Ex: Freguesia" />
                            </div>
                        </div>
                    </div>
                </div>

                <button type="submit" className="w-full mt-8 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 flex justify-center items-center gap-2 shadow-lg shadow-indigo-200">
                    <Save size={20} /> Salvar Cadastro
                </button>
            </form>
        </div>
      )}
    </div>
  );
};
