export interface FechamentoMes {
  mes: string
  fechadoEm: string
  receitasCentavos: number
  despesasCentavos: number
}

export interface ApiFechamentos {
  listar: () => Promise<FechamentoMes[]>
  fecharMesesEncerrados: () => Promise<void>
  refazer: (mes: string) => Promise<void>
}
