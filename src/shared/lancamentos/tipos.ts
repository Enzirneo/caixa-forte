export const TIPOS_LANCAMENTO = ['receita', 'despesa'] as const

export type TipoLancamento = (typeof TIPOS_LANCAMENTO)[number]

export interface NovoLancamento {
  descricao: string
  valorCentavos: number
  data: string
  tipo: TipoLancamento
  categoria: string
}

export interface LancamentoEditado extends NovoLancamento {
  id: number
}

export interface Lancamento extends LancamentoEditado {
  alteradoEm: string
}

export interface ApiLancamentos {
  listar: () => Promise<Lancamento[]>
  criar: (novoLancamento: NovoLancamento) => Promise<Lancamento>
  atualizar: (lancamento: LancamentoEditado) => Promise<void>
  excluir: (id: number) => Promise<void>
}
