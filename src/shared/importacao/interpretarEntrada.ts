import { interpretarLinhaLivre } from './interpretarLinhaLivre'
import { interpretarLinhaTabular } from './interpretarLinhaTabular'
import type { CelulaDaPlanilha, LinhaInterpretada } from './tipos'

const SEPARADOR_DE_CELULAS_COLADAS = '\t'
const QUEBRA_DE_LINHA = /\r?\n/

function removerVazias(linhas: (LinhaInterpretada | null)[]): LinhaInterpretada[] {
  return linhas.filter((linha): linha is LinhaInterpretada => linha !== null)
}

export function interpretarTextoColado(texto: string, dataDoLote: string): LinhaInterpretada[] {
  const linhas = texto.split(QUEBRA_DE_LINHA).map((linha, indice) => {
    const numeroDaLinha = indice + 1
    if (!linha.trim()) return null
    return linha.includes(SEPARADOR_DE_CELULAS_COLADAS)
      ? interpretarLinhaTabular(
          linha.split(SEPARADOR_DE_CELULAS_COLADAS),
          numeroDaLinha,
          dataDoLote
        )
      : interpretarLinhaLivre(linha, numeroDaLinha, dataDoLote)
  })
  return removerVazias(linhas)
}

export function interpretarPlanilha(
  linhas: CelulaDaPlanilha[][],
  dataDoLote: string
): LinhaInterpretada[] {
  return removerVazias(
    linhas.map((celulas, indice) => interpretarLinhaTabular(celulas, indice + 1, dataDoLote))
  )
}
