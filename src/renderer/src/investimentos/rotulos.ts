import type { TipoDestino, TipoMovimentacao } from '../../../shared/investimentos/tipos'

export const ROTULO_DO_TIPO_DE_DESTINO: Record<TipoDestino, string> = {
  investimento: 'Investimento',
  poupanca: 'Poupança',
  caixinha: 'Caixinha'
}

export const ROTULO_DO_TIPO_DE_MOVIMENTACAO: Record<TipoMovimentacao, string> = {
  aporte: 'Aporte',
  resgate: 'Resgate'
}
