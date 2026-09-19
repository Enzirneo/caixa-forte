import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'
import { executarMigracoes } from './executarMigracoes'
import { listaDeMigracoes } from './listaDeMigracoes'

const PRIMEIRA_VERSAO = 1

describe('listaDeMigracoes', () => {
  it('preserva os lançamentos de um banco criado na primeira versão', () => {
    const banco = new Database(':memory:')
    executarMigracoes(
      banco,
      listaDeMigracoes.filter((migracao) => migracao.versao === PRIMEIRA_VERSAO)
    )
    banco
      .prepare(
        `INSERT INTO lancamentos (descricao, valor_centavos, data, tipo, categoria)
         VALUES ('Antigo', 12345, '2026-09-01', 'despesa', 'Geral')`
      )
      .run()

    executarMigracoes(banco, listaDeMigracoes)

    expect(
      banco.prepare('SELECT descricao, valor_centavos, alterado_em FROM lancamentos').all()
    ).toEqual([
      { descricao: 'Antigo', valor_centavos: 12345, alterado_em: expect.stringMatching(/^\d{4}-/) }
    ])
  })

  it('usa versões em sequência, sem repetir nem pular', () => {
    const versoes = listaDeMigracoes.map((migracao) => migracao.versao)
    expect(versoes).toEqual(versoes.map((_, indice) => indice + 1))
  })
})
