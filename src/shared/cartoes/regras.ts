import { ehDataIsoValida } from '../datas/dataIso'
import { somarMeses } from '../datas/mes'
import type { NovoLancamento } from '../lancamentos/tipos'
import { calcularDataDaOcorrencia } from '../recorrencias/regras'
import {
  SEM_AJUSTES,
  calcularMesDoVencimentoDaFatura,
  type MelhoresDatasPorMes
} from './cicloDaFatura'
import type { Cartao, NovaCompraNoCartao, NovoCartao, RegraDoCiclo } from './tipos'

const PRIMEIRO_DIA = 1
const ULTIMO_DIA_POSSIVEL = 31
export const MAXIMO_DE_PARCELAS = 60
const MINIMO_DE_DIAS_ANTES = 1

export interface ParcelaDaCompra {
  lancamento: NovoLancamento
  parcelaNumero: number
  parcelasTotal: number
}

// Divide sem perder centavo: as primeiras parcelas levam o que sobra da divisão.
export function dividirEmParcelas(totalCentavos: number, quantidade: number): number[] {
  const base = Math.floor(totalCentavos / quantidade)
  const sobra = totalCentavos - base * quantidade
  return Array.from({ length: quantidade }, (_, indice) => base + (indice < sobra ? 1 : 0))
}

export function calcularMesDoVencimentoDaPrimeiraParcela(
  dataDaCompra: string,
  regra: RegraDoCiclo,
  ajustes: MelhoresDatasPorMes = SEM_AJUSTES
): string {
  return calcularMesDoVencimentoDaFatura(dataDaCompra, regra, ajustes)
}

export function calcularVencimentosDasParcelas(
  dataDaCompra: string,
  regra: RegraDoCiclo,
  quantidadeDeParcelas: number,
  ajustes: MelhoresDatasPorMes = SEM_AJUSTES
): string[] {
  const primeiroMes = calcularMesDoVencimentoDaPrimeiraParcela(dataDaCompra, regra, ajustes)
  return Array.from({ length: quantidadeDeParcelas }, (_, indice) =>
    calcularDataDaOcorrencia(somarMeses(primeiroMes, indice), regra.diaDeVencimento)
  )
}

export function montarParcelasDaCompra(
  compra: NovaCompraNoCartao,
  cartao: Cartao,
  ajustes: MelhoresDatasPorMes = SEM_AJUSTES
): ParcelaDaCompra[] {
  const valores = dividirEmParcelas(compra.valorTotalCentavos, compra.parcelas)
  const vencimentos = calcularVencimentosDasParcelas(
    compra.dataDaCompra,
    cartao,
    compra.parcelas,
    ajustes
  )

  return valores.map((valorCentavos, indice) => ({
    parcelaNumero: indice + 1,
    parcelasTotal: compra.parcelas,
    lancamento: {
      descricao:
        compra.parcelas > 1
          ? `${compra.descricao.trim()} (${indice + 1}/${compra.parcelas})`
          : compra.descricao.trim(),
      valorCentavos,
      data: vencimentos[indice],
      tipo: 'despesa',
      categoria: compra.categoria
    }
  }))
}

function diaEhValido(dia: number): boolean {
  return Number.isInteger(dia) && dia >= PRIMEIRO_DIA && dia <= ULTIMO_DIA_POSSIVEL
}

export function validarNovoCartao(cartao: NovoCartao): string[] {
  const erros: string[] = []

  if (!cartao.nome.trim()) erros.push('Informe o nome do cartão.')
  if (!diaEhValido(cartao.diaDeFechamento)) erros.push('O dia de fechamento deve ser de 1 a 31.')
  if (!diaEhValido(cartao.diaDeVencimento)) erros.push('O dia de vencimento deve ser de 1 a 31.')
  if (
    cartao.diasAntesDoVencimento !== null &&
    (!Number.isInteger(cartao.diasAntesDoVencimento) ||
      cartao.diasAntesDoVencimento < MINIMO_DE_DIAS_ANTES ||
      cartao.diasAntesDoVencimento > ULTIMO_DIA_POSSIVEL)
  ) {
    erros.push('Os dias entre o fechamento e o vencimento devem ser de 1 a 31.')
  }
  if (
    cartao.limiteCentavos !== null &&
    (!Number.isInteger(cartao.limiteCentavos) || cartao.limiteCentavos <= 0)
  ) {
    erros.push('O limite deve ser maior que zero.')
  }

  return erros
}

export function validarNovaCompra(compra: NovaCompraNoCartao): string[] {
  const erros: string[] = []

  if (!compra.descricao.trim()) erros.push('Informe a descrição.')
  if (!Number.isInteger(compra.valorTotalCentavos) || compra.valorTotalCentavos <= 0) {
    erros.push('Informe um valor maior que zero.')
  }
  if (
    !Number.isInteger(compra.parcelas) ||
    compra.parcelas < 1 ||
    compra.parcelas > MAXIMO_DE_PARCELAS
  ) {
    erros.push(`O número de parcelas deve ser de 1 a ${MAXIMO_DE_PARCELAS}.`)
  } else if (compra.valorTotalCentavos > 0 && compra.valorTotalCentavos < compra.parcelas) {
    erros.push('O valor é pequeno demais para tantas parcelas.')
  }
  if (!ehDataIsoValida(compra.dataDaCompra)) erros.push('Informe uma data válida.')
  if (!compra.categoria.trim()) erros.push('Informe a categoria.')

  return erros
}
