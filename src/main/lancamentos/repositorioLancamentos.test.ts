import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { executarMigracoes } from '../banco/migracoes/executarMigracoes'
import { listaDeMigracoes } from '../banco/migracoes/listaDeMigracoes'
import type { NovoLancamento } from '../../shared/lancamentos/tipos'
import {
  atualizarLancamento,
  excluirLancamento,
  inserirLancamento,
  inserirVariosLancamentos,
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

describe('inserirVariosLancamentos', () => {
  let banco: Database.Database

  beforeEach(() => {
    banco = new Database(':memory:')
    executarMigracoes(banco, listaDeMigracoes)
  })

  it('insere todos e devolve a quantidade', () => {
    const quantidade = inserirVariosLancamentos(banco, [
      mercado,
      { ...mercado, descricao: 'Farmácia' }
    ])

    expect(quantidade).toBe(2)
    expect(listarLancamentos(banco)).toHaveLength(2)
  })

  it('não insere nenhum se um deles falhar no banco', () => {
    expect(() =>
      inserirVariosLancamentos(banco, [mercado, { ...mercado, valorCentavos: 0 }])
    ).toThrow()

    expect(listarLancamentos(banco)).toEqual([])
  })
})

describe('categorias padronizadas', () => {
  let banco: Database.Database

  beforeEach(() => {
    banco = new Database(':memory:')
    executarMigracoes(banco, listaDeMigracoes)
  })

  it('trata maiúscula, acento e espaço a mais como a mesma categoria', () => {
    inserirLancamento(banco, { ...mercado, categoria: 'Saúde' })
    const segundo = inserirLancamento(banco, { ...mercado, categoria: '  saude ' })

    expect(segundo.categoria).toBe('Saúde')
    expect(banco.prepare('SELECT COUNT(*) AS n FROM categorias').get()).toEqual({ n: 1 })
  })

  it('cria uma categoria nova quando o nome é diferente', () => {
    inserirLancamento(banco, { ...mercado, categoria: 'Saúde' })
    const outro = inserirLancamento(banco, { ...mercado, categoria: 'Lazer' })

    expect(outro.categoria).toBe('Lazer')
    expect(banco.prepare('SELECT COUNT(*) AS n FROM categorias').get()).toEqual({ n: 2 })
  })

  it('ao editar, também usa a grafia que já existe', () => {
    inserirLancamento(banco, { ...mercado, categoria: 'Comida' })
    const outro = inserirLancamento(banco, { ...mercado, categoria: 'Lazer' })

    atualizarLancamento(banco, { ...outro, categoria: 'COMIDA' })

    expect(listarLancamentos(banco).map((lancamento) => lancamento.categoria)).toEqual([
      'Comida',
      'Comida'
    ])
  })

  it('a importação em lote também padroniza', () => {
    inserirVariosLancamentos(banco, [
      { ...mercado, categoria: 'Transporte' },
      { ...mercado, categoria: 'transporte' }
    ])

    expect(banco.prepare('SELECT COUNT(*) AS n FROM categorias').get()).toEqual({ n: 1 })
  })
})
