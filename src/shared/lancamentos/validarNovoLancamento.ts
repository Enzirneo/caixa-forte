import { ehDataIsoValida } from '../datas/dataIso'
import { TIPOS_LANCAMENTO, type NovoLancamento } from './tipos'

export function validarNovoLancamento(lancamento: NovoLancamento): string[] {
  const erros: string[] = []

  if (!lancamento.descricao.trim()) erros.push('Informe a descrição.')
  if (!Number.isInteger(lancamento.valorCentavos) || lancamento.valorCentavos <= 0) {
    erros.push('Informe um valor maior que zero.')
  }
  if (!ehDataIsoValida(lancamento.data)) erros.push('Informe uma data válida.')
  if (!TIPOS_LANCAMENTO.includes(lancamento.tipo))
    erros.push('Escolha receita, despesa ou reembolso.')
  if (!lancamento.categoria.trim()) erros.push('Informe a categoria.')

  return erros
}
