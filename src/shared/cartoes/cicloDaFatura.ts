import { somarDias, calcularDiferencaEmDias } from '../datas/dataIso'
import { obterMesDaData, somarMeses } from '../datas/mes'
import { calcularDataDaOcorrencia } from '../recorrencias/regras'
import type { AjusteDeFechamento, RegraDoCiclo } from './tipos'

const POSICAO_DO_DIA_NA_DATA = 8
const MESES_ANTES_DA_COMPRA_NA_BUSCA = 1
const MESES_DEPOIS_DA_COMPRA_NA_BUSCA = 2
const MINIMO_DE_DIAS_ANTES_DO_VENCIMENTO = 1
const MAXIMO_DE_DIAS_ANTES_DO_VENCIMENTO = 31

export type MelhoresDatasPorMes = ReadonlyMap<string, string>

export const SEM_AJUSTES: MelhoresDatasPorMes = new Map()

export function indexarAjustesDoCartao(
  ajustes: AjusteDeFechamento[],
  cartaoId: number
): MelhoresDatasPorMes {
  return new Map(
    ajustes
      .filter((ajuste) => ajuste.cartaoId === cartaoId)
      .map((ajuste) => [ajuste.mesDoVencimento, ajuste.melhorDataDeCompra])
  )
}

function extrairDia(dataIso: string): number {
  return Number(dataIso.slice(POSICAO_DO_DIA_NA_DATA))
}

export function calcularDataDoVencimento(mesDoVencimento: string, regra: RegraDoCiclo): string {
  return calcularDataDaOcorrencia(mesDoVencimento, regra.diaDeVencimento)
}

// "Melhor data de compra" da fatura: o primeiro dia em que a compra já cai na fatura seguinte.
// Uma exceção cadastrada para o mês vale mais que a regra do cartão.
export function calcularMelhorDataDeCompra(
  mesDoVencimento: string,
  regra: RegraDoCiclo,
  ajustes: MelhoresDatasPorMes = SEM_AJUSTES
): string {
  const ajustada = ajustes.get(mesDoVencimento)
  if (ajustada) return ajustada

  if (regra.diasAntesDoVencimento !== null) {
    return somarDias(calcularDataDoVencimento(mesDoVencimento, regra), -regra.diasAntesDoVencimento)
  }

  const mesDoFechamento =
    regra.diaDeVencimento > regra.diaDeFechamento
      ? mesDoVencimento
      : somarMeses(mesDoVencimento, -1)
  return somarDias(calcularDataDaOcorrencia(mesDoFechamento, regra.diaDeFechamento), 1)
}

// A compra entra na primeira fatura cuja melhor data ainda não chegou.
export function calcularMesDoVencimentoDaFatura(
  dataDaCompra: string,
  regra: RegraDoCiclo,
  ajustes: MelhoresDatasPorMes = SEM_AJUSTES
): string {
  const mesDaCompra = obterMesDaData(dataDaCompra)
  const primeiroMes = somarMeses(mesDaCompra, -MESES_ANTES_DA_COMPRA_NA_BUSCA)
  const ultimoMes = somarMeses(mesDaCompra, MESES_DEPOIS_DA_COMPRA_NA_BUSCA)

  for (let mes = primeiroMes; mes < ultimoMes; mes = somarMeses(mes, 1)) {
    if (dataDaCompra < calcularMelhorDataDeCompra(mes, regra, ajustes)) return mes
  }
  return ultimoMes
}

export interface FaturaAberta {
  mesDoVencimento: string
  vencimento: string
  melhorDataDeCompra: string
}

export function calcularFaturaAberta(
  hojeIso: string,
  regra: RegraDoCiclo,
  ajustes: MelhoresDatasPorMes = SEM_AJUSTES
): FaturaAberta {
  const mesDoVencimento = calcularMesDoVencimentoDaFatura(hojeIso, regra, ajustes)
  return {
    mesDoVencimento,
    vencimento: calcularDataDoVencimento(mesDoVencimento, regra),
    melhorDataDeCompra: calcularMelhorDataDeCompra(mesDoVencimento, regra, ajustes)
  }
}

export type ModoDeFechamento = 'dias-antes-do-vencimento' | 'dia-fixo'

export interface DatasInformadas {
  vencimento: string
  melhorDataDeCompra: string
  modo: ModoDeFechamento
}

// A pessoa copia da fatura o vencimento e a melhor data de compra; daí saem os dias do cartão.
export function derivarRegraDoCiclo(informado: DatasInformadas): RegraDoCiclo {
  const ultimoDiaDoFechamento = somarDias(informado.melhorDataDeCompra, -1)
  return {
    diaDeVencimento: extrairDia(informado.vencimento),
    diaDeFechamento: extrairDia(ultimoDiaDoFechamento),
    diasAntesDoVencimento:
      informado.modo === 'dias-antes-do-vencimento'
        ? calcularDiferencaEmDias(informado.melhorDataDeCompra, informado.vencimento)
        : null
  }
}

export function validarDatasDoCiclo(informado: DatasInformadas): string[] {
  if (!informado.vencimento || !informado.melhorDataDeCompra) {
    return ['Informe o vencimento e a melhor data de compra da fatura.']
  }
  const distancia = calcularDiferencaEmDias(informado.melhorDataDeCompra, informado.vencimento)
  if (
    distancia < MINIMO_DE_DIAS_ANTES_DO_VENCIMENTO ||
    distancia > MAXIMO_DE_DIAS_ANTES_DO_VENCIMENTO
  ) {
    return ['A melhor data de compra deve ser de 1 a 31 dias antes do vencimento.']
  }
  return []
}

export function descreverRegraDoCiclo(regra: RegraDoCiclo): string {
  return regra.diasAntesDoVencimento !== null
    ? `Vence dia ${regra.diaDeVencimento} · fecha ${regra.diasAntesDoVencimento} dias antes`
    : `Vence dia ${regra.diaDeVencimento} · fecha todo dia ${regra.diaDeFechamento}`
}
