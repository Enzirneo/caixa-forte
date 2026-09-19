import type { TipoDeRecorrencia } from '../lancamentos/tipos'

export interface NovaRecorrencia {
  descricao: string
  valorCentavos: number
  tipo: TipoDeRecorrencia
  categoria: string
  diaDoMes: number
  mesDeInicio: string
  mesDeFim: string | null
  // Só para despesa: cada ocorrência vira uma compra neste cartão.
  cartaoId?: number | null
}

export interface RecorrenciaEditada extends NovaRecorrencia {
  id: number
}

export interface Recorrencia extends RecorrenciaEditada {
  ativa: boolean
}

// O que a pessoa escolhe ao marcar um lançamento como recorrente: até quando repete (nulo = até parar).
export interface DefinicaoDeRecorrencia {
  recorrente: boolean
  mesDeFim: string | null
}

export interface ApiRecorrencias {
  listar: () => Promise<Recorrencia[]>
  criar: (novaRecorrencia: NovaRecorrencia) => Promise<Recorrencia>
  atualizar: (recorrencia: RecorrenciaEditada) => Promise<void>
  definirAtiva: (id: number, ativa: boolean) => Promise<void>
  excluir: (id: number) => Promise<void>
  gerarPendentes: () => Promise<number>
  definirDoLancamento: (lancamentoId: number, definicao: DefinicaoDeRecorrencia) => Promise<void>
}
