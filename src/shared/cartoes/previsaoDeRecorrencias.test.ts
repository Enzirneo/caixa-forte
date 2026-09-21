import { describe, expect, it } from 'vitest'
import type { Recorrencia } from '../recorrencias/tipos'
import { calcularPrevistoDasRecorrencias } from './previsaoDeRecorrencias'

function assinar(sobrescritas: Partial<Recorrencia>): Recorrencia {
  return {
    id: 1,
    descricao: 'Disney',
    valorCentavos: 6990,
    tipo: 'despesa',
    categoria: 'Streaming',
    diaDoMes: 26,
    mesDeInicio: '2026-09',
    mesDeFim: null,
    ativa: true,
    cartaoId: 1,
    ...sobrescritas
  }
}

const HOJE = '2026-09-20'

describe('calcularPrevistoDasRecorrencias', () => {
  it('soma a próxima cobrança de cada recorrência ativa do cartão', () => {
    const recorrencias = [
      assinar({ id: 1, valorCentavos: 11636, diaDoMes: 26 }),
      assinar({ id: 2, valorCentavos: 2399, diaDoMes: 28 })
    ]

    expect(calcularPrevistoDasRecorrencias(recorrencias, 1, HOJE)).toBe(14035)
  })

  it('ignora recorrência de outro cartão, sem cartão ou pausada', () => {
    const recorrencias = [
      assinar({ id: 1, cartaoId: 2 }),
      assinar({ id: 2, cartaoId: null }),
      assinar({ id: 3, ativa: false }),
      assinar({ id: 4, valorCentavos: 1000 })
    ]

    expect(calcularPrevistoDasRecorrencias(recorrencias, 1, HOJE)).toBe(1000)
  })

  it('ignora recorrência que já terminou', () => {
    const encerrada = assinar({ mesDeFim: '2026-08', mesDeInicio: '2026-01' })

    expect(calcularPrevistoDasRecorrencias([encerrada], 1, HOJE)).toBe(0)
  })
})
