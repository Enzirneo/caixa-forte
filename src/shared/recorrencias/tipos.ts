import type { TipoLancamento } from '../lancamentos/tipos'

export interface NovaRecorrencia {
  descricao: string
  valorCentavos: number
  tipo: TipoLancamento
  categoria: string
  diaDoMes: number
  mesDeInicio: string
  mesDeFim: string | null
}

export interface RecorrenciaEditada extends NovaRecorrencia {
  id: number
}

export interface Recorrencia extends RecorrenciaEditada {
  ativa: boolean
}

export interface ApiRecorrencias {
  listar: () => Promise<Recorrencia[]>
  criar: (novaRecorrencia: NovaRecorrencia) => Promise<Recorrencia>
  atualizar: (recorrencia: RecorrenciaEditada) => Promise<void>
  definirAtiva: (id: number, ativa: boolean) => Promise<void>
  excluir: (id: number) => Promise<void>
  gerarPendentes: () => Promise<number>
}
