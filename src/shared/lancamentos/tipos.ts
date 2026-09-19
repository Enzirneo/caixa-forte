// Reembolso é o dinheiro de um gasto que voltou (alguém devolveu o que você pagou por ele): entra
// na conta, mas não é receita; abate a despesa.
export const TIPOS_LANCAMENTO = ['receita', 'despesa', 'reembolso'] as const

export type TipoLancamento = (typeof TIPOS_LANCAMENTO)[number]

// Recorrência é só receita ou despesa: reembolso é sempre avulso.
export const TIPOS_DE_RECORRENCIA = ['receita', 'despesa'] as const

export type TipoDeRecorrencia = (typeof TIPOS_DE_RECORRENCIA)[number]

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
  criarVarios: (novosLancamentos: NovoLancamento[]) => Promise<number>
  atualizar: (lancamento: LancamentoEditado) => Promise<void>
  excluir: (id: number) => Promise<void>
}
