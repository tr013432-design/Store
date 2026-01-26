import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, ScanLine } from 'lucide-react';

// Se quiser usar câmera real no futuro, podemos instalar 'html5-qrcode'.
// Por enquanto, vamos fazer um simulador de "Bip" via teclado (que é como leitores USB funcionam).

interface ScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const [manualCode, setManualCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Foca no input assim que abre
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        if (manualCode.trim()) {
            onScan(manualCode);
            setManualCode('');
        }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in">
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-400 hover:text-white p-2">
            <X size={32} />
        </button>

        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
            {/* Efeito de Scanner */}
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_50px_rgba(34,197,94,0.5)] animate-[scan_2s_ease-in-out_infinite]"></div>

            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-700">
                <ScanLine size={32} className="text-green-500" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Aguardando Leitura</h3>
            <p className="text-sm text-zinc-500 mb-8">Aponte o leitor ou digite o código</p>

            <div className="relative">
                <input 
                    ref={inputRef}
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Código de barras..." 
                    className="w-full bg-black border border-zinc-700 rounded-xl py-4 px-4 text-center text-xl font-mono text-white tracking-widest focus:border-green-500 outline-none transition-all"
                />
            </div>
            
            <p className="text-[10px] text-zinc-600 mt-4 uppercase tracking-widest">Pressione Enter para confirmar</p>
        </div>
    </div>
  );
};
