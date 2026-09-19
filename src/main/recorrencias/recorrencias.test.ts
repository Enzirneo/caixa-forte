import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import type { NovaRecorrencia } from '../../shared/recorrencias/tipos'
import { executarMigracoes } from '../banco/migracoes/executarMigracoes'
import { listaDeMigracoes } from '../banco/migracoes/listaDeMigracoes'
import {
  excluirLancamento,
  inserirLancamento,
  listarLancamentos
} from '../lancamentos/repositorioLancamentos'
import { gerarLancamentosRecorrentes } from './gerarLancamentosRecorrentes'
import {
  atualizarRecorrencia,
  definirRecorrenciaAtiva,
  excluirRecorrencia,
  inserirRecorrencia,
  listarRecorrencias
} from './repositorioRecorrencias'

const aluguel: NovaRecorrencia = {
  descricao: 'Aluguel',
  valorCentavos: 120000,
  tipo: 'despesa',
  categoria: 'Moradia',
  diaDoMes: 5,
  mesDeInicio: '2026-07',
  mesDeFim: null
}

function listarDatas(banco: Database.Database): string[] {
  return listarLancamentos(banco)
    .map((lancamento) => lancamento.data)
    .sort()
}

describe('lançamentos recorrentes', () => {
  let banco: Database.Database

  beforeEach(() => {
    banco = new Database(':memory:')
    banco.pragma('foreign_keys = ON')
    executarMigracoes(banco, listaDeMigracoes)
  })

  it('cria os lançamentos vencidos, inclusive de meses em que o app não foi aberto', () => {
    inserirRecorrencia(banco, aluguel)

    const criados = gerarLancamentosRecorrentes(banco, '2026-09-19')

    expect(criados).toBe(3)
    expect(listarDatas(banco)).toEqual(['2026-07-05', '2026-08-05', '2026-09-05'])
  })

  it('os lançamentos criados carregam descrição, valor, tipo e categoria da regra', () => {
    inserirRecorrencia(banco, aluguel)

    gerarLancamentosRecorrentes(banco, '2026-07-10')

    expect(listarLancamentos(banco)).toEqual([
      expect.objectContaining({
        descricao: 'Aluguel',
        valorCentavos: 120000,
        tipo: 'despesa',
        categoria: 'Moradia'
      })
    ])
  })

  it('rodar de novo no mesmo dia não duplica nada', () => {
    inserirRecorrencia(banco, aluguel)
    gerarLancamentosRecorrentes(banco, '2026-09-19')

    expect(gerarLancamentosRecorrentes(banco, '2026-09-19')).toBe(0)
    expect(listarLancamentos(banco)).toHaveLength(3)
  })

  it('só cria o do mês seguinte quando o dia chega', () => {
    inserirRecorrencia(banco, aluguel)
    gerarLancamentosRecorrentes(banco, '2026-09-19')

    expect(gerarLancamentosRecorrentes(banco, '2026-10-04')).toBe(0)
    expect(gerarLancamentosRecorrentes(banco, '2026-10-05')).toBe(1)
  })

  it('um lançamento apagado não volta sozinho', () => {
    inserirRecorrencia(banco, aluguel)
    gerarLancamentosRecorrentes(banco, '2026-09-19')
    const setembro = listarLancamentos(banco).find((lancamento) => lancamento.data === '2026-09-05')

    excluirLancamento(banco, (setembro as { id: number }).id)
    gerarLancamentosRecorrentes(banco, '2026-09-20')

    expect(listarDatas(banco)).toEqual(['2026-07-05', '2026-08-05'])
  })

  it('pausada não cria nada, e ao retomar cria o que ficou faltando', () => {
    const recorrencia = inserirRecorrencia(banco, aluguel)
    definirRecorrenciaAtiva(banco, recorrencia.id, false)

    expect(gerarLancamentosRecorrentes(banco, '2026-09-19')).toBe(0)

    definirRecorrenciaAtiva(banco, recorrencia.id, true)
    expect(gerarLancamentosRecorrentes(banco, '2026-09-19')).toBe(3)
  })

  it('para no mês de término', () => {
    inserirRecorrencia(banco, { ...aluguel, mesDeFim: '2026-08' })

    gerarLancamentosRecorrentes(banco, '2026-12-01')

    expect(listarDatas(banco)).toEqual(['2026-07-05', '2026-08-05'])
  })

  it('dia 31 cai no último dia do mês curto', () => {
    inserirRecorrencia(banco, { ...aluguel, diaDoMes: 31, mesDeInicio: '2026-02' })

    gerarLancamentosRecorrentes(banco, '2026-04-30')

    expect(listarDatas(banco)).toEqual(['2026-02-28', '2026-03-31', '2026-04-30'])
  })

  it('excluir a regra mantém os lançamentos que ela já criou', () => {
    const recorrencia = inserirRecorrencia(banco, aluguel)
    gerarLancamentosRecorrentes(banco, '2026-09-19')

    excluirRecorrencia(banco, recorrencia.id)

    expect(listarRecorrencias(banco)).toEqual([])
    expect(listarLancamentos(banco)).toHaveLength(3)
  })

  it('mudar o valor afeta só os próximos lançamentos', () => {
    const recorrencia = inserirRecorrencia(banco, aluguel)
    gerarLancamentosRecorrentes(banco, '2026-09-19')

    atualizarRecorrencia(banco, { ...recorrencia, valorCentavos: 130000 })
    gerarLancamentosRecorrentes(banco, '2026-10-05')

    const valores = listarLancamentos(banco)
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((lancamento) => lancamento.valorCentavos)
    expect(valores).toEqual([120000, 120000, 120000, 130000])
  })

  it('usa a grafia de uma categoria que já existe', () => {
    inserirLancamento(banco, {
      descricao: 'Antigo',
      valorCentavos: 100,
      data: '2026-01-01',
      tipo: 'despesa',
      categoria: 'Moradia'
    })

    const recorrencia = inserirRecorrencia(banco, { ...aluguel, categoria: 'moradia' })

    expect(recorrencia.categoria).toBe('Moradia')
  })

  it('o banco recusa dia do mês inválido', () => {
    expect(() => inserirRecorrencia(banco, { ...aluguel, diaDoMes: 40 })).toThrow()
  })
})
