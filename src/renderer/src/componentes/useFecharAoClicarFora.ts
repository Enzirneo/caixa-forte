import { useEffect, useRef, type RefObject } from 'react'

// Fecha o menu ao clicar em qualquer lugar fora dele ou ao apertar Esc.
export function useFecharAoClicarFora(
  aberto: boolean,
  aoFechar: () => void
): RefObject<HTMLDivElement | null> {
  const referencia = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!aberto) return

    const aoClicar = (evento: MouseEvent): void => {
      if (referencia.current && !referencia.current.contains(evento.target as Node)) aoFechar()
    }
    const aoApertarTecla = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') aoFechar()
    }

    document.addEventListener('mousedown', aoClicar)
    document.addEventListener('keydown', aoApertarTecla)
    return () => {
      document.removeEventListener('mousedown', aoClicar)
      document.removeEventListener('keydown', aoApertarTecla)
    }
  }, [aberto, aoFechar])

  return referencia
}
