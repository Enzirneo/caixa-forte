import { obterMesDaData, obterUltimoDiaDoMes, somarMeses } from '../datas/mes'
import { TIPOS_DE_RECORRENCIA } from '../lancamentos/tipos'
import type { NovaRecorrencia } from './tipos'

const PADRAO_MES = /^\d{4}-(0[1-9]|1[0-2])$/
const PRIMEIRO_DIA_DO_MES = 1
const ULTIMO_DIA_POSSIVEL_DO_MES = 31
const TAMANHO_DO_DIA = 2
const POSICAO_DO_DIA_NA_DATA = 8

type PeriodoDaRecorrencia = Pick<NovaRecorrencia, 'diaDoMes' | 'mesDeInicio' | 'mesDeFim'>

// Dia 31 num mês curto cai no último dia dele (aluguel do dia 31 vence dia 28 em fevereiro).
export function calcularDataDaOcorrencia(mes: string, diaDoMes: number): string {
  const ultimoDia = obterUltimoDiaDoMes(mes)
  const diaLimite = Number(ultimoDia.slice(POSICAO_DO_DIA_NA_DATA))
  return `${mes}-${String(Math.min(diaDoMes, diaLimite)).padStart(TAMANHO_DO_DIA, '0')}`
}

function listarMesesDoPeriodo(periodo: PeriodoDaRecorrencia, mesLimite: string): string[] {
  const meses: string[] = []
  const ultimoMes =
    periodo.mesDeFim !== null && periodo.mesDeFim < mesLimite ? periodo.mesDeFim : mesLimite
  for (let mes = periodo.mesDeInicio; mes <= ultimoMes; mes = somarMeses(mes, 1)) {
    meses.push(mes)
  }
  return meses
}

// Só o que já venceu: a ocorrência de um dia que ainda não chegou espera a data.
export function listarCompetenciasVencidas(
  periodo: PeriodoDaRecorrencia,
  hojeIso: string
): string[] {
  return listarMesesDoPeriodo(periodo, obterMesDaData(hojeIso)).filter(
    (mes) => calcularDataDaOcorrencia(mes, periodo.diaDoMes) <= hojeIso
  )
}

export function calcularProximaOcorrencia(
  periodo: PeriodoDaRecorrencia,
  hojeIso: string
): string | null {
  const mesInicialDaBusca =
    periodo.mesDeInicio > obterMesDaData(hojeIso) ? periodo.mesDeInicio : obterMesDaData(hojeIso)

  const limiteDaBusca = periodo.mesDeFim ?? somarMeses(mesInicialDaBusca, 1)

  for (let mes = mesInicialDaBusca; mes <= limiteDaBusca; mes = somarMeses(mes, 1)) {
    const data = calcularDataDaOcorrencia(mes, periodo.diaDoMes)
    if (data > hojeIso) return data
  }
  return null
}

// Ao transformar um lançamento em recorrente, o próprio lançamento já vale como a ocorrência do
// mês dele. A regra começa no mês seguinte e nunca em meses passados, para não duplicar o que a
// pessoa já lançou à mão.
export function calcularMesDeInicioAPartirDoLancamento(
  dataDoLancamento: string,
  hojeIso: string
): string {
  const mesDepoisDoLancamento = somarMeses(obterMesDaData(dataDoLancamento), 1)
  const mesDepoisDeHoje = somarMeses(obterMesDaData(hojeIso), 1)
  return mesDepoisDoLancamento > mesDepoisDeHoje ? mesDepoisDoLancamento : mesDepoisDeHoje
}

export function validarNovaRecorrencia(recorrencia: NovaRecorrencia): string[] {
  const erros: string[] = []

  if (!recorrencia.descricao.trim()) erros.push('Informe a descrição.')
  if (!Number.isInteger(recorrencia.valorCentavos) || recorrencia.valorCentavos <= 0) {
    erros.push('Informe um valor maior que zero.')
  }
  if (!TIPOS_DE_RECORRENCIA.includes(recorrencia.tipo)) erros.push('Escolha receita ou despesa.')
  if (!recorrencia.categoria.trim()) erros.push('Informe a categoria.')
  if (recorrencia.cartaoId != null && recorrencia.tipo !== 'despesa') {
    erros.push('Só uma despesa pode ser de um cartão de crédito.')
  }
  if (
    !Number.isInteger(recorrencia.diaDoMes) ||
    recorrencia.diaDoMes < PRIMEIRO_DIA_DO_MES ||
    recorrencia.diaDoMes > ULTIMO_DIA_POSSIVEL_DO_MES
  ) {
    erros.push('O dia do mês deve estar entre 1 e 31.')
  }
  if (!PADRAO_MES.test(recorrencia.mesDeInicio)) erros.push('Informe o mês em que começa.')
  if (recorrencia.mesDeFim !== null) {
    if (!PADRAO_MES.test(recorrencia.mesDeFim)) erros.push('Informe um mês de término válido.')
    else if (recorrencia.mesDeFim < recorrencia.mesDeInicio) {
      erros.push('O mês de término não pode ser antes do início.')
    }
  }

  return erros
}
