export const TIPOS_DESTINO = ['investimento', 'poupanca', 'caixinha'] as const
export type TipoDestino = (typeof TIPOS_DESTINO)[number]

export const PERIODICIDADES_DA_TAXA = ['mensal', 'anual'] as const
export type PeriodicidadeDaTaxa = (typeof PERIODICIDADES_DA_TAXA)[number]

export const TIPOS_MOVIMENTACAO = ['aporte', 'resgate'] as const
export type TipoMovimentacao = (typeof TIPOS_MOVIMENTACAO)[number]

// Guardada como inteiro (1,05% = 105) para nunca usar número quebrado.
export const CENTESIMOS_POR_PERCENTUAL = 100

export interface NovoDestino {
  nome: string
  tipo: TipoDestino
  taxaRendimentoCentesimos: number | null
  periodicidadeDaTaxa: PeriodicidadeDaTaxa | null
}

export interface Destino extends NovoDestino {
  id: number
}

export interface NovaMovimentacao {
  destinoId: number
  tipo: TipoMovimentacao
  valorCentavos: number
  data: string
}

export interface Movimentacao extends NovaMovimentacao {
  id: number
}

export interface ApiInvestimentos {
  listarDestinos: () => Promise<Destino[]>
  criarDestino: (novoDestino: NovoDestino) => Promise<Destino>
  listarMovimentacoes: () => Promise<Movimentacao[]>
  criarMovimentacao: (novaMovimentacao: NovaMovimentacao) => Promise<Movimentacao>
  excluirMovimentacao: (id: number) => Promise<void>
}
