import React, { useState } from 'react';
import { Product, Category } from '../types';
import { generateBarcodePDF } from '../utils/labelGenerator';
import { Plus, Search, Edit2, Trash2, Package, Tag, Printer, Barcode, X, Save } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ✅ Sanitizadores (evitam NaN e números negativos)
  const sanitizeMoney = (value: string) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const sanitizeStock = (value: string) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.trunc(n)); // ✅ inteiro e nunca negativo
  };

  // Estado do formulário
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', barcode: '', price: 0, costPrice: 0, stock: 0, category: Category.OTHER
  });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.includes(searchTerm)
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setFormData(product);
      setEditingId(product.id);
    } else {
      setFormData({ name: '', barcode: '', price: 0, costPrice: 0, stock: 0, category: Category.OTHER });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    const name = (formData.name ?? '').trim();
    const price = Number(formData.price ?? 0);

    if (!name || !Number.isFinite(price) || price <= 0) {
      alert("Preencha nome e preço (maior que 0)!");
      return;
    }

    const productData: Product = {
      id: editingId || Date.now().toString(),
      name,
      barcode: (formData.barcode && formData.barcode.trim()) || Date.now().toString().slice(-6),
      price: price,
      costPrice: Number.isFinite(Number(formData.costPrice)) ? Number(formData.costPrice) : 0,
      stock: Math.max(0, Math.trunc(Number(formData.stock ?? 0))), // ✅ trava final
      category: formData.category || Category.OTHER
    };

    if (editingId) {
      onUpdateProduct(productData);
    } else {
      onAddProduct(productData);
    }
    setIsModalOpen(false);
  };

  const handlePrintLabels = () => {
    if (filteredProducts.length === 0) { alert("Nenhum produto listado para imprimir."); return; }
    const confirm = window.confirm(`Deseja gerar um PDF com etiquetas para ${filteredProducts.length} produtos listados?`);
    if (confirm) { generateBarcodePDF(filteredProducts); }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in relative z-10">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-zinc-900/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
            <Package className="text-green-500" /> Gestão de Estoque
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Cadastre produtos, preços e controle suas quantidades.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrintLabels} className="bg-zinc-800 border border-white/10 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-zinc-700 transition-all shadow-lg hover:shadow-zinc-900/20">
            <Printer size={18} className="text-zinc-400" /> Etiquetas
          </button>
          <button onClick={() => handleOpenModal()} className="bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-green-500 transition-all shadow-lg shadow-green-900/20">
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-zinc-900/80 backdrop-blur-xl p-4 rounded-2xl border border-white/10 flex gap-3 group focus-within:border-green-500/50 transition-colors">
        <Search className="text-zinc-500 group-focus-within:text-green-500 transition-colors" />
        <input
          placeholder="Buscar produto por nome ou código..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 outline-none text-white font-medium bg-transparent placeholder-zinc-600"
        />
      </div>

      {/* Lista de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(p => (
          <div key={p.id} className="bg-zinc-900/80 backdrop-blur-md p-5 rounded-2xl border border-white/5 hover:border-green-500/30 shadow-lg hover:shadow-green-900/10 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${p.stock < 5 ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-400'}`}>
                  <Tag size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg leading-tight">{p.name}</h3>
                  <p className="text-xs text-zinc-500 font-mono mt-1 flex items-center gap-1"><Barcode size={10} /> {p.barcode || 'S/N'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end mt-4 pt-4 border-t border-white/5 relative z-10">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Preço</p>
                <p className="font-black text-green-400 text-xl">R$ {p.price.toFixed(2)}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">Custo: R$ {p.costPrice?.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded mb-2 inline-block">{p.category}</span>
                <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${p.stock > 0 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                  {p.stock} un
                </div>
              </div>
            </div>

            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2 z-20">
              <button onClick={() => handleOpenModal(p)} className="p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors"><Edit2 size={16} /></button>
              <button onClick={() => { if (window.confirm('Excluir?')) onDeleteProduct(p.id); }} className="p-2 text-zinc-400 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden">
            {/* Header do Modal */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {editingId ? <Edit2 size={20} className="text-green-500" /> : <Plus size={20} className="text-green-500" />}
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Nome do Produto</label>
                  <input
                    value={formData.name ?? ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 transition-all placeholder-zinc-700"
                    placeholder="Ex: Camisa Leão de Judá"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Código de Barras</label>
                  <div className="relative">
                    <Barcode className="absolute left-4 top-3.5 text-zinc-600" size={16} />
                    <input
                      value={formData.barcode ?? ''}
                      onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white font-mono outline-none focus:border-green-500 transition-all placeholder-zinc-700"
                      placeholder="Gerar auto..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Categoria</label>
                  <select
                    value={formData.category ?? Category.OTHER}
                    onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 transition-all appearance-none cursor-pointer"
                  >
                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-green-500 uppercase tracking-wider ml-1">Preço Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={formData.price ?? 0}
                    onChange={e => setFormData({ ...formData, price: sanitizeMoney(e.target.value) })}
                    className="w-full bg-black border border-green-900/30 rounded-xl px-4 py-3 text-green-400 font-bold outline-none focus:border-green-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-red-400 uppercase tracking-wider ml-1">Preço Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={formData.costPrice ?? 0}
                    onChange={e => setFormData({ ...formData, costPrice: sanitizeMoney(e.target.value) })}
                    className="w-full bg-black border border-red-900/30 rounded-xl px-4 py-3 text-red-400 outline-none focus:border-red-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Estoque Atual</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={formData.stock ?? 0}
                    onChange={e => setFormData({ ...formData, stock: sanitizeStock(e.target.value) })}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 text-zinc-400 font-bold hover:text-white hover:bg-white/5 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleSubmit} className="flex-1 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2">
                  <Save size={18} /> Salvar Produto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
