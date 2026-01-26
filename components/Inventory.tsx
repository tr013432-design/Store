import React, { useState } from 'react';
import { Product, Category } from '../types';
import { generateBarcodePDF } from '../utils/labelGenerator'; // <--- Importe a função nova
import { Plus, Search, Edit2, Trash2, Package, Tag, Printer, Barcode } from 'lucide-react';

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
  
  // Estado do formulário
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', barcode: '', price: 0, costPrice: 0, stock: 0, category: Category.OTHER
  });

  // Filtra produtos
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
    if (!formData.name || !formData.price) { alert("Preencha nome e preço!"); return; }
    
    const productData = {
        id: editingId || Date.now().toString(),
        name: formData.name!,
        barcode: formData.barcode || Date.now().toString().slice(-6), // Gera código se vazio
        price: Number(formData.price),
        costPrice: Number(formData.costPrice || 0),
        stock: Number(formData.stock || 0),
        category: formData.category || Category.OTHER
    } as Product;

    if (editingId) {
        onUpdateProduct(productData);
    } else {
        onAddProduct(productData);
    }
    setIsModalOpen(false);
  };

  // --- AÇÃO DE IMPRIMIR ---
  const handlePrintLabels = () => {
      if (filteredProducts.length === 0) { alert("Nenhum produto listado para imprimir."); return; }
      
      const confirm = window.confirm(`Deseja gerar um PDF com etiquetas para ${filteredProducts.length} produtos listados?`);
      if (confirm) {
          generateBarcodePDF(filteredProducts);
      }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="text-indigo-600" /> Gestão de Estoque
            </h2>
            <p className="text-slate-500 text-sm">Cadastre produtos e preços.</p>
        </div>
        <div className="flex gap-2">
            {/* BOTÃO DE IMPRIMIR ETIQUETAS */}
            <button onClick={handlePrintLabels} className="bg-zinc-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-zinc-700 transition-colors shadow-lg">
                <Printer size={20}/> Etiquetas ({filteredProducts.length})
            </button>
            
            <button onClick={() => handleOpenModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                <Plus size={20}/> Novo Produto
            </button>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-2">
        <Search className="text-slate-400" />
        <input 
            placeholder="Buscar produto para editar ou imprimir..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="flex-1 outline-none text-slate-700 font-medium bg-transparent" 
        />
      </div>

      {/* Lista de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                            <Tag size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 leading-tight">{p.name}</h3>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1"><Barcode size={10}/> {p.barcode}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-black text-indigo-600">R$ {p.price.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400">Custo: R$ {p.costPrice?.toFixed(2)}</p>
                    </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-medium">{p.category}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.stock} em estoque
                    </span>
                </div>

                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2">
                    <button onClick={() => handleOpenModal(p)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded"><Edit2 size={16}/></button>
                    <button onClick={() => {if(window.confirm('Excluir?')) onDeleteProduct(p.id)}} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                </div>
            </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-fade-in">
                <h3 className="text-xl font-bold text-slate-800 mb-6">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Nome do Produto</label>
                        <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-b border-slate-200 py-2 outline-none" placeholder="Ex: Camisa Leão de Judá" />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Código de Barras</label>
                        <input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="w-full border-b border-slate-200 py-2 outline-none font-mono" placeholder="Deixe vazio para gerar auto" />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Category})} className="w-full border-b border-slate-200 py-2 outline-none bg-transparent">
                            {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Preço Venda (R$)</label>
                        <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full border-b border-slate-200 py-2 outline-none font-bold text-green-600" />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Preço Custo (R$)</label>
                        <input type="number" step="0.01" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value)})} className="w-full border-b border-slate-200 py-2 outline-none text-red-400" />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Estoque Atual</label>
                        <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: parseFloat(e.target.value)})} className="w-full border-b border-slate-200 py-2 outline-none" />
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
                    <button onClick={handleSubmit} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200">Salvar Produto</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
