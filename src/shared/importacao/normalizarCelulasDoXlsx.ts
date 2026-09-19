import type { CelulaDaPlanilha } from './tipos'

function normalizarCelula(celula: unknown): CelulaDaPlanilha {
  if (celula === null || celula === undefined) return null
  if (celula instanceof Date || typeof celula === 'string' || typeof celula === 'number') {
    return celula
  }
  return String(celula)
}

export function normalizarCelulasDoXlsx(linhas: unknown[][]): CelulaDaPlanilha[][] {
  return linhas.map((celulas) => celulas.map(normalizarCelula))
}
