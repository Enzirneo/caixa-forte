import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { executarMigracoes } from '../banco/migracoes/executarMigracoes'
import { listaDeMigracoes } from '../banco/migracoes/listaDeMigracoes'
import { inserirLancamento } from '../lancamentos/repositorioLancamentos'
import { fecharMes, fecharMesesEncerrados, refazerFechamento } from './fecharMes'
import { listarFechamentos } from './repositorioFechamentos'

describe('fecharMes', () => {
  let banco: Database.Database

  beforeEach(() => {
    banco = new Database(':memory:')
    executarMigracoes(banco, listaDeMigracoes)
    inserirLancamento(banco, {
      descricao: 'Salário',
      valorCentavos: 500000,
      data: '2026-08-05',
      tipo: 'receita',
      categoria: 'Renda'
    })
    inserirLancamento(banco, {
      descricao: 'Aluguel',
      valorCentavos: 100000,
      data: '2026-08-10',
      tipo: 'despesa',
      categoria: 'Casa'
    })
    inserirLancamento(banco, {
      descricao: 'Outro mês',
      valorCentavos: 7000,
      data: '2026-09-01',
      tipo: 'despesa',
      categoria: 'Geral'
    })
  })

  it('guarda os totais do mês no momento do fechamento', () => {
    fecharMes(banco, '2026-08', '2026-09')

    expect(listarFechamentos(banco)).toEqual([
      expect.objectContaining({
        mes: '2026-08',
        receitasCentavos: 500000,
        despesasCentavos: 100000
      })
    ])
  })

  it('não fecha o mês atual', () => {
    expect(() => fecharMes(banco, '2026-09', '2026-09')).toThrow('já terminaram')
  })

  it('não fecha duas vezes o mesmo mês', () => {
    fecharMes(banco, '2026-08', '2026-09')

    expect(() => fecharMes(banco, '2026-08', '2026-09')).toThrow('já está fechado')
  })

  it('fecha automaticamente todos os meses encerrados que têm lançamentos', () => {
    inserirLancamento(banco, {
      descricao: 'Mais antigo',
      valorCentavos: 2500,
      data: '2026-06-15',
      tipo: 'despesa',
      categoria: 'Geral'
    })

    fecharMesesEncerrados(banco, '2026-09')

    expect(listarFechamentos(banco).map((fechamento) => fechamento.mes)).toEqual([
      '2026-08',
      '2026-06'
    ])
  })

  it('não refaz o que já foi fechado ao rodar o fechamento automático de novo', () => {
    fecharMesesEncerrados(banco, '2026-09')
    const fechadoEmAntes = listarFechamentos(banco)[0].fechadoEm

    fecharMesesEncerrados(banco, '2026-09')

    expect(listarFechamentos(banco)[0].fechadoEm).toBe(fechadoEmAntes)
  })

  it('refazer o fechamento atualiza os totais com os lançamentos tardios', () => {
    fecharMes(banco, '2026-08', '2026-09')
    inserirLancamento(banco, {
      descricao: 'Tardio',
      valorCentavos: 3000,
      data: '2026-08-28',
      tipo: 'despesa',
      categoria: 'Geral'
    })

    refazerFechamento(banco, '2026-08')

    expect(listarFechamentos(banco)).toEqual([
      expect.objectContaining({ mes: '2026-08', despesasCentavos: 103000 })
    ])
  })

  it('não refaz o fechamento de um mês que não está fechado', () => {
    expect(() => refazerFechamento(banco, '2026-08')).toThrow('não está fechado')
  })
})
