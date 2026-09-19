export interface FechamentoMes {
  mes: string
  fechadoEm: string
  receitasCentavos: number
  despesasCentavos: number
}

export interface ApiFechamentos {
  listar: () => Promise<FechamentoMes[]>
  fechar: (mes: string) => Promise<void>
  reabrir: (mes: string) => Promise<void>
}
