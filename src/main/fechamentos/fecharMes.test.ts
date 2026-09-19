import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { executarMigracoes } from '../banco/migracoes/executarMigracoes'
import { listaDeMigracoes } from '../banco/migracoes/listaDeMigracoes'
import { inserirLancamento } from '../lancamentos/repositorioLancamentos'
import { fecharMes } from './fecharMes'
import { listarFechamentos, removerFechamento } from './repositorioFechamentos'

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

  it('permite fechar de novo depois de reabrir', () => {
    fecharMes(banco, '2026-08', '2026-09')
    removerFechamento(banco, '2026-08')

    expect(() => fecharMes(banco, '2026-08', '2026-09')).not.toThrow()
  })
})
