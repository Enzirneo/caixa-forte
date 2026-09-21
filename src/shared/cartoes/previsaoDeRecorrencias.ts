import { obterMesDaData, somarMeses } from '../datas/mes'
import { calcularDataDaOcorrencia } from '../recorrencias/regras'
import type { Recorrencia } from '../recorrencias/tipos'
import { calcularMesDoVencimentoDaFatura, indexarAjustesDoCartao } from './cicloDaFatura'
import type { AjusteDeFechamento, Cartao } from './tipos'

const MESES_PROJETADOS_A_FRENTE = 4

export interface PrevisaoDeFatura {
  mesDoVencimento: string
  totalCentavos: number
}

function estaNoPeriodo(recorrencia: Recorrencia, mes: string): boolean {
  return (
    mes >= recorrencia.mesDeInicio && (recorrencia.mesDeFim === null || mes <= recorrencia.mesDeFim)
  )
}

// Em qual fatura cai cada cobrança que ainda vai acontecer: a de dia 26 com fechamento no dia 25 cai
// na fatura seguinte à que está aberta. Só olha alguns meses à frente.
export function projetarFaturasDasRecorrencias(
  recorrencias: Recorrencia[],
  cartao: Cartao,
  ajustes: AjusteDeFechamento[],
  hojeIso: string
): PrevisaoDeFatura[] {
  const ajustesDoCartao = indexarAjustesDoCartao(ajustes, cartao.id)
  const mesAtual = obterMesDaData(hojeIso)
  const totalPorFatura = new Map<string, number>()

  for (const recorrencia of recorrencias) {
    if (recorrencia.cartaoId !== cartao.id || !recorrencia.ativa) continue

    for (let indice = 0; indice <= MESES_PROJETADOS_A_FRENTE; indice++) {
      const mes = somarMeses(mesAtual, indice)
      if (!estaNoPeriodo(recorrencia, mes)) continue

      const dataDaCobranca = calcularDataDaOcorrencia(mes, recorrencia.diaDoMes)
      if (dataDaCobranca <= hojeIso) continue

      const fatura = calcularMesDoVencimentoDaFatura(dataDaCobranca, cartao, ajustesDoCartao)
      totalPorFatura.set(fatura, (totalPorFatura.get(fatura) ?? 0) + recorrencia.valorCentavos)
    }
  }

  return [...totalPorFatura.entries()]
    .map(([mesDoVencimento, totalCentavos]) => ({ mesDoVencimento, totalCentavos }))
    .sort((a, b) => a.mesDoVencimento.localeCompare(b.mesDoVencimento))
}
