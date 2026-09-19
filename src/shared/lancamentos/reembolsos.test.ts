import { describe, expect, it } from 'vitest'
import {
  calcularValorReembolsavel,
  listarDespesasReembolsaveis,
  montarRotulosDeReembolso,
  validarReembolso
} from './reembolsos'
import type { Lancamento, NovoLancamento } from './tipos'

function lancar(sobrescritas: Partial<Lancamento>): Lancamento {
  return {
    id: 1,
    descricao: 'Almoço com amigos',
    valorCentavos: 20000,
    data: '2026-09-10',
    tipo: 'despesa',
    categoria: 'Alimentação',
    alteradoEm: '2026-09-10 00:00:00.000',
    ...sobrescritas
  }
}

const almoco = lancar({ id: 1 })
const reembolsoParcial = lancar({
  id: 2,
  tipo: 'reembolso',
  valorCentavos: 10000,
  reembolsoDeId: 1,
  data: '2026-09-12'
})

describe('calcularValorReembolsavel', () => {
  it('sem reembolso, é o valor todo da despesa', () => {
    expect(calcularValorReembolsavel(almoco, [almoco])).toBe(20000)
  })

  it('desconta o que já foi devolvido', () => {
    expect(calcularValorReembolsavel(almoco, [almoco, reembolsoParcial])).toBe(10000)
  })

  it('ao editar um reembolso, ele não conta contra si mesmo', () => {
    expect(calcularValorReembolsavel(almoco, [almoco, reembolsoParcial], 2)).toBe(20000)
  })

  it('nunca fica negativo', () => {
    const passouDoValor = lancar({
      id: 3,
      tipo: 'reembolso',
      valorCentavos: 50000,
      reembolsoDeId: 1
    })

    expect(calcularValorReembolsavel(almoco, [almoco, passouDoValor])).toBe(0)
  })
})

describe('listarDespesasReembolsaveis', () => {
  it('lista só despesas com algo a devolver, das mais novas para as mais antigas', () => {
    const totalmenteDevolvida = lancar({ id: 5, valorCentavos: 3000, data: '2026-09-20' })
    const devolucaoTotal = lancar({
      id: 6,
      tipo: 'reembolso',
      valorCentavos: 3000,
      reembolsoDeId: 5
    })
    const maisNova = lancar({ id: 7, descricao: 'Uber', data: '2026-09-15' })
    const receita = lancar({ id: 8, tipo: 'receita' })

    const lista = listarDespesasReembolsaveis([
      almoco,
      reembolsoParcial,
      totalmenteDevolvida,
      devolucaoTotal,
      maisNova,
      receita
    ])

    expect(lista.map((item) => [item.despesa.id, item.reembolsavelCentavos])).toEqual([
      [7, 20000],
      [1, 10000]
    ])
  })
})

describe('validarReembolso', () => {
  const novoReembolso: NovoLancamento = {
    descricao: 'Devolução',
    valorCentavos: 10000,
    data: '2026-09-12',
    tipo: 'reembolso',
    categoria: 'Alimentação',
    reembolsoDeId: 1
  }

  it('aceita devolver parte ou o restante da despesa', () => {
    expect(validarReembolso(novoReembolso, [almoco])).toEqual([])
    expect(validarReembolso({ ...novoReembolso, valorCentavos: 20000 }, [almoco])).toEqual([])
  })

  it('recusa passar do que falta devolver', () => {
    expect(
      validarReembolso({ ...novoReembolso, valorCentavos: 10001 }, [almoco, reembolsoParcial])
    ).toHaveLength(1)
  })

  it('ao editar, aceita manter o próprio valor', () => {
    expect(
      validarReembolso({ ...novoReembolso, valorCentavos: 10000 }, [almoco, reembolsoParcial], 2)
    ).toEqual([])
  })

  it('recusa apontar para algo que não é uma despesa que existe', () => {
    expect(validarReembolso({ ...novoReembolso, reembolsoDeId: 99 }, [almoco])).toHaveLength(1)
    expect(validarReembolso(novoReembolso, [lancar({ id: 1, tipo: 'receita' })])).toHaveLength(1)
  })

  it('reembolso sem despesa indicada (vindo de importação) é aceito', () => {
    expect(validarReembolso({ ...novoReembolso, reembolsoDeId: null }, [almoco])).toEqual([])
  })

  it('só reembolso pode apontar para uma despesa', () => {
    expect(validarReembolso({ ...novoReembolso, tipo: 'receita' }, [almoco])).toHaveLength(1)
  })

  it('não deixa baixar o valor de uma despesa abaixo do que já voltou', () => {
    const editada: NovoLancamento = { ...almoco, reembolsoDeId: null, valorCentavos: 9000 }

    expect(validarReembolso(editada, [almoco, reembolsoParcial], 1)).toHaveLength(1)
    expect(
      validarReembolso({ ...editada, valorCentavos: 10000 }, [almoco, reembolsoParcial], 1)
    ).toEqual([])
  })
})

describe('montarRotulosDeReembolso', () => {
  it('a despesa mostra quanto voltou e o reembolso mostra de onde veio', () => {
    const rotulos = montarRotulosDeReembolso([almoco, reembolsoParcial])

    expect(rotulos.get(1)).toContain('Reembolsado')
    expect(rotulos.get(1)).toContain('100,00')
    expect(rotulos.get(2)).toBe('Reembolso de Almoço com amigos')
  })

  it('reembolso sem despesa ligada só diz que é reembolso, e despesa sem reembolso não tem rótulo', () => {
    const solto = lancar({ id: 4, tipo: 'reembolso', reembolsoDeId: null })

    const rotulos = montarRotulosDeReembolso([almoco, solto])

    expect(rotulos.get(4)).toBe('Reembolso')
    expect(rotulos.has(1)).toBe(false)
  })
})
