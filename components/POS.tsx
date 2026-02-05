import React, { useMemo, useState } from 'react';
import { Product, CartItem, Category } from '../types';
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, QrCode, Phone } from 'lucide-react';

interface POSProps {
  products: Product[];
  onCompleteSale: (items: CartItem[], total: number, method: 'Dinheiro' | 'Cartão' | 'Pix') => void;
}

type LoyaltyConfig =
  | {
      enabled?: boolean;
      defaultPointsPerItem?: number;
      pointsByCategory?: Record<string, number>;
      rules?: Array<{ category: string; points: number }>;
      categories?: Array<{ category: string; pointsPerItem: number }>;
    }
  | Record<string, number>;

const LOYALTY_CUSTOMERS_KEY = 'customers';
const LOYALTY_POINTS_BY_PHONE_KEY = 'loyalty_points_by_phone_v1';

// tenta achar regras em várias chaves (pra casar com qualquer implementação que você já tenha)
const LOYALTY_CONFIG_KEYS = ['loyaltyPointsByCategory', 'loyalty_rules', 'loyaltySettings', 'sara_points_rules', 'loyaltyProgram'];

function digitsOnly(v: string) {
  return (v ?? '').replace(/\D/g, '');
}

function loadLoyaltyConfig(): { enabled: boolean; defaultPointsPerItem: number; pointsByCategory: Record<string, number> } {
  let parsed: any = null;

  for (const k of LOYALTY_CONFIG_KEYS) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;

    try {
      parsed = JSON.parse(raw);
      if (parsed) break;
    } catch {
      // ignora e tenta próxima
    }
  }

  // padrão: não travar o sistema — se não houver regra salva, dá 1 ponto por item (você pode ajustar)
  const base = {
    enabled: true,
    defaultPointsPerItem: 1,
    pointsByCategory: {} as Record<string, number>,
  };

  if (!parsed) return base;

  // caso seja um objeto simples { "Categoria": 10, ... }
  if (typeof parsed === 'object' && !Array.isArray(parsed) && !('pointsByCategory' in parsed) && !('rules' in parsed) && !('categories' in parsed)) {
    return {
      enabled: true,
      defaultPointsPerItem: 0,
      pointsByCategory: parsed as Record<string, number>,
    };
  }

  // caso seja um config mais completo
  const enabled = parsed.enabled !== false;
  const defaultPointsPerItem = Number.isFinite(Number(parsed.defaultPointsPerItem)) ? Number(parsed.defaultPointsPerItem) : base.defaultPointsPerItem;

  let map: Record<string, number> = {};
  if (parsed.pointsByCategory && typeof parsed.pointsByCategory === 'object') {
    map = parsed.pointsByCategory;
  } else if (Array.isArray(parsed.rules)) {
    for (const r of parsed.rules) {
      if (!r?.category) continue;
      const pts = Number(r.points);
      if (Number.isFinite(pts)) map[String(r.category)] = pts;
    }
  } else if (Array.isArray(parsed.categories)) {
    for (const r of parsed.categories) {
      if (!r?.category) continue;
      const pts = Number(r.pointsPerItem);
      if (Number.isFinite(pts)) map[String(r.category)] = pts;
    }
  }

  return { enabled, defaultPointsPerItem, pointsByCategory: map };
}

function computeEarnedPoints(cart: CartItem[]): number {
  const cfg = loadLoyaltyConfig();
  if (!cfg.enabled) return 0;

  const pointsByCategory = cfg.pointsByCategory || {};
  const defaultPoints = cfg.defaultPointsPerItem ?? 0;

  let points = 0;

  for (const item of cart) {
    const catKey = String(item.category ?? '');
    const ptsPerItem = Number.isFinite(Number(pointsByCategory[catKey]))
      ? Number(pointsByCategory[catKey])
      : defaultPoints;

    if (ptsPerItem > 0) {
      points += ptsPerItem * Number(item.quantity ?? 1);
    }
  }

  return Math.max(0, Math.trunc(points));
}

function applyLoyaltyPoints(customerPhoneRaw: string, cart: CartItem[]) {
  const phone = digitsOnly(customerPhoneRaw);

  if (!phone) return { applied: false, points: 0, reason: 'no_phone' };

  const earned = computeEarnedPoints(cart);
  if (earned <= 0) return { applied: false, points: 0, reason: 'no_points' };

  // 1) fallback: mapa simples por telefone
  try {
    const raw = localStorage.getItem(LOYALTY_POINTS_BY_PHONE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const current = Number(map?.[phone] ?? 0);
    map[phone] = current + earned;
    localStorage.setItem(LOYALTY_POINTS_BY_PHONE_KEY, JSON.stringify(map));
  } catch {
    // ignora
  }

  // 2) se existir "customers" no storage, tenta somar no cliente certo
  try {
    const rawCustomers = localStorage.getItem(LOYALTY_CUSTOMERS_KEY);
    if (rawCustomers) {
      const customers = JSON.parse(rawCustomers);

      if (Array.isArray(customers)) {
        const normalizedPhone = phone;

        const idx = customers.findIndex((c: any) => {
          const p =
            digitsOnly(String(c?.phone ?? '')) ||
            digitsOnly(String(c?.customerPhone ?? '')) ||
            digitsOnly(String(c?.tel ?? '')) ||
            digitsOnly(String(c?.telefone ?? ''));
          return p === normalizedPhone;
        });

        if (idx >= 0) {
          const c = customers[idx];

          // tenta manter compatível com qualquer nome de campo existente
          const field =
            ('points' in c && 'points') ||
            ('loyaltyPoints' in c && 'loyaltyPoints') ||
            ('saraPoints' in c && 'saraPoints') ||
            ('pontos' in c && 'pontos') ||
            'points';

          const current = Number(c?.[field] ?? 0);
          const nextCustomer = { ...c, [field]: (Number.isFinite(current) ? current : 0) + earned };

          const next = customers.slice();
          next[idx] = nextCustomer;

          localStorage.setItem(LOYALTY_CUSTOMERS_KEY, JSON.stringify(next));
        }
      }
    }
  } catch {
    // ignora
  }

  return { applied: true, points: earned, reason: 'ok' };
}

export const POS: React.FC<POSProps> = ({ products, onCompleteSale }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [customerPhone, setCustomerPhone] = useState<string>(''); // ✅ tel do cliente para pontos

  const categories = useMemo(() => ['Todos', ...Object.values(Category)], []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.id === id) {
            return { ...item, quantity: Math.max(0, Math.trunc(item.quantity + delta)) };
          }
          return item;
        })
        .filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.quantity, 0), [cart]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return products.filter(p => {
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const handleCheckout = (method: 'Dinheiro' | 'Cartão' | 'Pix') => {
    if (cart.length === 0) return;

    // ✅ aplica fidelidade ANTES de limpar carrinho
    const loyalty = applyLoyaltyPoints(customerPhone, cart);

    // finaliza venda no fluxo existente
    onCompleteSale(cart, cartTotal, method);

    setCart([]);

    // opcional: manter telefone para próximas vendas (se quiser limpar, descomenta)
    // setCustomerPhone('');

    if (loyalty.applied) {
      alert(`Venda realizada com sucesso! ✅\n+${loyalty.points} pontos adicionados ao cliente.`);
    } else {
      // se não aplicou por falta de telefone, avisa (sem travar venda)
      if (loyalty.reason === 'no_phone') {
        alert('Venda realizada com sucesso! ✅\n(Cliente sem telefone informado — não foi possível aplicar pontos.)');
      } else {
        alert('Venda realizada com sucesso! ✅');
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-2rem)] gap-6">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20 lg:pb-0">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 cursor-pointer hover:shadow-md transition-all hover:border-indigo-200 group flex flex-col"
            >
              <div className="aspect-square bg-slate-100 rounded-lg mb-3 overflow-hidden relative">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    Sem imagem
                  </div>
                )}

                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold text-slate-700 shadow-sm">
                  R$ {product.price.toFixed(2)}
                </div>
              </div>

              <h3 className="font-semibold text-slate-800 text-sm mb-1 leading-tight">{product.name}</h3>
              <p className="text-xs text-slate-500 mb-auto">{product.category}</p>

              <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  {product.stock} un
                </span>
                <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-full hover:bg-indigo-600 hover:text-white transition-colors">
                  <Plus size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-96 bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col h-[50vh] lg:h-auto fixed bottom-0 lg:static left-0 z-50 lg:z-0">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl lg:bg-white">
          <div className="flex items-center gap-2 text-slate-800">
            <ShoppingCart className="text-indigo-600" />
            <h2 className="font-bold text-lg">Carrinho</h2>
          </div>
          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-bold">
            {cart.reduce((acc, i) => acc + i.quantity, 0)} itens
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShoppingCart size={48} className="opacity-20" />
              <p className="text-sm">Seu carrinho está vazio</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-800 truncate text-sm">{item.name}</h4>
                  <p className="text-xs text-slate-500">R$ {item.price.toFixed(2)} un</p>
                </div>

                <div className="flex items-center gap-3 ml-2">
                  <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 h-8">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="px-2 h-full hover:bg-slate-50 text-slate-600 rounded-l-lg transition-colors"
                    >
                      <Minus size={12} />
                    </button>

                    <span className="w-8 text-center text-sm font-medium text-slate-700">{item.quantity}</span>

                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="px-2 h-full hover:bg-slate-50 text-slate-600 rounded-r-lg transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 bg-slate-50 rounded-b-2xl border-t border-slate-100 space-y-4">
          {/* ✅ Telefone para pontos */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <Phone size={18} className="text-slate-500" />
            <input
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="Tel Cliente (para pontos)"
              className="w-full outline-none text-sm text-slate-800 placeholder-slate-400"
              inputMode="tel"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Total a Pagar</span>
            <span className="text-2xl font-bold text-slate-900">R$ {cartTotal.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleCheckout('Dinheiro')}
              disabled={cart.length === 0}
              className="flex flex-col items-center justify-center gap-1 p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Banknote size={20} />
              <span className="text-xs font-medium">Dinheiro</span>
            </button>

            <button
              onClick={() => handleCheckout('Pix')}
              disabled={cart.length === 0}
              className="flex flex-col items-center justify-center gap-1 p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <QrCode size={20} />
              <span className="text-xs font-medium">Pix</span>
            </button>

            <button
              onClick={() => handleCheckout('Cartão')}
              disabled={cart.length === 0}
              className="flex flex-col items-center justify-center gap-1 p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <CreditCard size={20} />
              <span className="text-xs font-medium">Cartão</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
