import { gerarChaveDaCategoria } from '../categorias/nomeDaCategoria'
import type { Lancamento, TipoLancamento } from './tipos'

export type OrdenacaoDeLancamentos =
  'data-desc' | 'data-asc' | 'valor-desc' | 'valor-asc' | 'categoria-asc' | 'categoria-desc'

export interface FiltroDeLancamentos {
  texto: string
  categoria: string | null
  tipo: TipoLancamento | 'todos'
  valorMinimoCentavos: number | null
  valorMaximoCentavos: number | null
  ordenacao: OrdenacaoDeLancamentos
}

export const FILTRO_PADRAO_DE_LANCAMENTOS: FiltroDeLancamentos = {
  texto: '',
  categoria: null,
  tipo: 'todos',
  valorMinimoCentavos: null,
  valorMaximoCentavos: null,
  ordenacao: 'data-desc'
}

// A ordenação sozinha não conta como filtro: ela só muda a ordem, não esconde nada.
export function filtroEstaAtivo(filtro: FiltroDeLancamentos): boolean {
  return (
    filtro.texto.trim() !== '' ||
    filtro.categoria !== null ||
    filtro.tipo !== 'todos' ||
    filtro.valorMinimoCentavos !== null ||
    filtro.valorMaximoCentavos !== null
  )
}

function comparar(ordenacao: OrdenacaoDeLancamentos): (a: Lancamento, b: Lancamento) => number {
  const dataDesc = (a: Lancamento, b: Lancamento): number =>
    b.data.localeCompare(a.data) || b.id - a.id
  const dataAsc = (a: Lancamento, b: Lancamento): number =>
    a.data.localeCompare(b.data) || a.id - b.id

  if (ordenacao === 'data-asc') return dataAsc
  if (ordenacao === 'categoria-asc')
    return (a, b) => a.categoria.localeCompare(b.categoria, 'pt-BR') || dataDesc(a, b)
  if (ordenacao === 'categoria-desc')
    return (a, b) => b.categoria.localeCompare(a.categoria, 'pt-BR') || dataDesc(a, b)
  if (ordenacao === 'valor-desc')
    return (a, b) => b.valorCentavos - a.valorCentavos || dataDesc(a, b)
  if (ordenacao === 'valor-asc')
    return (a, b) => a.valorCentavos - b.valorCentavos || dataDesc(a, b)
  return dataDesc
}

function passaNoFiltro(lancamento: Lancamento, filtro: FiltroDeLancamentos): boolean {
  if (filtro.tipo !== 'todos' && lancamento.tipo !== filtro.tipo) return false
  if (
    filtro.categoria !== null &&
    gerarChaveDaCategoria(lancamento.categoria) !== gerarChaveDaCategoria(filtro.categoria)
  ) {
    return false
  }
  if (
    filtro.valorMinimoCentavos !== null &&
    lancamento.valorCentavos < filtro.valorMinimoCentavos
  ) {
    return false
  }
  if (
    filtro.valorMaximoCentavos !== null &&
    lancamento.valorCentavos > filtro.valorMaximoCentavos
  ) {
    return false
  }

  const busca = gerarChaveDaCategoria(filtro.texto)
  if (busca === '') return true
  return (
    gerarChaveDaCategoria(lancamento.descricao).includes(busca) ||
    gerarChaveDaCategoria(lancamento.categoria).includes(busca)
  )
}

export function aplicarFiltroDeLancamentos(
  lancamentos: Lancamento[],
  filtro: FiltroDeLancamentos
): Lancamento[] {
  return lancamentos
    .filter((lancamento) => passaNoFiltro(lancamento, filtro))
    .sort(comparar(filtro.ordenacao))
}
