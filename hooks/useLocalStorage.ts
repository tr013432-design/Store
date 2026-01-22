import { useState, useEffect } from "react";

// Hook personalizado para manter dados salvos mesmo saindo da tela
export function useLocalStorage<T>(key: string, initialValue: T) {
  // 1. Ao iniciar, tenta buscar o que estava salvo no navegador
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Se achar algo salvo, usa isso. Se não, usa o valor inicial (vazio)
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Erro ao ler do localStorage:", error);
      return initialValue;
    }
  });

  // 2. Sempre que você digita algo, ele salva automaticamente no navegador
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error("Erro ao salvar no localStorage:", error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}
