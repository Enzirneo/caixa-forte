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

describe('migration das categorias em tabela', () => {
  const ULTIMA_VERSAO_ANTES_DAS_CATEGORIAS = 3

  function criarBancoNaVersao3ComLancamentos(categorias: string[]): Database.Database {
    const banco = new Database(':memory:')
    executarMigracoes(
      banco,
      listaDeMigracoes.filter((migracao) => migracao.versao <= ULTIMA_VERSAO_ANTES_DAS_CATEGORIAS)
    )
    categorias.forEach((categoria, indice) =>
      banco
        .prepare(
          `INSERT INTO lancamentos (descricao, valor_centavos, data, tipo, categoria)
           VALUES (?, ?, '2026-09-01', 'despesa', ?)`
        )
        .run(`Item ${indice + 1}`, 1000 + indice, categoria)
    )
    return banco
  }

  function listarNomesPorLancamento(banco: Database.Database): string[] {
    return (
      banco
        .prepare(
          `SELECT c.nome FROM lancamentos l JOIN categorias c ON c.id = l.categoria_id ORDER BY l.id`
        )
        .all() as { nome: string }[]
    ).map((linha) => linha.nome)
  }

  it('une as variações da mesma categoria, mantendo a grafia do lançamento mais antigo', () => {
    const banco = criarBancoNaVersao3ComLancamentos([
      'Comida',
      'comida',
      '  Comida ',
      'Saúde',
      'saude'
    ])

    executarMigracoes(banco, listaDeMigracoes)

    expect(listarNomesPorLancamento(banco)).toEqual([
      'Comida',
      'Comida',
      'Comida',
      'Saúde',
      'Saúde'
    ])
    expect(banco.prepare('SELECT COUNT(*) AS n FROM categorias').get()).toEqual({ n: 2 })
  })

  it('não perde nenhum lançamento nem valor', () => {
    const banco = criarBancoNaVersao3ComLancamentos(['A', 'B', 'a'])

    executarMigracoes(banco, listaDeMigracoes)

    expect(
      banco.prepare('SELECT descricao, valor_centavos FROM lancamentos ORDER BY id').all()
    ).toEqual([
      { descricao: 'Item 1', valor_centavos: 1000 },
      { descricao: 'Item 2', valor_centavos: 1001 },
      { descricao: 'Item 3', valor_centavos: 1002 }
    ])
  })

  it('dá um nome para categoria em branco', () => {
    const banco = criarBancoNaVersao3ComLancamentos(['   '])

    executarMigracoes(banco, listaDeMigracoes)

    expect(listarNomesPorLancamento(banco)).toEqual(['Sem categoria'])
  })

  it('remove a coluna antiga de texto depois de copiar os dados', () => {
    const banco = criarBancoNaVersao3ComLancamentos(['Comida'])

    executarMigracoes(banco, listaDeMigracoes)

    const colunas = (
      banco.prepare('PRAGMA table_info(lancamentos)').all() as { name: string }[]
    ).map((coluna) => coluna.name)
    expect(colunas).not.toContain('categoria')
    expect(colunas).toContain('categoria_id')
  })
})

describe('migration que capitaliza as categorias', () => {
  const VERSAO_ANTERIOR = 6

  function criarBancoNaVersao6(): Database.Database {
    const banco = new Database(':memory:')
    executarMigracoes(
      banco,
      listaDeMigracoes.filter((migracao) => migracao.versao <= VERSAO_ANTERIOR)
    )
    return banco
  }

  it('corrige as que estavam em minúscula e mantém as outras, sem soltar nenhum lançamento', () => {
    const banco = criarBancoNaVersao6()
    const inserirCategoria = banco.prepare('INSERT INTO categorias (nome, chave) VALUES (?, ?)')
    inserirCategoria.run('concurso', 'concurso')
    inserirCategoria.run('saúde', 'saude')
    inserirCategoria.run('Renda', 'renda')
    banco
      .prepare(
        `INSERT INTO lancamentos (descricao, valor_centavos, data, tipo, categoria_id, alterado_em)
         VALUES ('Inscrição', 11700, '2026-09-18', 'despesa', 1, '2026-09-18 00:00:00.000')`
      )
      .run()

    executarMigracoes(banco, listaDeMigracoes)

    expect(banco.prepare('SELECT nome, chave FROM categorias ORDER BY id').all()).toEqual([
      { nome: 'Concurso', chave: 'concurso' },
      { nome: 'Saúde', chave: 'saude' },
      { nome: 'Renda', chave: 'renda' }
    ])
    expect(
      banco
        .prepare('SELECT c.nome FROM lancamentos l JOIN categorias c ON c.id = l.categoria_id')
        .all()
    ).toEqual([{ nome: 'Concurso' }])
  })
})

describe('migration dos ajustes de fechamento dos cartões', () => {
  it('mantém os cartões antigos com fechamento em dia fixo', () => {
    const banco = new Database(':memory:')
    executarMigracoes(
      banco,
      listaDeMigracoes.filter((migracao) => migracao.versao <= 7)
    )
    banco
      .prepare('INSERT INTO cartoes (nome, dia_de_fechamento, dia_de_vencimento) VALUES (?, ?, ?)')
      .run('Nubank', 25, 5)

    executarMigracoes(banco, listaDeMigracoes)

    expect(
      banco.prepare('SELECT nome, dia_de_fechamento, dias_antes_do_vencimento FROM cartoes').all()
    ).toEqual([{ nome: 'Nubank', dia_de_fechamento: 25, dias_antes_do_vencimento: null }])
  })
})

describe('migration do reembolso', () => {
  it('mantém os lançamentos antigos como estavam, sem nenhum marcado como reembolso', () => {
    const banco = new Database(':memory:')
    executarMigracoes(
      banco,
      listaDeMigracoes.filter((migracao) => migracao.versao <= 8)
    )
    banco.prepare("INSERT INTO categorias (nome, chave) VALUES ('Renda', 'renda')").run()
    banco
      .prepare(
        `INSERT INTO lancamentos (descricao, valor_centavos, data, tipo, categoria_id, alterado_em)
         VALUES ('Salário', 500000, '2026-09-05', 'receita', 1, '2026-09-05 00:00:00.000')`
      )
      .run()

    executarMigracoes(banco, listaDeMigracoes)

    expect(banco.prepare('SELECT tipo, reembolso FROM lancamentos').all()).toEqual([
      { tipo: 'receita', reembolso: 0 }
    ])
  })
})
