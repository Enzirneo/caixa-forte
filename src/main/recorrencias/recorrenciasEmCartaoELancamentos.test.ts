import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import type { NovoCartao } from '../../shared/cartoes/tipos'
import type { NovaRecorrencia } from '../../shared/recorrencias/tipos'
import { executarMigracoes } from '../banco/migracoes/executarMigracoes'
import { listaDeMigracoes } from '../banco/migracoes/listaDeMigracoes'
import {
  excluirCartao,
  inserirCartao,
  listarVinculos,
  registrarCompraNoCartao
} from '../cartoes/repositorioCartoes'
import { inserirLancamento, listarLancamentos } from '../lancamentos/repositorioLancamentos'
import { definirLancamentoRecorrente } from './definirLancamentoRecorrente'
import { gerarLancamentosRecorrentes } from './gerarLancamentosRecorrentes'
import { inserirRecorrencia, listarRecorrencias } from './repositorioRecorrencias'

const itau: NovoCartao = {
  nome: 'Itaú',
  diaDeFechamento: 24,
  diaDeVencimento: 1,
  diasAntesDoVencimento: 6,
  limiteCentavos: null
}

const disney: NovaRecorrencia = {
  descricao: 'Disney+',
  valorCentavos: 6690,
  tipo: 'despesa',
  categoria: 'Streaming',
  diaDoMes: 24,
  mesDeInicio: '2026-08',
  mesDeFim: null
}

describe('recorrência ligada a um cartão', () => {
  let banco: Database.Database

  beforeEach(() => {
    banco = new Database(':memory:')
    banco.pragma('foreign_keys = ON')
    executarMigracoes(banco, listaDeMigracoes)
  })

  it('cada ocorrência vira uma compra no cartão, na fatura certa, ligada à recorrência', () => {
    const cartao = inserirCartao(banco, itau)
    const recorrencia = inserirRecorrencia(banco, { ...disney, cartaoId: cartao.id })

    const criados = gerarLancamentosRecorrentes(banco, '2026-09-30')

    expect(criados).toBe(2)
    const lancamentos = listarLancamentos(banco).sort((a, b) => a.data.localeCompare(b.data))
    expect(lancamentos.map((l) => [l.descricao, l.data, l.valorCentavos])).toEqual([
      ['Disney+', '2026-09-01', 6690],
      ['Disney+', '2026-10-01', 6690]
    ])
    expect(lancamentos.every((l) => l.recorrenciaId === recorrencia.id)).toBe(true)
    expect(listarVinculos(banco)).toHaveLength(2)
  })

  it('sem cartão continua criando lançamentos comuns, agora ligados à recorrência', () => {
    const recorrencia = inserirRecorrencia(banco, disney)

    gerarLancamentosRecorrentes(banco, '2026-09-30')

    expect(listarVinculos(banco)).toHaveLength(0)
    expect(listarLancamentos(banco).every((l) => l.recorrenciaId === recorrencia.id)).toBe(true)
  })

  it('o cartão usado em recorrência não pode ser excluído', () => {
    const cartao = inserirCartao(banco, itau)
    inserirRecorrencia(banco, { ...disney, cartaoId: cartao.id })

    expect(() => excluirCartao(banco, cartao.id)).toThrow('recorrências')
  })
})

describe('transformar um lançamento em recorrente', () => {
  let banco: Database.Database

  beforeEach(() => {
    banco = new Database(':memory:')
    banco.pragma('foreign_keys = ON')
    executarMigracoes(banco, listaDeMigracoes)
  })

  const salario = {
    descricao: 'Salário',
    valorCentavos: 500000,
    data: '2026-09-05',
    tipo: 'receita' as const,
    categoria: 'Renda'
  }

  it('cria a recorrência a partir do mês seguinte e liga o próprio lançamento a ela', () => {
    const lancamento = inserirLancamento(banco, salario)

    definirLancamentoRecorrente(banco, lancamento.id, true, '2026-09-19')

    const [recorrencia] = listarRecorrencias(banco)
    expect(recorrencia).toMatchObject({
      descricao: 'Salário',
      valorCentavos: 500000,
      tipo: 'receita',
      diaDoMes: 5,
      mesDeInicio: '2026-10',
      mesDeFim: null,
      ativa: true
    })
    expect(listarLancamentos(banco)[0].recorrenciaId).toBe(recorrencia.id)
  })

  it('o mês do próprio lançamento não é gerado de novo', () => {
    const lancamento = inserirLancamento(banco, salario)
    definirLancamentoRecorrente(banco, lancamento.id, true, '2026-09-19')

    gerarLancamentosRecorrentes(banco, '2026-09-30')

    expect(listarLancamentos(banco)).toHaveLength(1)
  })

  it('desmarcar pausa a recorrência e marcar de novo retoma, sem criar outra', () => {
    const lancamento = inserirLancamento(banco, salario)
    definirLancamentoRecorrente(banco, lancamento.id, true, '2026-09-19')

    definirLancamentoRecorrente(banco, lancamento.id, false, '2026-09-19')
    expect(listarRecorrencias(banco)[0].ativa).toBe(false)

    definirLancamentoRecorrente(banco, lancamento.id, true, '2026-09-19')
    expect(listarRecorrencias(banco)).toHaveLength(1)
    expect(listarRecorrencias(banco)[0].ativa).toBe(true)
  })

  it('desmarcar um lançamento que nunca foi recorrente não faz nada', () => {
    const lancamento = inserirLancamento(banco, salario)

    definirLancamentoRecorrente(banco, lancamento.id, false, '2026-09-19')

    expect(listarRecorrencias(banco)).toEqual([])
  })

  it('recusa reembolso e compra no cartão', () => {
    const despesa = inserirLancamento(banco, { ...salario, tipo: 'despesa' })
    const reembolso = inserirLancamento(banco, {
      ...salario,
      tipo: 'reembolso',
      reembolsoDeId: despesa.id,
      valorCentavos: 1000
    })
    const cartao = inserirCartao(banco, itau)
    registrarCompraNoCartao(banco, {
      cartaoId: cartao.id,
      descricao: 'Fone',
      valorTotalCentavos: 10000,
      parcelas: 1,
      dataDaCompra: '2026-09-10',
      categoria: 'Tecnologia'
    })
    const daCompra = listarLancamentos(banco).find((l) => l.descricao === 'Fone')!

    expect(() => definirLancamentoRecorrente(banco, reembolso.id, true, '2026-09-19')).toThrow(
      'reembolso'
    )
    expect(() => definirLancamentoRecorrente(banco, daCompra.id, true, '2026-09-19')).toThrow(
      'cartão'
    )
  })
})
