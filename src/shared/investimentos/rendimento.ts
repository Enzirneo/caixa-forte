import { CENTESIMOS_POR_PERCENTUAL, type Destino, type Movimentacao } from './tipos'

const DIAS_DO_MES_COMERCIAL = 30
const DIAS_DO_ANO_COMERCIAL = 365
const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000
const CEM_PERCENTO = 100

type TaxaDoDestino = Pick<Destino, 'taxaRendimentoCentesimos' | 'periodicidadeDaTaxa'>

export interface PosicaoDoDestino {
  aplicadoCentavos: number
  saldoEstimadoCentavos: number
  rendimentoEstimadoCentavos: number
}

interface ResultadoDaSimulacao {
  saldoCentavos: number
  existeResgateSemSaldo: boolean
}

function converterDataIsoEmMilissegundos(dataIso: string): number {
  const [ano, mes, dia] = dataIso.split('-').map(Number)
  return Date.UTC(ano, mes - 1, dia)
}

function contarDiasEntre(dataInicialIso: string, dataFinalIso: string): number {
  const diferenca =
    converterDataIsoEmMilissegundos(dataFinalIso) - converterDataIsoEmMilissegundos(dataInicialIso)
  return Math.round(diferenca / MILISSEGUNDOS_POR_DIA)
}

// A potência fracionária exige número quebrado; o resultado é sempre arredondado para
// centavos inteiros antes de sair daqui, e nenhum valor quebrado é guardado.
function calcularFatorDeCrescimento(taxa: TaxaDoDestino, dias: number): number {
  if (taxa.taxaRendimentoCentesimos === null || taxa.periodicidadeDaTaxa === null) return 1

  const taxaDecimal = taxa.taxaRendimentoCentesimos / (CENTESIMOS_POR_PERCENTUAL * CEM_PERCENTO)
  const diasDoPeriodo =
    taxa.periodicidadeDaTaxa === 'mensal' ? DIAS_DO_MES_COMERCIAL : DIAS_DO_ANO_COMERCIAL
  return (1 + taxaDecimal) ** (dias / diasDoPeriodo)
}

function ordenarCronologicamente(movimentacoes: Movimentacao[]): Movimentacao[] {
  const ordemDoTipo = { aporte: 0, resgate: 1 }
  return [...movimentacoes].sort(
    (a, b) =>
      a.data.localeCompare(b.data) || ordemDoTipo[a.tipo] - ordemDoTipo[b.tipo] || a.id - b.id
  )
}

function simularSaldo(
  destino: TaxaDoDestino,
  movimentacoes: Movimentacao[],
  dataFinalIso: string
): ResultadoDaSimulacao {
  let saldo = 0
  let existeResgateSemSaldo = false
  let dataDoSaldo = dataFinalIso

  for (const movimentacao of ordenarCronologicamente(movimentacoes)) {
    if (saldo !== 0) {
      saldo *= calcularFatorDeCrescimento(destino, contarDiasEntre(dataDoSaldo, movimentacao.data))
    }
    dataDoSaldo = movimentacao.data

    if (movimentacao.tipo === 'aporte') {
      saldo += movimentacao.valorCentavos
    } else {
      if (Math.round(saldo) < movimentacao.valorCentavos) existeResgateSemSaldo = true
      saldo -= movimentacao.valorCentavos
    }
  }

  if (saldo !== 0) {
    saldo *= calcularFatorDeCrescimento(destino, contarDiasEntre(dataDoSaldo, dataFinalIso))
  }
  return { saldoCentavos: Math.round(saldo), existeResgateSemSaldo }
}

function selecionarMovimentacoesDoDestinoAte(
  movimentacoes: Movimentacao[],
  destinoId: number,
  dataFinalIso: string
): Movimentacao[] {
  return movimentacoes.filter(
    (movimentacao) => movimentacao.destinoId === destinoId && movimentacao.data <= dataFinalIso
  )
}

export function calcularPosicaoDoDestino(
  destino: Destino,
  movimentacoes: Movimentacao[],
  dataFinalIso: string
): PosicaoDoDestino {
  const doDestino = selecionarMovimentacoesDoDestinoAte(movimentacoes, destino.id, dataFinalIso)
  const aplicadoCentavos = doDestino.reduce(
    (total, movimentacao) =>
      movimentacao.tipo === 'aporte'
        ? total + movimentacao.valorCentavos
        : total - movimentacao.valorCentavos,
    0
  )
  const { saldoCentavos } = simularSaldo(destino, doDestino, dataFinalIso)

  return {
    aplicadoCentavos,
    saldoEstimadoCentavos: saldoCentavos,
    rendimentoEstimadoCentavos: saldoCentavos - aplicadoCentavos
  }
}

export function calcularPatrimonio(
  destinos: Destino[],
  movimentacoes: Movimentacao[],
  dataFinalIso: string
): Omit<PosicaoDoDestino, 'aplicadoCentavos'> {
  return destinos.reduce(
    (total, destino) => {
      const posicao = calcularPosicaoDoDestino(destino, movimentacoes, dataFinalIso)
      return {
        saldoEstimadoCentavos: total.saldoEstimadoCentavos + posicao.saldoEstimadoCentavos,
        rendimentoEstimadoCentavos:
          total.rendimentoEstimadoCentavos + posicao.rendimentoEstimadoCentavos
      }
    },
    { saldoEstimadoCentavos: 0, rendimentoEstimadoCentavos: 0 }
  )
}

export function existeResgateSemSaldo(destino: Destino, movimentacoes: Movimentacao[]): boolean {
  const doDestino = movimentacoes.filter((movimentacao) => movimentacao.destinoId === destino.id)
  const dataDoUltimoEvento = ordenarCronologicamente(doDestino).at(-1)?.data
  if (dataDoUltimoEvento === undefined) return false

  return simularSaldo(destino, doDestino, dataDoUltimoEvento).existeResgateSemSaldo
}
