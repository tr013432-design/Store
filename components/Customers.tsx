import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
import { Plus, Search, Edit2, Trash2, User, Users, Phone, MapPin, Save, X, Filter } from 'lucide-react';

interface CustomersProps {
  customers: Customer[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export const Customers: React.FC<CustomersProps> = ({ customers, onSaveCustomer, onDeleteCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('Todos');
  const [churchFilter, setChurchFilter] = useState('Todos');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '', phone: '', team: '', church: '', points: 0
  });
  const [isEditing, setIsEditing] = useState(false);

  // --- EXTRAIR OPÇÕES DE FILTRO AUTOMATICAMENTE ---
  const uniqueTeams = useMemo(() => {
      const teams = customers.map(c => c.team).filter(Boolean) as string[];
      return ['Todos', ...Array.from(new Set(teams))];
  }, [customers]);

  const uniqueChurches = useMemo(() => {
      const churches = customers.map(c => c.church).filter(Boolean) as string[];
      return ['Todos', ...Array.from(new Set(churches))];
  }, [customers]);

  // --- LÓGICA DE FILTRAGEM ---
  const filtered = customers.filter(c => {
    const matchesSearch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phone.includes(searchTerm) ||
        (c.team && c.team.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTeam = teamFilter === 'Todos' || c.team === teamFilter;
    const matchesChurch = churchFilter === 'Todos' || c.church === churchFilter;

    return matchesSearch && matchesTeam && matchesChurch;
  });

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

    const cleanPhone = formData.phone.replace(/\D/g, '');

    const newCustomer: Customer = {
      ...formData as Customer,
      id: isEditing ? formData.id! : cleanPhone,
      phone: formData.phone,
      totalSpent: formData.totalSpent || 0,
      lastPurchase: formData.lastPurchase || new Date().toISOString(),
      history: formData.history || []
    };

    onSaveCustomer(newCustomer);
    setIsModalOpen(false);
  };

  const clearFilters = () => {
      setTeamFilter('Todos');
      setChurchFilter('Todos');
      setSearchTerm('');
  };

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

      {/* BARRA DE FERRAMENTAS (Busca + Filtros) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        {/* Busca */}
        <div className="flex-1 flex gap-2 w-full">
            <Search className="text-slate-400" />
            <input 
                placeholder="Buscar por nome ou telefone..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="flex-1 outline-none text-slate-700 font-medium bg-transparent" 
            />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 min-w-[140px]">
                <Users size={16} className="text-slate-400"/>
                <select 
                    value={teamFilter} 
                    onChange={e => setTeamFilter(e.target.value)} 
                    className="bg-transparent text-sm text-slate-600 outline-none w-full cursor-pointer"
                >
                    {uniqueTeams.map(t => <option key={t} value={t}>{t === 'Todos' ? 'Todas Equipes' : t}</option>)}
                </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 min-w-[140px]">
                <MapPin size={16} className="text-slate-400"/>
                <select 
                    value={churchFilter} 
                    onChange={e => setChurchFilter(e.target.value)} 
                    className="bg-transparent text-sm text-slate-600 outline-none w-full cursor-pointer"
                >
                    {uniqueChurches.map(c => <option key={c} value={c}>{c === 'Todos' ? 'Todas Igrejas' : c}</option>)}
                </select>
            </div>

            {(teamFilter !== 'Todos' || churchFilter !== 'Todos' || searchTerm !== '') && (
                <button onClick={clearFilters} className="p-2 text-slate-400 hover:text-red-500 transition-colors border border-slate-200 rounded-lg hover:bg-red-50">
                    <X size={18} />
                </button>
            )}
        </div>
      </div>

      {/* Lista */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
            <div className="col-span-full text-center py-10 text-slate-400 italic">
                Nenhum cliente encontrado com esses filtros.
            </div>
        ) : filtered.map(c => (
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
                    <div className="flex flex-wrap gap-2">
                        {c.team ? (
                            <span className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-medium border border-indigo-100">
                                <Users size={10}/> {c.team}
                            </span>
                        ) : <span className="text-slate-300">-</span>}
                        
                        {c.church && (
                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                <MapPin size={10}/> {c.church}
                            </span>
                        )}
                    </div>
                </div>

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
                                {/* Datalist para sugerir equipes já existentes */}
                                <input list="teams-list" value={formData.team} onChange={e => setFormData({...formData, team: e.target.value})} className="w-full outline-none text-slate-700" placeholder="Ex: Águias" />
                                <datalist id="teams-list">{uniqueTeams.filter(t => t !== 'Todos').map(t => <option key={t} value={t} />)}</datalist>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Igreja</label>
                            <div className="flex items-center gap-2 border-b border-slate-200 py-2">
                                <MapPin size={18} className="text-slate-400"/>
                                {/* Datalist para sugerir igrejas já existentes */}
                                <input list="churches-list" value={formData.church} onChange={e => setFormData({...formData, church: e.target.value})} className="w-full outline-none text-slate-700" placeholder="Ex: Freguesia" />
                                <datalist id="churches-list">{uniqueChurches.filter(c => c !== 'Todos').map(c => <option key={c} value={c} />)}</datalist>
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
