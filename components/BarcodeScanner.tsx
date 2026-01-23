import React, { useState } from 'react';
import { useZxing } from 'react-zxing';
import { X, Camera } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState('');

  const { ref } = useZxing({
    onDecodeResult(result) {
      // Quando ler com sucesso:
      const code = result.getText();
      if (code) {
        // Toca um "bip" de sucesso (opcional, mas legal)
        navigator.vibrate?.(200); 
        onScan(code);
        onClose();
      }
    },
    onError(err) {
      // Ignora erros de "não encontrei código nesse frame" para não poluir
      if (err.message.includes('No MultiFormat Readers')) return;
      // setError('Ajuste a câmera...'); // Opcional
    },
    // Força a câmera traseira (environment)
    constraints: { video: { facingMode: 'environment' } }
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      {/* Botão Fechar */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white p-2 bg-zinc-800 rounded-full hover:bg-zinc-700"
      >
        <X size={24} />
      </button>

      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <Camera className="text-green-500" /> Aponte para o código
      </h3>

      {/* Área da Câmera */}
      <div className="relative w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-2xl">
        <video ref={ref} className="w-full h-full object-cover" />
        
        {/* Linha Vermelha de Mira */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
        <p className="absolute bottom-4 w-full text-center text-xs text-white/70">Mantenha o código no centro</p>
      </div>

      {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      
      <button 
        onClick={onClose} 
        className="mt-8 text-zinc-400 text-sm hover:text-white underline"
      >
        Cancelar
      </button>
    </div>
  );
};
