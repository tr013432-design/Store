import React, { useState } from 'react';
import { Expense, ExpenseType } from '../types';
import { TrendingDown, Save, Trash2 } from 'lucide-react';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  currentUser: string;
}

export const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense, onDeleteExpense, currentUser }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<ExpenseType>('DESPESA');

  const handleSave = () => {
    if (!description || !amount) { alert("Preencha descrição e valor!"); return; }
    
    const newExpense: Expense = {
        id: Date.now().toString(),
        description,
        amount: parseFloat(amount),
        type,
        date: new Date().toISOString(),
        user: currentUser
    };

    onAddExpense(newExpense);
    setDescription('');
    setAmount('');
    alert(`${type === 'DESPESA' ? 'Despesa' : 'Sangria'} lançada com sucesso!`);
  };

  const today = new Date().toISOString().split('T')[0];
  // Despesas Operacionais (Diminuem o Lucro): Sacolas, Limpeza, etc.
  const dailyExpenses = expenses.filter(e => e.date.startsWith(today) && e.type === 'DESPESA').reduce((acc, e) => acc + e.amount, 0);
  // Sangrias (Apenas retirada de dinheiro para cofre/banco, não afeta lucro contábil)
  const dailyWithdrawals = expenses.filter(e => e.date.startsWith(today) && e.type === 'SANGRIA').reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <TrendingDown className="text-red-600"/> Saídas de Caixa
      </h2>

      <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
              <p className="text-xs font-bold text-red-400 uppercase">Despesas Hoje</p>
              <p className="text-2xl font-black text-red-600">R$ {dailyExpenses.toFixed(2)}</p>
              <p className="text-[10px] text-red-300">Embalagens, Limpeza, etc.</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
              <p className="text-xs font-bold text-orange-400 uppercase">Sangrias Hoje</p>
              <p className="text-2xl font-black text-orange-600">R$ {dailyWithdrawals.toFixed(2)}</p>
              <p className="text-[10px] text-orange-300">Enviado à Tesouraria</p>
          </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">Lançar Saída</h3>
          
          <div className="flex gap-2 mb-4">
              <button onClick={() => setType('DESPESA')} className={`flex-1 py-2 rounded-lg font-bold text-xs border ${type === 'DESPESA' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-400 border-slate-200'}`}>DESPESA (Gasto)</button>
              <button onClick={() => setType('SANGRIA')} className={`flex-1 py-2 rounded-lg font-bold text-xs border ${type === 'SANGRIA' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-400 border-slate-200'}`}>SANGRIA (Retirada)</button>
          </div>

          <div className="space-y-3">
              <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Descrição</label>
                  <input value={description} onChange={e => setDescription(e.target.value)} placeholder={type === 'DESPESA' ? "Ex: 100 Sacolas Personalizadas" : "Ex: Retirada p/ Depósito Bancário"} className="w-full border-b border-slate-200 py-2 text-sm outline-none font-medium text-slate-700" />
              </div>
              <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Valor (R$)</label>
                  <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full border-b border-slate-200 py-2 text-lg font-black text-slate-800 outline-none" />
              </div>
          </div>

          <button onClick={handleSave} className={`w-full mt-6 py-3 rounded-xl font-bold text-white flex justify-center items-center gap-2 shadow-lg transition-all ${type === 'DESPESA' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'}`}>
              <Save size={18} /> Confirmar Lançamento
          </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-slate-600 text-sm">Histórico Recente</h3></div>
          <div className="divide-y divide-slate-50">
              {expenses.slice(0, 10).map(exp => (
                  <div key={exp.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                      <div>
                          <p className="font-bold text-slate-700 text-sm">{exp.description}</p>
                          <div className="flex items-center gap-2 text-[10px]">
                              <span className={`px-1.5 py-0.5 rounded ${exp.type === 'DESPESA' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{exp.type}</span>
                              <span className="text-slate-400">{new Date(exp.date).toLocaleDateString()} • {exp.user}</span>
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800">- R$ {exp.amount.toFixed(2)}</span>
                          <button onClick={() => { if(window.confirm("Apagar registro?")) onDeleteExpense(exp.id) }} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                  </div>
              ))}
              {expenses.length === 0 && <p className="p-6 text-center text-slate-400 text-sm italic">Nenhuma saída registrada.</p>}
          </div>
      </div>
    </div>
  );
};
