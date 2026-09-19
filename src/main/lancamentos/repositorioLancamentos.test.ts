import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { executarMigracoes } from '../banco/migracoes/executarMigracoes'
import { listaDeMigracoes } from '../banco/migracoes/listaDeMigracoes'
import type { NovoLancamento } from '../../shared/lancamentos/tipos'
import {
  atualizarLancamento,
  excluirLancamento,
  inserirLancamento,
  listarLancamentos
} from './repositorioLancamentos'

const mercado: NovoLancamento = {
  descricao: 'Mercado',
  valorCentavos: 15000,
  data: '2026-09-18',
  tipo: 'despesa',
  categoria: 'Alimentação'
}

describe('repositorioLancamentos', () => {
  let banco: Database.Database

  beforeEach(() => {
    banco = new Database(':memory:')
    executarMigracoes(banco, listaDeMigracoes)
  })

  it('insere e devolve o lançamento com id', () => {
    const inserido = inserirLancamento(banco, mercado)

    expect(inserido).toMatchObject({ id: 1, ...mercado })
  })

  it('lista do mais recente para o mais antigo', () => {
    inserirLancamento(banco, { ...mercado, descricao: 'Antigo', data: '2026-09-01' })
    inserirLancamento(banco, { ...mercado, descricao: 'Novo', data: '2026-09-20' })

    const descricoes = listarLancamentos(banco).map((lancamento) => lancamento.descricao)

    expect(descricoes).toEqual(['Novo', 'Antigo'])
  })

  it('exclui apenas o lançamento indicado', () => {
    const primeiro = inserirLancamento(banco, mercado)
    inserirLancamento(banco, { ...mercado, descricao: 'Farmácia' })

    excluirLancamento(banco, primeiro.id)

    expect(listarLancamentos(banco).map((lancamento) => lancamento.descricao)).toEqual(['Farmácia'])
  })

  it('o banco recusa valor que não seja positivo', () => {
    expect(() => inserirLancamento(banco, { ...mercado, valorCentavos: 0 })).toThrow()
  })
})

describe('atualizarLancamento', () => {
  let banco: Database.Database

  beforeEach(() => {
    banco = new Database(':memory:')
    executarMigracoes(banco, listaDeMigracoes)
  })

  it('altera os campos e mantém o id', () => {
    const original = inserirLancamento(banco, mercado)

    atualizarLancamento(banco, { ...original, descricao: 'Feira', valorCentavos: 9990 })

    expect(listarLancamentos(banco)).toMatchObject([
      { id: original.id, ...mercado, descricao: 'Feira', valorCentavos: 9990 }
    ])
  })

  it('falha se o lançamento não existe', () => {
    expect(() => atualizarLancamento(banco, { id: 99, ...mercado })).toThrow('não encontrado')
  })
})

describe('alteradoEm', () => {
  it('é preenchido ao inserir e ao atualizar', () => {
    const banco = new Database(':memory:')
    executarMigracoes(banco, listaDeMigracoes)

    const inserido = inserirLancamento(banco, mercado)
    expect(inserido.alteradoEm).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/)

    banco.prepare("UPDATE lancamentos SET alterado_em = '2000-01-01 00:00:00.000'").run()
    atualizarLancamento(banco, { ...inserido, descricao: 'Feira' })

    expect(listarLancamentos(banco)[0].alteradoEm > '2000-01-01').toBe(true)
  })
})
