import React, { useState } from 'react';
import { Product, Category } from '../types';
import { Edit2, Save, X, Plus, Barcode, Trash2, DollarSign, TrendingUp } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ products, onUpdateProduct, onAddProduct, onDeleteProduct }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [isAdding, setIsAdding] = useState(false);
  
  // Adicionei costPrice na inicialização
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    costPrice: 0, // <--- NOVO CAMPO
    stock: 0,
    category: Category.FOOD,
    imageUrl: 'https://picsum.photos/200/200',
    barcode: ''
  });

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setEditForm(product);
  };

  const handleSave = () => {
    if (editingId && editForm) {
      onUpdateProduct(editForm as Product);
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto do estoque?')) {
        onDeleteProduct(id);
    }
  };

  const handleAdd = () => {
    if (newProduct.name && newProduct.price !== undefined) {
      onAddProduct({
        ...newProduct,
        costPrice: newProduct.costPrice || 0, // Garante que salva o custo
        id: Date.now().toString(),
      } as Product);
      setIsAdding(false);
      // Reseta o formulário
      setNewProduct({ name: '', price: 0, costPrice: 0, stock: 0, category: Category.FOOD, imageUrl: 'https://picsum.photos/200/200', barcode: '' });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="text-indigo-600" /> Gestão de Estoque
        </h2>
        <button 
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium shadow-md shadow-indigo-200 transition-all"
        >
            <Plus size={18} /> Novo Produto
        </button>
      </div>

      {isAdding && (
         <div className="bg-white p-6 rounded-2xl shadow-md border border-indigo-100 animate-fade-in mb-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Plus size={18} className="text-indigo-500"/> Adicionar Produto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                <div className="lg:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nome</label>
                    <input 
                        placeholder="Ex: Coca-Cola" 
                        value={newProduct.name}
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                
                <div className="lg:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Cód. Barras</label>
                    <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-indigo-500">
                        <Barcode size={16} className="text-slate-400 shrink-0"/>
                        <input 
                            placeholder="..." 
                            value={newProduct.barcode || ''}
                            onChange={e => setNewProduct({...newProduct, barcode: e.target.value})}
                            className="w-full text-sm outline-none bg-transparent"
                        />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Categoria</label>
                    <select
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value as Category})}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* PREÇO DE VENDA */}
                <div className="lg:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Venda (R$)</label>
                    <input 
                        type="number" step="0.01"
                        placeholder="0.00" 
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-600"
                    />
                </div>

                {/* PREÇO DE CUSTO (NOVO) */}
                <div className="lg:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase text-emerald-600">Custo (R$)</label>
                    <input 
                        type="number" step="0.01"
                        placeholder="0.00" 
                        value={newProduct.costPrice}
                        onChange={e => setNewProduct({...newProduct, costPrice: parseFloat(e.target.value)})}
                        className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-600 bg-emerald-50/30"
                    />
                </div>

                <div className="lg:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Estoque</label>
                    <input 
                        type="number"
                        placeholder="0" 
                        value={newProduct.stock}
                        onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
                <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium">Cancelar</button>
                <button onClick={handleAdd} className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium shadow-sm shadow-emerald-200">Salvar Produto</button>
            </div>
         </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Produto</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoria</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Venda</th>
                <th className="p-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider">Custo / Lucro</th> {/* NOVA COLUNA */}
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estoque</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {products.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                            Nenhum produto cadastrado. Clique em "Novo Produto" para começar.
                        </td>
                    </tr>
                ) : products.map(product => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    {editingId === product.id ? (
                        <>
                            <td className="p-4"><input className="w-full border rounded px-2 py-1 text-sm" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                            <td className="p-4">
                                <select className="w-full border rounded px-2 py-1 text-sm" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value as Category})}>
                                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </td>
                            <td className="p-4"><input type="number" step="0.01" className="w-20 border rounded px-2 py-1 text-sm font-bold text-indigo-600" value={editForm.price} onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value)})} /></td>
                            
                            {/* EDIÇÃO DE CUSTO */}
                            <td className="p-4">
                                <input type="number" step="0.01" className="w-20 border border-emerald-200 rounded px-2 py-1 text-sm text-emerald-600 bg-emerald-50/30" value={editForm.costPrice} onChange={e => setEditForm({...editForm, costPrice: parseFloat(e.target.value)})} placeholder="0.00" />
                            </td>

                            <td className="p-4"><input type="number" className="w-16 border rounded px-2 py-1 text-sm" value={editForm.stock} onChange={e => setEditForm({...editForm, stock: parseInt(e.target.value)})} /></td>
                            <td className="p-4 flex justify-end gap-2">
                                <button onClick={handleSave} className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200"><Save size={16} /></button>
                                <button onClick={() => setEditingId(null)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"><X size={16} /></button>
                            </td>
                        </>
                    ) : (
                        <>
                            <td className="p-4 flex items-center gap-3">
                                <div>
                                    <span className="font-medium text-slate-800 text-sm block">{product.name}</span>
                                    {product.barcode && <span className="text-[10px] text-slate-400 font-mono block">{product.barcode}</span>}
                                </div>
                            </td>
                            <td className="p-4 text-sm text-slate-600">{product.category}</td>
                            <td className="p-4 text-sm font-bold text-indigo-600">R$ {product.price.toFixed(2)}</td>
                            
                            {/* VISUALIZAÇÃO DE LUCRO UNITÁRIO */}
                            <td className="p-4">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500">R$ {(product.costPrice || 0).toFixed(2)}</span>
                                    {(product.costPrice || 0) > 0 && (
                                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                            <TrendingUp size={10} /> +R$ {(product.price - (product.costPrice || 0)).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </td>

                            <td className="p-4">
                                <span className={`text-xs px-2 py-1 rounded font-medium ${product.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {product.stock} un
                                </span>
                            </td>
                            <td className="p-4 text-right flex justify-end items-center gap-2">
                                <button onClick={() => handleEditClick(product)} className="text-slate-400 hover:text-indigo-600 transition-colors p-1" title="Editar">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(product.id)} className="text-slate-400 hover:text-red-600 transition-colors p-1" title="Excluir">
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </>
                    )}
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
