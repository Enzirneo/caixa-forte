import type { NovoLancamento } from '../lancamentos/tipos'

export type CelulaDaPlanilha = string | number | Date | null

export const CATEGORIA_PADRAO_DA_IMPORTACAO = 'Importado'

export interface LinhaInterpretada {
  numeroDaLinha: number
  textoOriginal: string
  lancamento: NovoLancamento | null
  erros: string[]
}

export interface ItemDaPrevia extends LinhaInterpretada {
  duplicada: boolean
}
