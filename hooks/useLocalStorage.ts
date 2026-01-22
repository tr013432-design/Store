import { useState, useEffect } from "react";

// Hook personalizado para salvar dados no navegador automaticamente
export function useLocalStorage<T>(key: string, initialValue: T) {
  // 1. Ao iniciar, tenta buscar o que estava salvo no navegador
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Pega o item pelo nome da chave (ex: 'draft_orders_list')
      const item = window.localStorage.getItem(key);
      // Se achar, converte de volta pra objeto/array. Se não, usa o valor inicial.
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Erro ao ler do localStorage:", error);
      return initialValue;
    }
  });

  // 2. Sempre que a variável mudar, salva automaticamente no navegador
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error("Erro ao salvar no localStorage:", error);
    }
  }, [key, storedValue]);

  // Retorna igualzinho ao useState: o valor e a função de atualizar
  return [storedValue, setStoredValue] as const;
}
