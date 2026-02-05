import React, { useEffect, useMemo, useState } from 'react';
import { Customer, Category } from '../types';
import { Trophy, Search, Gift, Phone, Plus, Star, AlertCircle, Settings, Save } from 'lucide-react';

interface LoyaltyProps {
  customers: Customer[];
  pointsConfig?: Record<string, number>;
  onUpdatePointsConfig?: (config: Record<string, number>) => void;
  onManualAddPoints: (phone: string, points: number) => void;
  onRedeemReward: (phone: string, cost: number) => void;
}

const LOYALTY_POINTS_BY_PHONE_KEY = 'loyalty_points_by_phone_v1';
const LOYALTY_CONFIG_KEY = 'loyaltyPointsByCategory';

const digitsOnly = (v: any) => String(v ?? '').replace(/\D/g, '');

const safeNumber = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const loadPhonePointsMap = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(LOYALTY_POINTS_BY_PHONE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const savePhonePointsMap = (map: Record<string, number>) => {
  try {
    localStorage.setItem(LOYALTY_POINTS_BY_PHONE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
};

const loadPointsConfigLocal = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(LOYALTY_CONFIG_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const sanitizeConfig = (cfg: Record<string, number>) => {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(cfg || {})) {
    const n = Math.max(0, Math.trunc(safeNumber(v, 0)));
    out[String(k)] = n;
  }
  return out;
};

export const Loyalty: React.FC<LoyaltyProps> = ({
  customers,
  pointsConfig,
  onUpdatePointsConfig,
  onManualAddPoints,
  onRedeemReward,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Config painel
  const [showConfig, setShowConfig] = useState(false);
  const [tempConfig, setTempConfig] = useState<Record<string, number>>({});

  // ✅ Estado local para refletir pontos mesmo se o "pai" não re-renderizar customers
  const [phonePointsMap, setPhonePointsMap] = useState<Record<string, number>>({});

  // ✅ Carrega mapa e config (localStorage) ao abrir
  useEffect(() => {
    setPhonePointsMap(loadPhonePointsMap());

    // prioridade: props -> localStorage -> vazio
    const fromProps = pointsConfig && typeof pointsConfig === 'object' ? pointsConfig : null;
    const fromLocal = loadPointsConfigLocal();
    setTempConfig(sanitizeConfig(fromProps || fromLocal || {}));
  }, []);

  // ✅ Se o pai atualizar pointsConfig, sincroniza o tempConfig
  useEffect(() => {
    if (pointsConfig && typeof pointsConfig === 'object') {
      setTempConfig(sanitizeConfig(pointsConfig));
    }
  }, [pointsConfig]);

  // ✅ Atualiza ao mudar localStorage em outra aba
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOYALTY_POINTS_BY_PHONE_KEY) {
        setPhonePointsMap(loadPhonePointsMap());
      }
      if (e.key === LOYALTY_CONFIG_KEY && !pointsConfig) {
        setTempConfig(loadPointsConfigLocal());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [pointsConfig]);

  // ✅ Junta customers (prop) com fallback do mapa por telefone (sem “dobrar” pontos)
  const customersMerged = useMemo(() => {
    const map = phonePointsMap || {};

    return customers.map(c => {
      const phone = digitsOnly(c.id);
      const mapPts = safeNumber(map[phone], 0);

      const basePts = safeNumber((c as any).points, 0);

      // Evita dobrar: se o base já tiver os pontos, pega o maior (mais atualizado)
      // Se base for 0 e mapa tiver >0, usa mapa.
      const mergedPoints =
        basePts === 0 && mapPts > 0 ? mapPts : Math.max(basePts, mapPts);

      return { ...c, points: mergedPoints };
    });
  }, [customers, phonePointsMap]);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return customersMerged
      .filter(c => {
        const name = String(c.name ?? '').toLowerCase();
        const id = String(c.id ?? '').toLowerCase();
        const onlyDigits = digitsOnly(c.id);
        const matches =
          name.includes(term) ||
          id.includes(term) ||
          (term && digitsOnly(term) && onlyDigits.includes(digitsOnly(term)));
        return term ? matches : true;
      })
      .sort((a, b) => safeNumber(b.points, 0) - safeNumber(a.points, 0));
  }, [customersMerged, searchTerm]);

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customersMerged.find(c => String(c.id) === String(selectedCustomerId)) || null;
  }, [customersMerged, selectedCustomerId]);

  const rewardsAvailable = selectedCustomer ? Math.floor(safeNumber(selectedCustomer.points, 0) / 100) : 0;
  const pointsToNext = selectedCustomer ? safeNumber(selectedCustomer.points, 0) % 100 : 0;
  const missingPoints = 100 - pointsToNext;

  const handleSaveConfig = () => {
    const cleaned = sanitizeConfig(tempConfig);

    // ✅ salva no localStorage (POS vai ler isso)
    try {
      localStorage.setItem(LOYALTY_CONFIG_KEY, JSON.stringify(cleaned));
    } catch {
      // ignore
    }

    // ✅ mantém compatibilidade com seu fluxo atual
    if (onUpdatePointsConfig) onUpdatePointsConfig(cleaned);

    setShowConfig(false);
    alert('Regras de pontuação atualizadas!');
  };

  // ✅ Atualiza mapa local imediatamente (UI), e chama o handler do pai
  const handleManualAdd = (phone: string, points: number) => {
    const clean = digitsOnly(phone);
    if (!clean) return;

    const p = Math.trunc(safeNumber(points, 0));
    if (!Number.isFinite(p) || p === 0) return;

    // Atualiza fallback local (pra refletir na tela mesmo se o pai não atualizar "customers")
    const nextMap = { ...(phonePointsMap || {}) };
    nextMap[clean] = safeNumber(nextMap[clean], 0) + p;
    setPhonePointsMap(nextMap);
    savePhonePointsMap(nextMap);

    // chama lógica original do app
    onManualAddPoints(phone, points);
  };

  const handleRedeem = (phone: string, cost: number) => {
    const clean = digitsOnly(phone);
    if (!clean) return;

    const c = Math.max(0, Math.trunc(safeNumber(cost, 0)));
    if (c <= 0) return;

    // desconta no fallback local (sem travar o seu fluxo)
    const nextMap = { ...(phonePointsMap || {}) };
    const current = safeNumber(nextMap[clean], 0);

    // se o customer.points veio do customer base (não do map), esse desconto pode não aparecer no map.
    // então a gente desconta no map, e a UI pega o maior entre base e map.
    // para garantir refletir, vamos ajustar o map para (base - cost) quando base for maior.
    const basePoints = selectedCustomer ? safeNumber(selectedCustomer.points, 0) : 0;
    const target = Math.max(0, basePoints - c);
    nextMap[clean] = Math.max(0, Math.min(current, target)); // mantém consistente (não cria pontos do nada)

    setPhonePointsMap(nextMap);
    savePhonePointsMap(nextMap);

    onRedeemReward(phone, cost);
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Star className="text-yellow-500" fill="#eab308" /> Sara Points
          </h2>
          <p className="text-zinc-500 text-sm mt-1 font-bold tracking-widest uppercase">Programa de Fidelidade</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* BOTÃO CONFIGURAR */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-3 rounded-xl border transition-colors ${
              showConfig
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Configurar pontos por categoria"
          >
            <Settings size={20} />
          </button>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-3.5 text-zinc-500" size={20} />
            <input
              placeholder="Buscar Cliente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-yellow-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* PAINEL DE CONFIGURAÇÃO */}
      {showConfig && (
        <div className="bg-zinc-900 border border-indigo-500/30 p-6 rounded-2xl animate-fade-in mb-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Settings size={18} className="text-indigo-500" /> Configurar Pontos por Categoria
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.values(Category).map(cat => (
              <div key={cat} className="bg-black p-3 rounded-xl border border-zinc-800">
                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2 h-8">{cat}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={safeNumber(tempConfig[cat], 0)}
                    onChange={e =>
                      setTempConfig({
                        ...tempConfig,
                        [cat]: Math.max(0, Math.trunc(safeNumber(e.target.value, 0))),
                      })
                    }
                    className="w-full bg-zinc-900 text-white font-bold border border-zinc-700 rounded p-2 text-center outline-none focus:border-indigo-500"
                  />
                  <span className="text-xs text-zinc-500">pts</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveConfig}
            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-colors"
          >
            <Save size={18} /> Salvar Regras
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LISTA */}
        <div className="lg:col-span-2 space-y-4">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">Nenhum cliente encontrado.</div>
          ) : (
            filteredCustomers.map(customer => (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomerId(String(customer.id))}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                  selectedCustomer?.id === customer.id
                    ? 'bg-zinc-800 border-yellow-500/50'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-zinc-700 flex items-center justify-center font-bold text-zinc-300">
                    {String(customer.name ?? '').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{customer.name}</h3>
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      <Phone size={10} /> {customer.id}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-2xl font-black ${safeNumber(customer.points, 0) < 0 ? 'text-red-500' : 'text-yellow-500'}`}>
                    {safeNumber(customer.points, 0)}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Pontos</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DETALHES */}
        <div className="lg:col-span-1">
          {selectedCustomer ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center mb-3 relative">
                  <Trophy size={40} className="text-yellow-500" />
                  {rewardsAvailable > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white font-bold w-8 h-8 flex items-center justify-center rounded-full border-4 border-zinc-900 shadow-lg">
                      {rewardsAvailable}
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-white">{selectedCustomer.name}</h2>
                {rewardsAvailable > 0 ? (
                  <p className="text-yellow-400 font-bold text-sm animate-pulse">🎉 {rewardsAvailable} PRÊMIO(S) DISPONÍVEL(IS)!</p>
                ) : (
                  <p className="text-zinc-500 text-sm">Continue comprando para ganhar!</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black p-3 rounded-xl border border-zinc-800 text-center">
                  <p className="text-xs text-zinc-500 uppercase">Total Gasto</p>
                  <p className="font-bold text-white">R$ {safeNumber((selectedCustomer as any).totalSpent, 0).toFixed(2)}</p>
                </div>
                <div className="bg-black p-3 rounded-xl border border-zinc-800 text-center">
                  <p className="text-xs text-zinc-500 uppercase">Última Compra</p>
                  <p className="font-bold text-white">
                    {(selectedCustomer as any).lastPurchase
                      ? new Date((selectedCustomer as any).lastPurchase).toLocaleDateString()
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-xs font-bold uppercase mb-1">
                  <span className="text-yellow-500">Próximo Nível</span>
                  <span className="text-zinc-400">{pointsToNext} / 100</span>
                </div>

                <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 flex justify-between px-1">
                    <div className="w-px h-full bg-zinc-700/50"></div>
                    <div className="w-px h-full bg-zinc-700/50"></div>
                    <div className="w-px h-full bg-zinc-700/50"></div>
                  </div>
                  <div
                    className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, pointsToNext))}%` }}
                  ></div>
                </div>

                <p className="text-xs text-center mt-2 text-zinc-500">
                  Faltam <strong>{missingPoints} pontos</strong> para o próximo brinde.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (rewardsAvailable > 0) {
                      if (window.confirm(`CONFIRMAR RESGATE?\n\nIsso vai descontar 100 pontos.`)) {
                        handleRedeem(selectedCustomer.id, 100);
                      }
                    } else {
                      alert(`Faltam ${missingPoints} pontos para liberar o resgate!`);
                    }
                  }}
                  disabled={rewardsAvailable === 0}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    rewardsAvailable > 0
                      ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transform hover:scale-[1.02]'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
                  }`}
                >
                  <Gift size={20} className={rewardsAvailable > 0 ? 'animate-bounce' : ''} />{' '}
                  {rewardsAvailable > 0 ? 'RESGATAR PRÊMIO (-100)' : 'SALDO INSUFICIENTE'}
                </button>

                {safeNumber(selectedCustomer.points, 0) < 0 && (
                  <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-xl flex items-center gap-2 text-red-400 text-xs">
                    <AlertCircle size={16} />
                    <span>Erro: Saldo negativo detectado.</span>
                    <button
                      onClick={() => handleManualAdd(selectedCustomer.id, Math.abs(safeNumber(selectedCustomer.points, 0)))}
                      className="underline hover:text-white ml-auto"
                    >
                      Zerar
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    const pts = prompt('Adicionar pontos:');
                    const p = Math.trunc(safeNumber(pts, NaN));
                    if (Number.isFinite(p) && p !== 0) handleManualAdd(selectedCustomer.id, p);
                  }}
                  className="w-full py-3 bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-xl font-bold hover:bg-zinc-900 hover:text-white flex items-center justify-center gap-2 transition-colors text-xs uppercase tracking-wider"
                >
                  <Plus size={16} /> Ajuste Manual
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-2xl p-8">
              <Search size={48} className="mb-4 opacity-20" />
              <p>Selecione um cliente para ver detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
