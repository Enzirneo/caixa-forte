import { formatarCentavosComoReal } from '../dinheiro/formatarCentavos'
import type { Lancamento, NovoLancamento } from './tipos'

export interface DespesaReembolsavel {
  despesa: Lancamento
  reembolsavelCentavos: number
}

const ROTULO_DE_REEMBOLSO_SEM_DESPESA = 'Reembolso'

function somarReembolsosDaDespesa(
  lancamentos: Lancamento[],
  despesaId: number,
  reembolsoIgnoradoId?: number
): number {
  return lancamentos
    .filter(
      (lancamento) =>
        lancamento.tipo === 'reembolso' &&
        lancamento.reembolsoDeId === despesaId &&
        lancamento.id !== reembolsoIgnoradoId
    )
    .reduce((soma, lancamento) => soma + lancamento.valorCentavos, 0)
}

// Quanto ainda pode ser devolvido: o valor da despesa menos o que já foi reembolsado.
export function calcularValorReembolsavel(
  despesa: Lancamento,
  lancamentos: Lancamento[],
  reembolsoIgnoradoId?: number
): number {
  const reembolsado = somarReembolsosDaDespesa(lancamentos, despesa.id, reembolsoIgnoradoId)
  return Math.max(despesa.valorCentavos - reembolsado, 0)
}

export function listarDespesasReembolsaveis(
  lancamentos: Lancamento[],
  reembolsoIgnoradoId?: number
): DespesaReembolsavel[] {
  return lancamentos
    .filter((lancamento) => lancamento.tipo === 'despesa')
    .map((despesa) => ({
      despesa,
      reembolsavelCentavos: calcularValorReembolsavel(despesa, lancamentos, reembolsoIgnoradoId)
    }))
    .filter(({ reembolsavelCentavos }) => reembolsavelCentavos > 0)
    .sort((a, b) => b.despesa.data.localeCompare(a.despesa.data) || b.despesa.id - a.despesa.id)
}

function validarReembolsoDeUmaDespesa(
  novo: NovoLancamento,
  lancamentos: Lancamento[],
  reembolsoIgnoradoId?: number
): string[] {
  const despesa = lancamentos.find((lancamento) => lancamento.id === novo.reembolsoDeId)
  if (!despesa || despesa.tipo !== 'despesa') return ['Escolha uma despesa para ser reembolsada.']

  const reembolsavel = calcularValorReembolsavel(despesa, lancamentos, reembolsoIgnoradoId)
  if (novo.valorCentavos > reembolsavel) {
    return [
      `O reembolso passa do que falta devolver desta despesa (${formatarCentavosComoReal(reembolsavel)}).`
    ]
  }
  return []
}

function validarEdicaoDeDespesaReembolsada(
  novo: NovoLancamento,
  lancamentos: Lancamento[],
  despesaId: number
): string[] {
  const reembolsado = somarReembolsosDaDespesa(lancamentos, despesaId)
  if (novo.valorCentavos >= reembolsado) return []
  return [
    `O valor não pode ficar abaixo do que já foi reembolsado (${formatarCentavosComoReal(reembolsado)}).`
  ]
}

// `idEmEdicao` é o lançamento que está sendo alterado (ele não conta contra si mesmo).
export function validarReembolso(
  novo: NovoLancamento,
  lancamentos: Lancamento[],
  idEmEdicao?: number
): string[] {
  if (novo.tipo === 'reembolso') {
    return novo.reembolsoDeId == null
      ? []
      : validarReembolsoDeUmaDespesa(novo, lancamentos, idEmEdicao)
  }
  if (novo.reembolsoDeId != null) return ['Só um reembolso pode apontar para uma despesa.']
  if (novo.tipo === 'despesa' && idEmEdicao !== undefined) {
    return validarEdicaoDeDespesaReembolsada(novo, lancamentos, idEmEdicao)
  }
  return []
}

// Texto curto para a lista: na despesa mostra quanto já voltou; no reembolso, de qual despesa veio.
export function montarRotulosDeReembolso(lancamentos: Lancamento[]): Map<number, string> {
  const descricaoPorId = new Map(
    lancamentos.map((lancamento) => [lancamento.id, lancamento.descricao])
  )
  const rotulos = new Map<number, string>()

  for (const lancamento of lancamentos) {
    if (lancamento.tipo === 'reembolso') {
      const origem =
        lancamento.reembolsoDeId == null ? undefined : descricaoPorId.get(lancamento.reembolsoDeId)
      rotulos.set(
        lancamento.id,
        origem ? `${ROTULO_DE_REEMBOLSO_SEM_DESPESA} de ${origem}` : ROTULO_DE_REEMBOLSO_SEM_DESPESA
      )
    } else if (lancamento.tipo === 'despesa') {
      const reembolsado = somarReembolsosDaDespesa(lancamentos, lancamento.id)
      if (reembolsado > 0) {
        rotulos.set(lancamento.id, `Reembolsado ${formatarCentavosComoReal(reembolsado)}`)
      }
    }
  }
  return rotulos
}
