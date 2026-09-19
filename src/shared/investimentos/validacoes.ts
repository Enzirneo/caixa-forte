import { ehDataIsoValida } from '../datas/dataIso'
import { existeResgateSemSaldo } from './rendimento'
import {
  PERIODICIDADES_DA_TAXA,
  TIPOS_DESTINO,
  TIPOS_MOVIMENTACAO,
  type Destino,
  type Movimentacao,
  type NovaMovimentacao,
  type NovoDestino
} from './tipos'

const ID_DA_MOVIMENTACAO_EM_VALIDACAO = -1

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
  destino: Destino,
  movimentacoesExistentes: Movimentacao[]
): string[] {
  const erros: string[] = []

  if (!TIPOS_MOVIMENTACAO.includes(movimentacao.tipo)) erros.push('Escolha aporte ou resgate.')
  if (!Number.isInteger(movimentacao.valorCentavos) || movimentacao.valorCentavos <= 0) {
    erros.push('Informe um valor maior que zero.')
  }
  if (!ehDataIsoValida(movimentacao.data)) erros.push('Informe uma data válida.')
  if (erros.length > 0) return erros

  const comAMovimentacaoNova = [
    ...movimentacoesExistentes,
    { ...movimentacao, id: ID_DA_MOVIMENTACAO_EM_VALIDACAO }
  ]
  if (existeResgateSemSaldo(destino, comAMovimentacaoNova)) {
    erros.push(
      'O destino não teria saldo suficiente para este resgate (ou para um resgate já registrado depois dele).'
    )
  }
  return erros
}

export function validarExclusaoDeMovimentacao(
  destinos: Destino[],
  movimentacoes: Movimentacao[],
  id: number
): string[] {
  const movimentacaoExcluida = movimentacoes.find((movimentacao) => movimentacao.id === id)
  if (!movimentacaoExcluida) return ['Movimentação não encontrada.']

  const destino = destinos.find((candidato) => candidato.id === movimentacaoExcluida.destinoId)
  if (!destino) return ['Destino não encontrado.']

  const restantes = movimentacoes.filter((movimentacao) => movimentacao.id !== id)
  if (existeResgateSemSaldo(destino, restantes)) {
    return [
      'Não dá para excluir: um resgate ficaria sem saldo suficiente. Exclua antes os resgates.'
    ]
  }
  return []
}
