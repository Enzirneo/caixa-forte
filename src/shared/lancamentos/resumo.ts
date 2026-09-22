import { obterMesDaData } from '../datas/mes'
import type { Lancamento } from './tipos'

export interface Resumo {
  receitasCentavos: number
  despesasCentavos: number
  saldoCentavos: number
}

export interface ResumoMensal extends Resumo {
  mes: string
}

export function calcularResumo(lancamentos: Lancamento[]): Resumo {
  let receitasCentavos = 0
  let despesasCentavos = 0
  for (const lancamento of lancamentos) {
    if (lancamento.tipo === 'receita') receitasCentavos += lancamento.valorCentavos
    else if (lancamento.tipo === 'despesa') despesasCentavos += lancamento.valorCentavos
    else despesasCentavos -= lancamento.valorCentavos
  }
  return { receitasCentavos, despesasCentavos, saldoCentavos: receitasCentavos - despesasCentavos }
}

export function filtrarPorMes(lancamentos: Lancamento[], mes: string): Lancamento[] {
  return lancamentos.filter((lancamento) => obterMesDaData(lancamento.data) === mes)
}

// Histórico é o que já aconteceu na conta corrente: um mês futuro só tem parcela de cartão ou
// recorrência já lançada adiantada, que é previsão e não histórico, então fica de fora até chegar.
export function resumirPorMes(lancamentos: Lancamento[], mesLimite?: string): ResumoMensal[] {
  const meses = new Set(lancamentos.map((lancamento) => obterMesDaData(lancamento.data)))
  return [...meses]
    .filter((mes) => mesLimite === undefined || mes <= mesLimite)
    .sort()
    .reverse()
    .map((mes) => ({ mes, ...calcularResumo(filtrarPorMes(lancamentos, mes)) }))
}
