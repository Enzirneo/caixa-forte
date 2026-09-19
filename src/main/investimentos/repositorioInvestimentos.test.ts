import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import type { NovoDestino } from '../../shared/investimentos/tipos'
import { executarMigracoes } from '../banco/migracoes/executarMigracoes'
import { listaDeMigracoes } from '../banco/migracoes/listaDeMigracoes'
import {
  excluirMovimentacao,
  inserirDestino,
  inserirMovimentacao,
  listarDestinos,
  listarMovimentacoes
} from './repositorioInvestimentos'

const cdb: NovoDestino = {
  nome: 'CDB Banco X',
  tipo: 'investimento',
  taxaRendimentoCentesimos: 105,
  periodicidadeDaTaxa: 'mensal'
}

const caixinha: NovoDestino = {
  nome: 'Caixinha',
  tipo: 'caixinha',
  taxaRendimentoCentesimos: null,
  periodicidadeDaTaxa: null
}

describe('repositorioInvestimentos', () => {
  let banco: Database.Database

  beforeEach(() => {
    banco = new Database(':memory:')
    banco.pragma('foreign_keys = ON')
    executarMigracoes(banco, listaDeMigracoes)
  })

  it('guarda e lista destinos, com e sem taxa', () => {
    inserirDestino(banco, cdb)
    inserirDestino(banco, caixinha)

    expect(listarDestinos(banco)).toEqual([
      { id: 2, ...caixinha },
      { id: 1, ...cdb }
    ])
  })

  it('guarda movimentações do mais recente para o mais antigo', () => {
    const destino = inserirDestino(banco, cdb)
    inserirMovimentacao(banco, {
      destinoId: destino.id,
      tipo: 'aporte',
      valorCentavos: 100000,
      data: '2026-08-10'
    })
    inserirMovimentacao(banco, {
      destinoId: destino.id,
      tipo: 'resgate',
      valorCentavos: 30000,
      data: '2026-09-12'
    })

    expect(listarMovimentacoes(banco).map((movimentacao) => movimentacao.tipo)).toEqual([
      'resgate',
      'aporte'
    ])
  })

  it('exclui apenas a movimentação indicada', () => {
    const destino = inserirDestino(banco, cdb)
    const primeira = inserirMovimentacao(banco, {
      destinoId: destino.id,
      tipo: 'aporte',
      valorCentavos: 1000,
      data: '2026-09-01'
    })
    inserirMovimentacao(banco, {
      destinoId: destino.id,
      tipo: 'aporte',
      valorCentavos: 2000,
      data: '2026-09-02'
    })

    excluirMovimentacao(banco, primeira.id)

    expect(listarMovimentacoes(banco).map((movimentacao) => movimentacao.valorCentavos)).toEqual([
      2000
    ])
  })

  it('o banco recusa movimentação de destino que não existe', () => {
    expect(() =>
      inserirMovimentacao(banco, {
        destinoId: 99,
        tipo: 'aporte',
        valorCentavos: 1000,
        data: '2026-09-01'
      })
    ).toThrow()
  })

  it('o banco recusa taxa sem periodicidade', () => {
    expect(() => inserirDestino(banco, { ...caixinha, taxaRendimentoCentesimos: 105 })).toThrow()
  })
})
