import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Product, Customer, DailyReport, ReportItem, PaymentMethod } from '../types';
import {
  Search,
  Package,
  Save,
  Trash2,
  Barcode,
  Plus,
  Minus,
  User,
  Phone,
  ScanLine,
  Coins,
  CreditCard
} from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';

interface VolunteerSalesProps {
  products: Product[];
  customers: Customer[];
  availableVolunteers: string[];
  availableServices: string[];
  pointsValue: number;
  onSubmitReport: (report: Omit<DailyReport, 'id' | 'status'>) => void;
}

const digitsOnly = (value: string) => String(value ?? '').replace(/\D/g, '');

export const VolunteerSales: React.FC<VolunteerSalesProps> = ({
  products,
  customers,
  availableVolunteers,
  availableServices,
  pointsValue,
  onSubmitReport
}) => {
  const [volunteerName, setVolunteerName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<ReportItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const scannerBufferRef = useRef('');
  const lastScannerKeyTimeRef = useRef(0);

  const normalizedPhone = digitsOnly(customerPhone);

  const matchedCustomer = useMemo(() => {
    if (!normalizedPhone) return null;
    return customers.find((c) => digitsOnly((c as any).phone ?? '') === normalizedPhone) ?? null;
  }, [customers, normalizedPhone]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products.slice(0, 8);

    return products
      .filter((p) => {
        const name = String(p.name ?? '').toLowerCase();
        const barcode = String((p as any).barcode ?? '').toLowerCase();
        return name.includes(term) || barcode.includes(term);
      })
      .slice(0, 8);
  }, [products, searchTerm]);

  const totals = useMemo(() => {
    const totalCash = items
      .filter((i) => i.paymentMethod === 'Dinheiro')
      .reduce((acc, item) => acc + item.total, 0);

    const totalPix = items
      .filter((i) => i.paymentMethod === 'Pix')
      .reduce((acc, item) => acc + item.total, 0);

    const totalDebit = items
      .filter((i) => i.paymentMethod.includes('Débito'))
      .reduce((acc, item) => acc + item.total, 0);

    const totalCredit = items
      .filter((i) => i.paymentMethod.includes('Crédito'))
      .reduce((acc, item) => acc + item.total, 0);

    const grandTotal = items.reduce((acc, item) => acc + item.total, 0);

    return { totalCash, totalPix, totalDebit, totalCredit, grandTotal };
  }, [items]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 120);

    return () => clearTimeout(timer);
  }, []);

  const resetProductForm = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setQuantity(1);
    setCustomerName('');
    setCustomerPhone('');
    scannerBufferRef.current = '';

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm('');
    setQuantity(1);
  };

  const findProduct = (rawValue: string) => {
    const term = String(rawValue ?? '').trim().toLowerCase();
    if (!term) return null;

    return (
      products.find(
        (p) =>
          String((p as any).barcode ?? '').toLowerCase() === term ||
          String(p.name ?? '').toLowerCase() === term
      ) ??
      products.find((p) => String((p as any).barcode ?? '').toLowerCase().includes(term)) ??
      products.find((p) => String(p.name ?? '').toLowerCase().includes(term)) ??
      null
    );
  };

  const processScannedCode = (code: string) => {
    const found = findProduct(code);

    if (!found) {
      alert(`Produto com código ${code} não encontrado.`);
      return;
    }

    handleSelectProduct(found);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;

    const found = findProduct(searchTerm);

    if (found) {
      handleSelectProduct(found);
    } else {
      alert('Produto não encontrado.');
    }
  };

  useEffect(() => {
    const handleGlobalScanner = (e: KeyboardEvent) => {
      if (isScanning) return;
      if (selectedProduct) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const now = Date.now();
      const timeGap = now - lastScannerKeyTimeRef.current;

      if (timeGap > 80) {
        scannerBufferRef.current = '';
      }

      if (e.key === 'Enter') {
        if (scannerBufferRef.current.length >= 3) {
          e.preventDefault();
          e.stopPropagation();
          processScannedCode(scannerBufferRef.current);
          scannerBufferRef.current = '';
        }
        return;
      }

      if (e.key.length === 1) {
        scannerBufferRef.current += e.key;
        lastScannerKeyTimeRef.current = now;

        if (scannerBufferRef.current.length > 60) {
          scannerBufferRef.current = scannerBufferRef.current.slice(-60);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalScanner, true);
    return () => window.removeEventListener('keydown', handleGlobalScanner, true);
  }, [isScanning, selectedProduct, products]);

  const handleScanSuccess = (code: string) => {
    const found = products.find((p) => String((p as any).barcode ?? '') === String(code));

    if (!found) {
      alert(`Produto com código ${code} não encontrado.`);
      setIsScanning(false);
      return;
    }

    handleSelectProduct(found);
    setIsScanning(false);
  };

  const getNeededPoints = (total: number) => {
    const safePointsValue = Number(pointsValue) > 0 ? Number(pointsValue) : 0.1;
    return Math.ceil(total / safePointsValue);
  };

  const handleAddItem = (paymentMethod: PaymentMethod) => {
    if (!selectedProduct) {
      alert('Selecione um produto.');
      return;
    }

    const cleanPhone = digitsOnly(customerPhone);
    const total = Number(selectedProduct.price) * quantity;

    if (paymentMethod === 'Sara Points') {
      if (!cleanPhone) {
        alert('Para usar Sara Points, informe o telefone do cliente.');
        return;
      }

      if (!matchedCustomer) {
        alert('Cliente não encontrado para resgate com Sara Points.');
        return;
      }

      const neededPoints = getNeededPoints(total);
      const customerPoints = Number((matchedCustomer as any).points ?? 0);

      if (customerPoints < neededPoints) {
        alert(`Saldo insuficiente. Necessário: ${neededPoints} pontos.`);
        return;
      }
    }

    const newItem: ReportItem = {
      productName: selectedProduct.name,
      quantity,
      total,
      paymentMethod,
      checked: true,
      customerPhone: cleanPhone || ''
    };

    setItems((prev) => [newItem, ...prev]);
    resetProductForm();
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setItems((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleFinalize = () => {
    if (!volunteerName.trim() || !serviceType.trim()) {
      alert('Preencha responsável e culto.');
      return;
    }

    if (items.length === 0) {
      alert('Adicione pelo menos 1 item.');
      return;
    }

    onSubmitReport({
      volunteerName,
      serviceType,
      date,
      time,
      items,
      notes,
      totalCash: totals.totalCash,
      totalPix: totals.totalPix,
      totalDebit: totals.totalDebit,
      totalCredit: totals.totalCredit,
      grandTotal: totals.grandTotal
    });

    setItems([]);
    setNotes('');
    resetProductForm();
  };

  return (
    <div className="flex flex-col h-full gap-6 pb-24 lg:pb-0">
      {isScanning && <BarcodeScanner onScan={handleScanSuccess} onClose={() => setIsScanning(false)} />}

      <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Responsável
          </label>
          <input
            list="volunteers_sales"
            value={volunteerName}
            onChange={(e) => setVolunteerName(e.target.value)}
            className="w-full font-bold text-zinc-200 border-b border-zinc-700 bg-transparent outline-none focus:border-green-500 transition-colors py-1"
            placeholder="Seu nome"
          />
          <datalist id="volunteers_sales">
            {availableVolunteers.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Culto
          </label>
          <input
            list="services_sales"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full font-bold text-zinc-200 border-b border-zinc-700 bg-transparent outline-none focus:border-green-500 transition-colors py-1"
            placeholder="Selecione..."
          />
          <datalist id="services_sales">
            {availableServices.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Data
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full font-bold text-zinc-200 border-b border-zinc-700 bg-transparent outline-none focus:border-green-500 transition-colors py-1"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Hora
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full font-bold text-zinc-200 border-b border-zinc-700 bg-transparent outline-none focus:border-green-500 transition-colors py-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col gap-4">
          <h3 className="font-bold text-white flex items-center gap-2 uppercase tracking-wide">
            <Package size={20} className="text-green-500" />
            Nova venda
          </h3>

          <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-widest font-bold text-green-400">
              Leitor físico ativo
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Pode bipar o código direto sem clicar na busca.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
              <input
                ref={searchInputRef}
                placeholder="Bipe, digite ou escaneie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-4 py-3 border border-zinc-700 bg-black rounded-xl text-sm focus:border-green-500 outline-none text-white placeholder-zinc-600"
              />
            </div>

            <button
              onClick={() => setIsScanning(true)}
              className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-green-500 transition-colors"
              title="Ler código com a câmera"
            >
              <ScanLine size={20} />
            </button>
          </div>

          {!selectedProduct && (
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-black/40 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Sugestões
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="w-full text-left px-4 py-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-white text-sm">{product.name}</p>
                          <p className="text-xs text-zinc-500">
                            {String((product as any).barcode ?? 'Sem código')}
                          </p>
                        </div>
                        <span className="text-green-400 font-bold text-sm">
                          R$ {Number(product.price).toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-zinc-600 text-sm">
                    Nenhum produto encontrado.
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedProduct ? (
            <div className="animate-fade-in space-y-4 border-t border-zinc-800 pt-4">
              <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                <p className="font-bold text-green-400 text-lg">{selectedProduct.name}</p>
                <p className="text-xs text-zinc-400">
                  Preço unitário: R$ {Number(selectedProduct.price).toFixed(2)}
                </p>
                <p className="text-xs text-zinc-500">
                  Estoque: {Number((selectedProduct as any).stock ?? 0)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Qtd</span>
                <div className="flex items-center bg-black border border-zinc-700 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-zinc-800 text-zinc-400 rounded"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-zinc-800 text-zinc-400 rounded"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="ml-auto text-sm font-bold text-white">
                  R$ {(Number(selectedProduct.price) * quantity).toFixed(2)}
                </span>
              </div>

              <div className="space-y-3 bg-black p-3 rounded-xl border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Dados do cliente</p>

                <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <User size={16} className="text-zinc-600" />
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nome da pessoa (opcional)"
                    className="bg-transparent w-full text-sm outline-none text-white placeholder-zinc-700"
                  />
                </div>

                <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <Phone size={16} className="text-zinc-600" />
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Telefone (opcional)"
                    className="bg-transparent w-full text-sm outline-none text-white placeholder-zinc-700"
                  />
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
                  {matchedCustomer ? (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">
                          {matchedCustomer.name || customerName || 'Cliente encontrado'}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {digitsOnly((matchedCustomer as any).phone ?? '')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                          Sara Points
                        </p>
                        <p className="text-green-400 font-black text-lg">
                          {Number((matchedCustomer as any).points ?? 0)}
                        </p>
                      </div>
                    </div>
                  ) : customerPhone.trim() ? (
                    <p className="text-xs text-zinc-500">
                      Cliente ainda não encontrado na fidelidade. A venda pode ser lançada normalmente.
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500">
                      Telefone opcional. Só é necessário para identificar cliente na fidelidade ou usar Sara Points.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <PayBtn label="Dinheiro" onClick={() => handleAddItem('Dinheiro')} />
                <PayBtn label="Pix" onClick={() => handleAddItem('Pix')} />
                <PayBtn label="Débito" onClick={() => handleAddItem('Cartão Débito')} />
                <PayBtn label="Crédito 1x" onClick={() => handleAddItem('Cartão Crédito (1x)')} />
                <PayBtn label="Crédito 2x" onClick={() => handleAddItem('Cartão Crédito (2x)')} />
                <PayBtn label="Crédito 3x" onClick={() => handleAddItem('Cartão Crédito (3x)')} />
                <PayBtn
                  label={`Sara Points (${getNeededPoints(Number(selectedProduct.price) * quantity)})`}
                  onClick={() => handleAddItem('Sara Points')}
                  fullWidth
                />
              </div>

              <button
                onClick={resetProductForm}
                className="w-full py-2 text-xs text-zinc-500 hover:text-red-500 uppercase tracking-wider font-bold"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-2 border-2 border-dashed border-zinc-800 rounded-xl min-h-[180px]">
              <Barcode size={40} className="opacity-50" />
              <p className="text-xs uppercase tracking-widest">Selecione ou escaneie um produto</p>
            </div>
          )}

          <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Ex.: troca, desconto, observação interna..."
              className="mt-2 w-full bg-transparent outline-none text-sm text-white placeholder-zinc-700 resize-none"
            />
          </div>
        </div>

        <div className="lg:col-span-2 bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden">
          <div className="p-4 bg-black/50 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="font-bold text-white uppercase tracking-wide">Itens da venda</h3>
            <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded-full font-bold uppercase tracking-widest">
              {items.length} itens
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="text-zinc-500 sticky top-0 bg-zinc-900 shadow-lg z-10 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="p-4">Pagamento</th>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={`${item.productName}-${index}`}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="p-4 text-zinc-400 text-xs">{item.paymentMethod}</td>
                    <td className="p-4">
                      <span className="text-green-400 font-bold">{item.quantity}x</span>{' '}
                      <span className="text-white">{item.productName}</span>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-zinc-300">{item.customerPhone || '-'}</div>
                    </td>
                    <td className="p-4 text-right font-bold text-white">
                      R$ {Number(item.total).toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 bg-red-900/30 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {items.length === 0 && (
              <div className="p-10 text-center text-zinc-600 text-sm">Nenhum item lançado.</div>
            )}
          </div>

          <div className="p-4 border-t border-zinc-800 bg-black/30 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <SummaryCard label="Dinheiro" value={totals.totalCash} />
              <SummaryCard label="Pix" value={totals.totalPix} />
              <SummaryCard label="Débito" value={totals.totalDebit} />
              <SummaryCard label="Crédito" value={totals.totalCredit} />
              <SummaryCard label="Total Geral" value={totals.grandTotal} highlight />
            </div>

            <button
              onClick={handleFinalize}
              className="w-full bg-green-600 text-black py-3 rounded-xl font-bold hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] flex justify-center items-center gap-2 transition-all uppercase tracking-widest text-sm"
            >
              <Save size={18} /> Enviar para validação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PayBtn = ({
  label,
  onClick,
  fullWidth = false
}: {
  label: string;
  onClick: () => void;
  fullWidth?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`bg-black border border-zinc-700 py-3 rounded-lg text-[10px] font-bold text-zinc-400 hover:border-green-500 hover:text-green-500 transition-all uppercase tracking-widest flex justify-center items-center gap-1 ${
      fullWidth ? 'col-span-2' : ''
    }`}
  >
    {label.includes('Crédito') ? <CreditCard size={12} /> : null}
    {label.includes('Sara Points') ? <Coins size={12} /> : null}
    {label}
  </button>
);

const SummaryCard = ({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-xl border px-3 py-3 ${
      highlight ? 'border-green-500/30 bg-green-500/10' : 'border-zinc-800 bg-zinc-950/70'
    }`}
  >
    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{label}</p>
    <p className={`text-sm font-black ${highlight ? 'text-green-400' : 'text-white'}`}>
      R$ {Number(value).toFixed(2)}
    </p>
  </div>
);

export default VolunteerSales;
