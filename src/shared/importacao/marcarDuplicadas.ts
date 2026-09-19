import type { Lancamento, NovoLancamento } from '../lancamentos/tipos'
import type { ItemDaPrevia, LinhaInterpretada } from './tipos'

function normalizarDescricao(descricao: string): string {
  return descricao
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function ehMesmoLancamento(novo: NovoLancamento, existente: Lancamento): boolean {
  return (
    novo.data === existente.data &&
    novo.valorCentavos === existente.valorCentavos &&
    novo.tipo === existente.tipo &&
    normalizarDescricao(novo.descricao) === normalizarDescricao(existente.descricao)
  )
}

export function marcarDuplicadas(
  linhas: LinhaInterpretada[],
  lancamentosExistentes: Lancamento[]
): ItemDaPrevia[] {
  return linhas.map((linha) => ({
    ...linha,
    duplicada:
      linha.lancamento !== null &&
      lancamentosExistentes.some((existente) =>
        ehMesmoLancamento(linha.lancamento as NovoLancamento, existente)
      )
  }))
}
