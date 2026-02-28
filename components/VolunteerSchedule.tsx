import React, { useMemo, useState } from 'react';
import { VolunteerSchedule as VolunteerScheduleItem } from '../types';
import { CalendarDays, Plus, Trash2, Users, ClipboardList } from 'lucide-react';

interface VolunteerScheduleProps {
  schedules: VolunteerScheduleItem[];
  availableVolunteers: string[];
  availableServices: string[];
  onAddSchedule: (payload: Omit<VolunteerScheduleItem, 'id'>) => void;
  onDeleteSchedule: (id: string) => void;
}

export const VolunteerSchedule: React.FC<VolunteerScheduleProps> = ({
  schedules,
  availableVolunteers,
  availableServices,
  onAddSchedule,
  onDeleteSchedule
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceType, setServiceType] = useState('');
  const [volunteerName, setVolunteerName] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');

  const filteredSchedules = useMemo(() => {
    return schedules
      .filter((item) => {
        const sameDate = item.date === date;
        const sameService = serviceType ? item.serviceType === serviceType : true;
        return sameDate && sameService;
      })
      .sort((a, b) => a.volunteerName.localeCompare(b.volunteerName));
  }, [schedules, date, serviceType]);

  const handleAdd = () => {
    if (!date || !serviceType.trim() || !volunteerName.trim()) {
      alert('Preencha data, culto e voluntário.');
      return;
    }

    onAddSchedule({
      date,
      serviceType: serviceType.trim(),
      volunteerName: volunteerName.trim(),
      role: role.trim(),
      notes: notes.trim()
    });

    setVolunteerName('');
    setRole('');
    setNotes('');
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in relative z-10">
      <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
          <CalendarDays className="text-green-500" />
          Escala de Voluntários
        </h2>
        <p className="text-zinc-400 text-sm mt-1">
          Organize quem vai servir em cada dia e culto.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Plus className="text-green-500" />
            Nova escala
          </h3>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Culto / Evento</label>
            <input
              list="schedule_services"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="Ex: Culto da Família"
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500"
            />
            <datalist id="schedule_services">
              {availableServices.map((service) => (
                <option key={service} value={service} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Voluntário</label>
            <input
              list="schedule_volunteers"
              value={volunteerName}
              onChange={(e) => setVolunteerName(e.target.value)}
              placeholder="Nome do voluntário"
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500"
            />
            <datalist id="schedule_volunteers">
              {availableVolunteers.map((volunteer) => (
                <option key={volunteer} value={volunteer} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Função</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Ex: Caixa, Estoque, Apoio..."
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Observação</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
              rows={4}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 resize-none"
            />
          </div>

          <button
            onClick={handleAdd}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-500 transition-colors shadow-lg"
          >
            Salvar na escala
          </button>
        </div>

        <div className="lg:col-span-2 bg-zinc-900/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ClipboardList className="text-blue-500" />
                Escala do dia
              </h3>
              <p className="text-zinc-500 text-sm">
                {date} {serviceType ? `• ${serviceType}` : '• Todos os cultos'}
              </p>
            </div>

            <div className="text-xs px-3 py-2 rounded-full bg-black border border-zinc-800 text-zinc-400">
              {filteredSchedules.length} voluntário(s)
            </div>
          </div>

          <div className="space-y-3">
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                Nenhum voluntário escalado para esse filtro.
              </div>
            ) : (
              filteredSchedules.map((item) => (
                <div
                  key={item.id}
                  className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <Users size={18} />
                    </div>

                    <div>
                      <p className="font-bold text-white text-sm">{item.volunteerName}</p>
                      <p className="text-xs text-zinc-500">
                        {item.serviceType} • {item.date}
                      </p>
                      {item.role ? (
                        <p className="text-xs text-green-400 mt-1">Função: {item.role}</p>
                      ) : null}
                      {item.notes ? (
                        <p className="text-xs text-zinc-400 mt-1">{item.notes}</p>
                      ) : null}
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteSchedule(item.id)}
                    className="self-start md:self-center text-zinc-500 hover:text-red-500 p-2 transition-colors"
                    title="Remover da escala"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerSchedule;
