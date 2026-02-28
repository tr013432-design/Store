import React, { useMemo, useState } from 'react';
import { VolunteerSchedule as VolunteerScheduleItem } from '../types';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Users
} from 'lucide-react';

interface VolunteerScheduleProps {
  schedules: VolunteerScheduleItem[];
  availableVolunteers: string[];
  availableServices: string[];
  onAddSchedule: (payload: Omit<VolunteerScheduleItem, 'id'>) => void;
  onDeleteSchedule: (id: string) => void;
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const pad = (value: number) => String(value).padStart(2, '0');

const formatLocalDate = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const monthLabel = (date: Date) =>
  date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export const VolunteerSchedule: React.FC<VolunteerScheduleProps> = ({
  schedules,
  availableVolunteers,
  availableServices,
  onAddSchedule,
  onDeleteSchedule
}) => {
  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const safeVolunteers = Array.isArray(availableVolunteers) ? availableVolunteers : [];
  const safeServices = Array.isArray(availableServices) ? availableServices : [];

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(formatLocalDate(today));
  const [serviceType, setServiceType] = useState('');
  const [volunteerName, setVolunteerName] = useState('');

  const schedulesByDate = useMemo(() => {
    const grouped: Record<string, VolunteerScheduleItem[]> = {};

    for (const item of safeSchedules) {
      const key = item.date;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => {
        const byService = String(a.serviceType ?? '').localeCompare(String(b.serviceType ?? ''));
        if (byService !== 0) return byService;
        return String(a.volunteerName ?? '').localeCompare(String(b.volunteerName ?? ''));
      });
    });

    return grouped;
  }, [safeSchedules]);

  const selectedDaySchedules = useMemo(() => {
    return schedulesByDate[selectedDate] ?? [];
  }, [schedulesByDate, selectedDate]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const firstWeekDay = firstDay.getDay();

    const cells: Array<{ date: Date | null; iso: string | null }> = [];

    for (let i = 0; i < firstWeekDay; i++) {
      cells.push({ date: null, iso: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      cells.push({ date, iso: formatLocalDate(date) });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ date: null, iso: null });
    }

    return cells;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(formatLocalDate(now));
  };

  const handleAdd = () => {
    if (!selectedDate || !serviceType.trim() || !volunteerName.trim()) {
      alert('Preencha dia, culto e voluntário.');
      return;
    }

    onAddSchedule({
      date: selectedDate,
      serviceType: serviceType.trim(),
      volunteerName: volunteerName.trim(),
      notes: ''
    });

    setVolunteerName('');
  };

  const isToday = (iso: string | null) => iso === formatLocalDate(new Date());
  const isSelected = (iso: string | null) => iso === selectedDate;

  return (
    <div className="space-y-6 pb-20 animate-fade-in relative z-10">
      <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
          <CalendarDays className="text-green-500" />
          Escala de Voluntários
        </h2>
        <p className="text-zinc-400 text-sm mt-1">
          Monte a escala por calendário, dia e culto.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-zinc-900/80 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-bold">
                Calendário
              </p>
              <h3 className="text-2xl font-black text-white capitalize">
                {monthLabel(currentMonth)}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGoToToday}
                className="px-4 py-2 rounded-xl bg-black border border-zinc-800 text-zinc-300 hover:border-green-500 hover:text-green-400 transition-colors text-sm font-bold"
              >
                Hoje
              </button>
              <button
                onClick={handlePrevMonth}
                className="p-3 rounded-xl bg-black border border-zinc-800 text-zinc-300 hover:border-green-500 hover:text-green-400 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-3 rounded-xl bg-black border border-zinc-800 text-zinc-300 hover:border-green-500 hover:text-green-400 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-[11px] uppercase tracking-widest font-bold text-zinc-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((cell, index) => {
              if (!cell.date || !cell.iso) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-[120px] rounded-2xl border border-transparent"
                  />
                );
              }

              const daySchedules = schedulesByDate[cell.iso] ?? [];
              const selected = isSelected(cell.iso);
              const todayCell = isToday(cell.iso);

              return (
                <button
                  key={cell.iso}
                  onClick={() => setSelectedDate(cell.iso!)}
                  className={`min-h-[120px] rounded-2xl border p-3 text-left transition-all flex flex-col gap-2 ${
                    selected
                      ? 'border-green-500 bg-green-500/10 shadow-[0_0_0_1px_rgba(34,197,94,0.25)]'
                      : 'border-zinc-800 bg-black/40 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-black ${
                        todayCell ? 'text-green-400' : 'text-white'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    {daySchedules.length > 0 && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-300 font-bold">
                        {daySchedules.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {daySchedules.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg bg-zinc-900/90 border border-white/5 px-2 py-1"
                      >
                        <p className="text-[10px] text-green-400 font-bold truncate">
                          {item.serviceType}
                        </p>
                        <p className="text-[11px] text-white truncate">
                          {item.volunteerName}
                        </p>
                      </div>
                    ))}

                    {daySchedules.length > 3 && (
                      <p className="text-[10px] text-zinc-500 font-bold">
                        +{daySchedules.length - 3} mais
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 space-y-5">
          <div className="border-b border-white/5 pb-4">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-bold">
              Dia selecionado
            </p>
            <h3 className="text-xl font-black text-white mt-1">
              {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">
                Culto / Evento
              </label>
              <input
                list="schedule_services"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="Ex: Culto da Família"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500"
              />
              <datalist id="schedule_services">
                {safeServices.map((service) => (
                  <option key={service} value={service} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">
                Voluntário
              </label>
              <input
                list="schedule_volunteers"
                value={volunteerName}
                onChange={(e) => setVolunteerName(e.target.value)}
                placeholder="Nome do voluntário"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500"
              />
              <datalist id="schedule_volunteers">
                {safeVolunteers.map((volunteer) => (
                  <option key={volunteer} value={volunteer} />
                ))}
              </datalist>
            </div>

            <button
              onClick={handleAdd}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-500 transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Adicionar à escala
            </button>
          </div>

          <div className="border-t border-white/5 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-bold flex items-center gap-2">
                <Users className="text-blue-500" size={18} />
                Escalados no dia
              </h4>
              <span className="text-xs px-3 py-1 rounded-full bg-black border border-zinc-800 text-zinc-400">
                {selectedDaySchedules.length}
              </span>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
              {selectedDaySchedules.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                  Nenhuma pessoa escalada neste dia.
                </div>
              ) : (
                selectedDaySchedules.map((item) => (
                  <div
                    key={item.id}
                    className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-black text-white">
                        {item.volunteerName}
                      </p>
                      <p className="text-xs text-green-400 font-bold mt-1">
                        {item.serviceType}
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteSchedule(item.id)}
                      className="text-zinc-500 hover:text-red-500 p-2 transition-colors"
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
    </div>
  );
};

export default VolunteerSchedule;
