import { useState, useEffect } from "react";

// Hook para sincronizar o estado do React com o LocalStorage do navegador
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Estado para armazenar o valor
  // Passa uma função para o useState para que a lógica só execute uma vez
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      // Tenta pegar do local storage pela chave
      const item = window.localStorage.getItem(key);
      // Faz o parse do JSON ou retorna o valor inicial se não existir
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Se der erro, retorna o valor inicial
      console.log(error);
      return initialValue;
    }
  });

  // Função para atualizar o valor (como o setState normal)
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permite que o valor seja uma função (para ter a mesma API do useState)
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Salva o estado no React
      setStoredValue(valueToStore);
      
      // Salva no local storage do navegador
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue] as const;
}
