import { describe, expect, it } from 'vitest'
import {
  calcularAngulosDasFatias,
  calcularEscalaVertical,
  montarCaminhoDaArea,
  montarCaminhoDaFatia,
  montarCaminhoDeBarra,
  montarCaminhoDeLinhaSuave
} from './geometria'

describe('calcularEscalaVertical', () => {
  it('arredonda o topo para um passo "redondo"', () => {
    expect(calcularEscalaVertical(560000)).toEqual({
      topo: 600000,
      marcas: [0, 200000, 400000, 600000]
    })
  })

  it.each([
    [100000, 100000],
    [123456, 150000],
    [999999, 1000000]
  ])('para máximo %i o topo cobre o valor sem exagerar (%i)', (maximo, topoEsperado) => {
    expect(calcularEscalaVertical(maximo).topo).toBe(topoEsperado)
  })

  it('o topo sempre cobre o valor máximo e as marcas começam em zero', () => {
    for (const maximo of [1, 37, 4999, 250000, 7_654_321]) {
      const { topo, marcas } = calcularEscalaVertical(maximo)

      expect(topo).toBeGreaterThanOrEqual(maximo)
      expect(marcas[0]).toBe(0)
      expect(marcas.at(-1)).toBe(topo)
    }
  })

  it('sem dados usa uma escala de referência', () => {
    expect(calcularEscalaVertical(0).topo).toBeGreaterThan(0)
  })
})

describe('calcularAngulosDasFatias', () => {
  it('divide a volta na proporção dos valores, começando no topo', () => {
    const [primeira, segunda] = calcularAngulosDasFatias([1, 3])

    expect(primeira.inicio).toBeCloseTo(-Math.PI / 2)
    expect(primeira.fim - primeira.inicio).toBeCloseTo(Math.PI / 2)
    expect(segunda.fim - segunda.inicio).toBeCloseTo((Math.PI * 3) / 2)
  })

  it('as fatias são consecutivas e fecham a volta', () => {
    const fatias = calcularAngulosDasFatias([5, 3, 2])

    expect(fatias[1].inicio).toBeCloseTo(fatias[0].fim)
    expect(fatias[2].fim - fatias[0].inicio).toBeCloseTo(Math.PI * 2)
  })

  it('sem valores não há fatias', () => {
    expect(calcularAngulosDasFatias([])).toEqual([])
    expect(calcularAngulosDasFatias([0, 0])).toEqual([])
  })
})

describe('montarCaminhoDaFatia', () => {
  it('desenha uma fatia como um anel: arco externo, ligação e arco interno', () => {
    const caminho = montarCaminhoDaFatia(100, 100, 80, 50, { inicio: 0, fim: Math.PI / 2 })

    expect(caminho.startsWith('M ')).toBe(true)
    expect(caminho.match(/ A /g)).toHaveLength(2)
    expect(caminho.endsWith('Z')).toBe(true)
  })

  it('usa o arco grande quando a fatia passa de meia volta', () => {
    const caminho = montarCaminhoDaFatia(100, 100, 80, 50, { inicio: 0, fim: Math.PI * 1.5 })

    expect(caminho).toContain('A 80 80 0 1 1')
  })

  it('uma fatia que é a volta inteira vira duas metades', () => {
    const caminho = montarCaminhoDaFatia(100, 100, 80, 50, { inicio: 0, fim: Math.PI * 2 })

    expect(caminho.match(/M /g)).toHaveLength(2)
  })
})

describe('caminhos de linha e de área', () => {
  const pontos = [
    { x: 0, y: 10 },
    { x: 100, y: 50 },
    { x: 200, y: 30 }
  ]

  it('a linha passa por todos os pontos com curvas suaves', () => {
    const caminho = montarCaminhoDeLinhaSuave(pontos)

    expect(caminho.startsWith('M 0.00 10.00')).toBe(true)
    expect(caminho.match(/ C /g)).toHaveLength(2)
    expect(caminho.endsWith('200.00 30.00')).toBe(true)
  })

  it('a área fecha a linha até a base do gráfico', () => {
    const caminho = montarCaminhoDaArea(pontos, 100)

    expect(caminho).toContain('L 200.00 100.00 L 0.00 100.00 Z')
  })

  it('sem pontos, sem caminho', () => {
    expect(montarCaminhoDeLinhaSuave([])).toBe('')
    expect(montarCaminhoDaArea([], 100)).toBe('')
  })
})

describe('montarCaminhoDeBarra', () => {
  it('fecha a barra com a base reta e os cantos de cima curvos', () => {
    const caminho = montarCaminhoDeBarra(10, 20, 30, 80, 4)

    expect(caminho.startsWith('M 10.00 100.00')).toBe(true)
    expect(caminho.match(/ Q /g)).toHaveLength(2)
    expect(caminho.endsWith('Z')).toBe(true)
  })

  it('numa barra muito baixa o arredondamento não passa da altura', () => {
    const caminho = montarCaminhoDeBarra(0, 98, 20, 2, 4)

    expect(caminho).toContain('Q 0.00 98.00 2.00 98.00')
  })
})
