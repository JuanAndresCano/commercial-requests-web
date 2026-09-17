import { useEffect, useState } from "react";

/**
 * Igual que useState, pero sobrevive a que el componente se desmonte y remonte
 * (ej. al salir a ver el detalle de una propuesta y volver al dashboard) guardando
 * el valor en localStorage. El valor inicial solo aplica la primera vez que no hay
 * nada guardado — no cambia el default para un usuario nuevo.
 */
export function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch {
      // Storage corrupta o no disponible — se usa el valor inicial.
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Storage no disponible (modo privado, cuota llena, etc.) — se ignora.
    }
  }, [key, state]);

  return [state, setState] as const;
}
