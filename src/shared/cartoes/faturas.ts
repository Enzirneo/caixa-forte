import { formatarDataIsoComoBrasileira } from '../datas/dataIso'
import { obterMesDaData } from '../datas/mes'
import type { Lancamento } from '../lancamentos/tipos'
import type { Cartao, VinculoDeCompra } from './tipos'

export interface Fatura {
  mes: string
  totalCentavos: number
  quantidadeDeItens: number
}

// Aberta: a que recebe as compras de hoje. Fechada: já não recebe compras, mas ainda não venceu.
export type SituacaoDaFatura = 'aberta' | 'fechada' | 'futura'

export interface LinhaDaFatura {
  mes: string
  vencimento: string
  situacao: SituacaoDaFatura
  lancadoCentavos: number
  previstoCentavos: number
  totalCentavos: number
}

interface DadosDoQuadroDeFaturas {
  faturas: Fatura[]
  previsoes: { mesDoVencimento: string; totalCentavos: number }[]
  mesDaFaturaAberta: string
  calcularVencimento: (mesDoVencimento: string) => string
  hojeIso: string
}

function classificarFatura(mes: string, mesDaFaturaAberta: string): SituacaoDaFatura {
  if (mes === mesDaFaturaAberta) return 'aberta'
  return mes < mesDaFaturaAberta ? 'fechada' : 'futura'
}

// As faturas que ainda não venceram: o que já foi lançado somado ao que as recorrências ainda vão
// cobrar até o fechamento. A aberta aparece sempre, mesmo vazia. Faturas futuras só aparecem se já
// têm compra de verdade (parcelas): a previsão de recorrência não vale para elas, porque uma
// fatura que ainda não abriu não é "cobrada" ainda.
export function montarQuadroDeFaturas({
  faturas,
  previsoes,
  mesDaFaturaAberta,
  calcularVencimento,
  hojeIso
}: DadosDoQuadroDeFaturas): LinhaDaFatura[] {
  const meses = new Set([
    mesDaFaturaAberta,
    ...faturas.map((fatura) => fatura.mes),
    ...previsoes.map((previsao) => previsao.mesDoVencimento)
  ])

  return [...meses]
    .sort()
    .map((mes) => {
      const situacao = classificarFatura(mes, mesDaFaturaAberta)
      const lancadoCentavos = faturas.find((fatura) => fatura.mes === mes)?.totalCentavos ?? 0
      const previstoCentavos =
        situacao === 'futura'
          ? 0
          : (previsoes.find((previsao) => previsao.mesDoVencimento === mes)?.totalCentavos ?? 0)
      return {
        mes,
        vencimento: calcularVencimento(mes),
        situacao,
        lancadoCentavos,
        previstoCentavos,
        totalCentavos: lancadoCentavos + previstoCentavos
      }
    })
    .filter((linha) => {
      if (linha.situacao === 'aberta') return true
      if (linha.situacao === 'futura') return linha.lancadoCentavos > 0
      return calcularVencimento(linha.mes) >= hojeIso
    })
}

export interface CompraAgrupada {
  grupoId: number
  cartaoId: number
  descricao: string
  totalCentavos: number
  parcelasTotal: number
  dataDaCompra: string
  primeiroVencimento: string
  ultimoVencimento: string
}

const SUFIXO_DE_PARCELA = / \(\d+\/\d+\)$/

interface LancamentoComVinculo {
  lancamento: Lancamento
  vinculo: VinculoDeCompra
}

function juntarLancamentosEVinculos(
  lancamentos: Lancamento[],
  vinculos: VinculoDeCompra[]
): LancamentoComVinculo[] {
  const lancamentoPorId = new Map(lancamentos.map((lancamento) => [lancamento.id, lancamento]))
  return vinculos.flatMap((vinculo) => {
    const lancamento = lancamentoPorId.get(vinculo.lancamentoId)
    return lancamento ? [{ lancamento, vinculo }] : []
  })
}

export function montarFaturas(
  lancamentos: Lancamento[],
  vinculos: VinculoDeCompra[],
  cartaoId: number
): Fatura[] {
  const porMes = new Map<string, Fatura>()
  for (const { lancamento } of juntarLancamentosEVinculos(
    lancamentos,
    vinculos.filter((vinculo) => vinculo.cartaoId === cartaoId)
  )) {
    const mes = obterMesDaData(lancamento.data)
    const atual = porMes.get(mes) ?? { mes, totalCentavos: 0, quantidadeDeItens: 0 }
    porMes.set(mes, {
      mes,
      totalCentavos: atual.totalCentavos + lancamento.valorCentavos,
      quantidadeDeItens: atual.quantidadeDeItens + 1
    })
  }
  return [...porMes.values()].sort((a, b) => a.mes.localeCompare(b.mes))
}

// O que ainda vai sair da conta: parcelas com vencimento depois de hoje.
export function calcularComprometidoNoCartao(
  lancamentos: Lancamento[],
  vinculos: VinculoDeCompra[],
  cartaoId: number,
  hojeIso: string
): number {
  return juntarLancamentosEVinculos(
    lancamentos,
    vinculos.filter((vinculo) => vinculo.cartaoId === cartaoId)
  )
    .filter(({ lancamento }) => lancamento.data > hojeIso)
    .reduce((total, { lancamento }) => total + lancamento.valorCentavos, 0)
}

export interface CompraParcelada {
  grupoId: number
  descricao: string
  cartaoNome: string
  parcelasTotal: number
  parcelasPagas: number
  valorDaParcelaCentavos: number
  proximoVencimento: string | null
  restanteCentavos: number
}

// Compras parceladas que ainda têm parcela a vencer, da que vence antes para a que vence depois.
export function resumirComprasParceladas(
  lancamentos: Lancamento[],
  vinculos: VinculoDeCompra[],
  cartoes: Cartao[],
  hojeIso: string
): CompraParcelada[] {
  const nomePorCartao = new Map(cartoes.map((cartao) => [cartao.id, cartao.nome]))

  return agruparComprasPorGrupo(lancamentos, vinculos)
    .filter((compra) => compra.parcelasTotal > 1)
    .flatMap((compra) => {
      const parcelas = juntarLancamentosEVinculos(
        lancamentos,
        vinculos.filter((vinculo) => vinculo.grupoId === compra.grupoId)
      )
        .map(({ lancamento }) => lancamento)
        .sort((a, b) => a.data.localeCompare(b.data))
      const aVencer = parcelas.filter((parcela) => parcela.data > hojeIso)
      if (aVencer.length === 0) return []

      return [
        {
          grupoId: compra.grupoId,
          descricao: compra.descricao,
          cartaoNome: nomePorCartao.get(compra.cartaoId) ?? 'Cartão',
          parcelasTotal: compra.parcelasTotal,
          parcelasPagas: parcelas.length - aVencer.length,
          valorDaParcelaCentavos: parcelas[parcelas.length - 1].valorCentavos,
          proximoVencimento: aVencer[0].data,
          restanteCentavos: aVencer.reduce((soma, parcela) => soma + parcela.valorCentavos, 0)
        }
      ]
    })
    .sort((a, b) => (a.proximoVencimento ?? '').localeCompare(b.proximoVencimento ?? ''))
}

export function agruparComprasPorGrupo(
  lancamentos: Lancamento[],
  vinculos: VinculoDeCompra[]
): CompraAgrupada[] {
  const grupos = new Map<number, LancamentoComVinculo[]>()
  for (const item of juntarLancamentosEVinculos(lancamentos, vinculos)) {
    grupos.set(item.vinculo.grupoId, [...(grupos.get(item.vinculo.grupoId) ?? []), item])
  }

  return [...grupos.entries()]
    .map(([grupoId, itens]) => {
      const ordenados = [...itens].sort((a, b) =>
        a.lancamento.data.localeCompare(b.lancamento.data)
      )
      const primeiro = ordenados[0]
      return {
        grupoId,
        cartaoId: primeiro.vinculo.cartaoId,
        descricao: primeiro.lancamento.descricao.replace(SUFIXO_DE_PARCELA, ''),
        totalCentavos: ordenados.reduce(
          (soma, { lancamento }) => soma + lancamento.valorCentavos,
          0
        ),
        parcelasTotal: primeiro.vinculo.parcelasTotal,
        dataDaCompra: primeiro.vinculo.dataDaCompra,
        primeiroVencimento: primeiro.lancamento.data,
        ultimoVencimento: ordenados[ordenados.length - 1].lancamento.data
      }
    })
    .sort((a, b) => b.dataDaCompra.localeCompare(a.dataDaCompra) || b.grupoId - a.grupoId)
}

// Texto curto para mostrar na lista de lançamentos, ex.: "Nubank · 3/10 · compra em 15/08/2026".
export function montarRotulosDeCompra(
  vinculos: VinculoDeCompra[],
  cartoes: Cartao[]
): Map<number, string> {
  const nomePorCartao = new Map(cartoes.map((cartao) => [cartao.id, cartao.nome]))
  return new Map(
    vinculos.map((vinculo) => {
      const parcela =
        vinculo.parcelasTotal > 1 ? ` · ${vinculo.parcelaNumero}/${vinculo.parcelasTotal}` : ''
      return [
        vinculo.lancamentoId,
        `${nomePorCartao.get(vinculo.cartaoId) ?? 'Cartão'}${parcela} · compra em ${formatarDataIsoComoBrasileira(vinculo.dataDaCompra)}`
      ]
    })
  )
}
