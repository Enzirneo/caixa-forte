import { obterDataIsoEmUtc } from './dataIso'
import { obterUltimoDiaDoMes } from './mes'

export interface DiaDoCalendario {
  dataIso: string
  diaDoMes: number
  doMesExibido: boolean
}

export const DIAS_DA_SEMANA_ABREVIADOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const DIAS_POR_SEMANA = 7
const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000

function paraUtc(dataIso: string): number {
  const [ano, mes, dia] = dataIso.split('-').map(Number)
  return Date.UTC(ano, mes - 1, dia)
}

// Semanas começando no domingo, como no calendário brasileiro. Completa com os dias do mês
// anterior e do seguinte, para a última semana não ficar pela metade.
export function montarGradeDoMes(mes: string): DiaDoCalendario[][] {
  const primeiroDia = paraUtc(`${mes}-01`)
  const ultimoDia = paraUtc(obterUltimoDiaDoMes(mes))
  const diaDaSemanaDoPrimeiro = new Date(primeiroDia).getUTCDay()
  const inicioDaGrade = primeiroDia - diaDaSemanaDoPrimeiro * MILISSEGUNDOS_POR_DIA

  const semanas: DiaDoCalendario[][] = []
  for (let inicioDaSemana = inicioDaGrade; inicioDaSemana <= ultimoDia;) {
    const semana: DiaDoCalendario[] = []
    for (let indice = 0; indice < DIAS_POR_SEMANA; indice++) {
      const dia = new Date(inicioDaSemana)
      const dataIso = obterDataIsoEmUtc(dia)
      semana.push({
        dataIso,
        diaDoMes: dia.getUTCDate(),
        doMesExibido: dataIso.startsWith(mes)
      })
      inicioDaSemana += MILISSEGUNDOS_POR_DIA
    }
    semanas.push(semana)
  }
  return semanas
}
