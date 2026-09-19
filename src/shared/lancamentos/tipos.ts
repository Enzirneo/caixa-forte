export const TIPOS_LANCAMENTO = ['receita', 'despesa'] as const

export type TipoLancamento = (typeof TIPOS_LANCAMENTO)[number]

export interface NovoLancamento {
  descricao: string
  valorCentavos: number
  data: string
  tipo: TipoLancamento
  categoria: string
}

export interface Lancamento extends NovoLancamento {
  id: number
}

export interface ApiLancamentos {
  listar: () => Promise<Lancamento[]>
  criar: (novoLancamento: NovoLancamento) => Promise<Lancamento>
  atualizar: (lancamento: Lancamento) => Promise<void>
  excluir: (id: number) => Promise<void>
}
