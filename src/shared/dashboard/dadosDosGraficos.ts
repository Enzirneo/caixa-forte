import { obterUltimoDiaDoMes, obterMesDaData, somarMeses } from '../datas/mes'
import { gerarChaveDaCategoria } from '../categorias/nomeDaCategoria'
import { calcularPatrimonio } from '../investimentos/rendimento'
import type { Destino, Movimentacao } from '../investimentos/tipos'
import { calcularResumo, filtrarPorMes } from '../lancamentos/resumo'
import type { Lancamento } from '../lancamentos/tipos'

export const ROTULO_DE_OUTRAS_CATEGORIAS = 'Outras'
export const LIMITE_PADRAO_DE_CATEGORIAS = 5
const PERMILAGEM_TOTAL = 1000
const PERCENTUAL_TOTAL = 100

export interface PontoMensal {
  mes: string
  receitasCentavos: number
  despesasCentavos: number
}

export interface PontoDoPatrimonio {
  mes: string
  saldoEstimadoCentavos: number
}

export interface FatiaDeCategoria {
  categoria: string
  valorCentavos: number
  permilagem: number
}

export function listarUltimosMeses(mesFinal: string, quantidade: number): string[] {
  return Array.from({ length: quantidade }, (_, indice) =>
    somarMeses(mesFinal, indice - (quantidade - 1))
  )
}

export function montarSerieMensal(
  lancamentos: Lancamento[],
  mesFinal: string,
  quantidade: number
): PontoMensal[] {
  return listarUltimosMeses(mesFinal, quantidade).map((mes) => {
    const { receitasCentavos, despesasCentavos } = calcularResumo(filtrarPorMes(lancamentos, mes))
    return { mes, receitasCentavos, despesasCentavos }
  })
}

export function montarSerieDoPatrimonio(
  destinos: Destino[],
  movimentacoes: Movimentacao[],
  mesFinal: string,
  quantidade: number,
  hojeIso: string
): PontoDoPatrimonio[] {
  return listarUltimosMeses(mesFinal, quantidade).map((mes) => {
    const fimDoMes = obterUltimoDiaDoMes(mes)
    const dataDeReferencia = fimDoMes < hojeIso ? fimDoMes : hojeIso
    const { saldoEstimadoCentavos } = calcularPatrimonio(destinos, movimentacoes, dataDeReferencia)
    return { mes, saldoEstimadoCentavos }
  })
}

export function calcularVariacaoPercentual(atual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return Math.round(((atual - anterior) / Math.abs(anterior)) * PERCENTUAL_TOTAL)
}

export function calcularPercentualQueSobrou(
  receitasCentavos: number,
  despesasCentavos: number
): number | null {
  if (receitasCentavos <= 0) return null
  return Math.round(((receitasCentavos - despesasCentavos) / receitasCentavos) * PERCENTUAL_TOTAL)
}

function somarDespesasPorCategoria(lancamentos: Lancamento[]): Map<string, FatiaDeCategoria> {
  const porChave = new Map<string, FatiaDeCategoria>()
  for (const lancamento of lancamentos) {
    if (lancamento.tipo === 'receita') continue

    const chave = gerarChaveDaCategoria(lancamento.categoria)
    const atual = porChave.get(chave)
    const variacao =
      lancamento.tipo === 'despesa' ? lancamento.valorCentavos : -lancamento.valorCentavos
    porChave.set(chave, {
      categoria: atual?.categoria ?? lancamento.categoria,
      valorCentavos: (atual?.valorCentavos ?? 0) + variacao,
      permilagem: 0
    })
  }
  // Categoria totalmente reembolsada não gastou nada: sai do gráfico.
  for (const [chave, fatia] of porChave) {
    if (fatia.valorCentavos <= 0) porChave.delete(chave)
  }
  return porChave
}

export function agruparDespesasPorCategoria(
  lancamentos: Lancamento[],
  mes: string,
  limite: number = LIMITE_PADRAO_DE_CATEGORIAS
): FatiaDeCategoria[] {
  const doMes = lancamentos.filter((lancamento) => obterMesDaData(lancamento.data) === mes)
  const ordenadas = [...somarDespesasPorCategoria(doMes).values()].sort(
    (a, b) => b.valorCentavos - a.valorCentavos
  )
  const total = ordenadas.reduce((soma, fatia) => soma + fatia.valorCentavos, 0)
  if (total === 0) return []

  const principais = ordenadas.slice(0, limite)
  const restantes = ordenadas.slice(limite)
  const fatias =
    restantes.length === 0
      ? principais
      : [
          ...principais,
          {
            categoria: ROTULO_DE_OUTRAS_CATEGORIAS,
            valorCentavos: restantes.reduce((soma, fatia) => soma + fatia.valorCentavos, 0),
            permilagem: 0
          }
        ]

  return fatias.map((fatia) => ({
    ...fatia,
    permilagem: Math.round((fatia.valorCentavos * PERMILAGEM_TOTAL) / total)
  }))
}
