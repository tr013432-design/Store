import React, { useState } from 'react';
import { Product, Category } from '../types';
import { Edit2, Save, X, Plus } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ products, onUpdateProduct, onAddProduct }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    stock: 0,
    category: Category.FOOD,
    imageUrl: 'https://picsum.photos/200/200'
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

  const handleAdd = () => {
    if (newProduct.name && newProduct.price !== undefined) {
      onAddProduct({
        ...newProduct,
        id: Date.now().toString(),
      } as Product);
      setIsAdding(false);
      setNewProduct({ name: '', price: 0, stock: 0, category: Category.FOOD, imageUrl: 'https://picsum.photos/200/200' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Gestão de Estoque</h2>
        <button 
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium shadow-md shadow-indigo-200 transition-all"
        >
            <Plus size={18} /> Novo Produto
        </button>
      </div>

      {isAdding && (
         <div className="bg-white p-6 rounded-2xl shadow-md border border-indigo-100 animate-fade-in mb-6">
            <h3 className="font-semibold text-slate-800 mb-4">Adicionar Produto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <input 
                    placeholder="Nome" 
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <select
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value as Category})}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input 
                    type="number"
                    placeholder="Preço" 
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input 
                    type="number"
                    placeholder="Estoque" 
                    value={newProduct.stock}
                    onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <div className="flex gap-2">
                    <button onClick={handleAdd} className="flex-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">Salvar</button>
                    <button onClick={() => setIsAdding(false)} className="px-3 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"><X size={18} /></button>
                </div>
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
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Preço</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estoque</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {products.map(product => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    {editingId === product.id ? (
                        <>
                            <td className="p-4"><input className="w-full border rounded px-2 py-1 text-sm" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                            <td className="p-4">
                                <select className="w-full border rounded px-2 py-1 text-sm" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value as Category})}>
                                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </td>
                            <td className="p-4"><input type="number" className="w-full border rounded px-2 py-1 text-sm" value={editForm.price} onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value)})} /></td>
                            <td className="p-4"><input type="number" className="w-full border rounded px-2 py-1 text-sm" value={editForm.stock} onChange={e => setEditForm({...editForm, stock: parseInt(e.target.value)})} /></td>
                            <td className="p-4 flex justify-end gap-2">
                                <button onClick={handleSave} className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200"><Save size={16} /></button>
                                <button onClick={() => setEditingId(null)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"><X size={16} /></button>
                            </td>
                        </>
                    ) : (
                        <>
                            <td className="p-4 flex items-center gap-3">
                                <img src={product.imageUrl} alt="" className="w-8 h-8 rounded object-cover bg-slate-200" />
                                <span className="font-medium text-slate-800 text-sm">{product.name}</span>
                            </td>
                            <td className="p-4 text-sm text-slate-600">{product.category}</td>
                            <td className="p-4 text-sm font-medium text-slate-800">R$ {product.price.toFixed(2)}</td>
                            <td className="p-4">
                                <span className={`text-xs px-2 py-1 rounded font-medium ${product.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {product.stock} un
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <button onClick={() => handleEditClick(product)} className="text-slate-400 hover:text-indigo-600 transition-colors p-1">
                                    <Edit2 size={16} />
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