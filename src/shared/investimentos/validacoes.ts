import { ehDataIsoValida } from '../datas/dataIso'
import { calcularSaldoDoDestino } from './calculos'
import {
  PERIODICIDADES_DA_TAXA,
  TIPOS_DESTINO,
  TIPOS_MOVIMENTACAO,
  type Movimentacao,
  type NovaMovimentacao,
  type NovoDestino
} from './tipos'

export function validarNovoDestino(destino: NovoDestino): string[] {
  const erros: string[] = []

  if (!destino.nome.trim()) erros.push('Informe o nome.')
  if (!TIPOS_DESTINO.includes(destino.tipo)) erros.push('Escolha o tipo.')

  const temTaxa = destino.taxaRendimentoCentesimos !== null
  const temPeriodicidade = destino.periodicidadeDaTaxa !== null
  if (temTaxa !== temPeriodicidade) {
    erros.push('Informe a taxa e se ela é mensal ou anual.')
  }
  if (
    destino.taxaRendimentoCentesimos !== null &&
    (!Number.isInteger(destino.taxaRendimentoCentesimos) || destino.taxaRendimentoCentesimos < 0)
  ) {
    erros.push('A taxa não pode ser negativa.')
  }
  if (
    destino.periodicidadeDaTaxa !== null &&
    !PERIODICIDADES_DA_TAXA.includes(destino.periodicidadeDaTaxa)
  ) {
    erros.push('Escolha se a taxa é mensal ou anual.')
  }

  return erros
}

export function validarNovaMovimentacao(
  movimentacao: NovaMovimentacao,
  saldoAtualDoDestinoCentavos: number
): string[] {
  const erros: string[] = []

  if (!TIPOS_MOVIMENTACAO.includes(movimentacao.tipo)) erros.push('Escolha aporte ou resgate.')
  if (!Number.isInteger(movimentacao.valorCentavos) || movimentacao.valorCentavos <= 0) {
    erros.push('Informe um valor maior que zero.')
  }
  if (!ehDataIsoValida(movimentacao.data)) erros.push('Informe uma data válida.')
  if (movimentacao.tipo === 'resgate' && movimentacao.valorCentavos > saldoAtualDoDestinoCentavos) {
    erros.push('O resgate é maior que o valor guardado neste destino.')
  }

  return erros
}

export function validarExclusaoDeMovimentacao(movimentacoes: Movimentacao[], id: number): string[] {
  const movimentacaoExcluida = movimentacoes.find((movimentacao) => movimentacao.id === id)
  if (!movimentacaoExcluida) return ['Movimentação não encontrada.']

  const restantes = movimentacoes.filter((movimentacao) => movimentacao.id !== id)
  const saldoRestante = calcularSaldoDoDestino(restantes, movimentacaoExcluida.destinoId)
  if (saldoRestante < 0) {
    return ['Não dá para excluir: o destino ficaria com saldo negativo. Exclua antes os resgates.']
  }
  return []
}
