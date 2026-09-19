import { describe, expect, it } from 'vitest'
import {
  calcularFaturaAberta,
  calcularMelhorDataDeCompra,
  calcularMesDoVencimentoDaFatura,
  derivarRegraDoCiclo,
  indexarAjustesDoCartao,
  validarDatasDoCiclo
} from './cicloDaFatura'
import type { RegraDoCiclo } from './tipos'

// Vence dia 1 e a fatura fecha 6 dias antes: o dia do fechamento acompanha o tamanho do mês.
const venceDia1Fecha6DiasAntes: RegraDoCiclo = {
  diaDeFechamento: 24,
  diaDeVencimento: 1,
  diasAntesDoVencimento: 6
}

describe('melhor data de compra por dias antes do vencimento', () => {
  it.each([
    ['2026-10', '2026-09-25'],
    ['2026-08', '2026-07-26'],
    ['2026-07', '2026-06-25'],
    ['2026-03', '2026-02-23'],
    ['2026-02', '2026-01-26']
  ])('a fatura de %s traz a melhor data em %s', (mes, esperada) => {
    expect(calcularMelhorDataDeCompra(mes, venceDia1Fecha6DiasAntes)).toBe(esperada)
  })

  it('uma exceção cadastrada vale mais que a regra', () => {
    const ajustes = new Map([['2026-06', '2026-05-23']])

    expect(calcularMelhorDataDeCompra('2026-06', venceDia1Fecha6DiasAntes, ajustes)).toBe(
      '2026-05-23'
    )
  })
})

describe('fatura em que a compra cai', () => {
  it('no dia anterior à melhor data ainda entra na fatura que vence no mês seguinte', () => {
    expect(calcularMesDoVencimentoDaFatura('2026-09-24', venceDia1Fecha6DiasAntes)).toBe('2026-10')
  })

  it('na melhor data já entra na fatura seguinte', () => {
    expect(calcularMesDoVencimentoDaFatura('2026-09-25', venceDia1Fecha6DiasAntes)).toBe('2026-11')
  })

  it.each([
    ['2026-06-25', '2026-08'],
    ['2026-07-26', '2026-09'],
    ['2026-12-26', '2027-02'],
    ['2026-01-26', '2026-03']
  ])('a compra de %s vence na fatura de %s', (compra, fatura) => {
    expect(calcularMesDoVencimentoDaFatura(compra, venceDia1Fecha6DiasAntes)).toBe(fatura)
  })

  it('usa a exceção do mês para decidir a fatura', () => {
    const ajustes = new Map([['2026-06', '2026-05-23']])

    expect(calcularMesDoVencimentoDaFatura('2026-05-23', venceDia1Fecha6DiasAntes)).toBe('2026-06')
    expect(calcularMesDoVencimentoDaFatura('2026-05-23', venceDia1Fecha6DiasAntes, ajustes)).toBe(
      '2026-07'
    )
  })
})

describe('cartão que fecha sempre no mesmo dia', () => {
  const fechaDia25VenceDia5: RegraDoCiclo = {
    diaDeFechamento: 25,
    diaDeVencimento: 5,
    diasAntesDoVencimento: null
  }

  it('a melhor data é o dia seguinte ao fechamento', () => {
    expect(calcularMelhorDataDeCompra('2026-10', fechaDia25VenceDia5)).toBe('2026-09-26')
  })

  it('o dia 25 ainda entra na fatura que fecha, e o 26 vai para a seguinte', () => {
    expect(calcularMesDoVencimentoDaFatura('2026-09-25', fechaDia25VenceDia5)).toBe('2026-10')
    expect(calcularMesDoVencimentoDaFatura('2026-09-26', fechaDia25VenceDia5)).toBe('2026-11')
  })
})

describe('fatura aberta', () => {
  it('mostra o vencimento e a melhor data da fatura em que uma compra de hoje entraria', () => {
    expect(calcularFaturaAberta('2026-09-19', venceDia1Fecha6DiasAntes)).toEqual({
      mesDoVencimento: '2026-10',
      vencimento: '2026-10-01',
      melhorDataDeCompra: '2026-09-25'
    })
  })
})

describe('regra a partir das datas copiadas da fatura', () => {
  const datas = { vencimento: '2026-10-01', melhorDataDeCompra: '2026-09-25' }

  it('guarda o vencimento e quantos dias antes a fatura fecha', () => {
    expect(derivarRegraDoCiclo({ ...datas, modo: 'dias-antes-do-vencimento' })).toEqual(
      venceDia1Fecha6DiasAntes
    )
  })

  it('no modo de dia fixo, guarda só o dia do fechamento', () => {
    expect(derivarRegraDoCiclo({ ...datas, modo: 'dia-fixo' })).toEqual({
      diaDeFechamento: 24,
      diaDeVencimento: 1,
      diasAntesDoVencimento: null
    })
  })

  it('recusa datas em branco e melhor data depois do vencimento', () => {
    const modo = 'dias-antes-do-vencimento' as const

    expect(validarDatasDoCiclo({ vencimento: '', melhorDataDeCompra: '', modo })).toHaveLength(1)
    expect(
      validarDatasDoCiclo({ vencimento: '2026-10-01', melhorDataDeCompra: '2026-10-05', modo })
    ).toHaveLength(1)
    expect(validarDatasDoCiclo({ ...datas, modo })).toEqual([])
  })
})

describe('indexarAjustesDoCartao', () => {
  it('separa só os ajustes do cartão pedido', () => {
    const ajustes = [
      { cartaoId: 1, mesDoVencimento: '2026-06', melhorDataDeCompra: '2026-05-23' },
      { cartaoId: 2, mesDoVencimento: '2026-06', melhorDataDeCompra: '2026-05-20' }
    ]

    expect([...indexarAjustesDoCartao(ajustes, 1)]).toEqual([['2026-06', '2026-05-23']])
  })
})
