import { useEffect, useState } from 'react'
import type { PreferenciaDeTema } from '../../../shared/tema/resolverTema'
import {
  aplicarPreferenciaDeTema,
  carregarPreferenciaDeTema,
  observarSistemaEscuro,
  salvarPreferenciaDeTema
} from './tema'

interface UsoDeTema {
  preferencia: PreferenciaDeTema
  escolher: (preferencia: PreferenciaDeTema) => void
}

export function useTema(): UsoDeTema {
  const [preferencia, setPreferencia] = useState<PreferenciaDeTema>(carregarPreferenciaDeTema)

  useEffect(() => {
    aplicarPreferenciaDeTema(preferencia)
    if (preferencia !== 'automatico') return

    const sistema = observarSistemaEscuro()
    const reaplicar = (): void => aplicarPreferenciaDeTema(preferencia)
    sistema.addEventListener('change', reaplicar)
    return () => sistema.removeEventListener('change', reaplicar)
  }, [preferencia])

  const escolher = (novaPreferencia: PreferenciaDeTema): void => {
    salvarPreferenciaDeTema(novaPreferencia)
    setPreferencia(novaPreferencia)
  }

  return { preferencia, escolher }
}
