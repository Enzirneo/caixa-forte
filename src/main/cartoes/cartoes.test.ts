import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import type { NovaCompraNoCartao, NovoCartao } from '../../shared/cartoes/tipos'
import { executarMigracoes } from '../banco/migracoes/executarMigracoes'
import { listaDeMigracoes } from '../banco/migracoes/listaDeMigracoes'
import { excluirLancamento, listarLancamentos } from '../lancamentos/repositorioLancamentos'
import {
  atualizarCartao,
  excluirCartao,
  excluirCompraNoCartao,
  inserirCartao,
  listarAjustes,
  listarCartoes,
  listarVinculos,
  registrarCompraNoCartao,
  removerAjuste,
  salvarAjuste
} from './repositorioCartoes'

const nubank: NovoCartao = {
  nome: 'Nubank',
  diaDeFechamento: 25,
  diaDeVencimento: 5,
  diasAntesDoVencimento: null,
  limiteCentavos: 500000
}

function comprar(
  cartaoId: number,
  sobrescritas: Partial<NovaCompraNoCartao> = {}
): NovaCompraNoCartao {
  return {
    cartaoId,
    descricao: 'Notebook',
    valorTotalCentavos: 10000,
    parcelas: 3,
    dataDaCompra: '2026-09-10',
    categoria: 'Tecnologia',
    ...sobrescritas
  }
}

describe('cartões e compras parceladas', () => {
  let banco: Database.Database

  beforeEach(() => {
    banco = new Database(':memory:')
    banco.pragma('foreign_keys = ON')
    executarMigracoes(banco, listaDeMigracoes)
  })

  it('guarda, atualiza e lista cartões', () => {
    const cartao = inserirCartao(banco, nubank)
    atualizarCartao(banco, { ...cartao, nome: 'Nubank Ultravioleta', limiteCentavos: null })

    expect(listarCartoes(banco)).toEqual([
      {
        id: cartao.id,
        nome: 'Nubank Ultravioleta',
        diaDeFechamento: 25,
        diaDeVencimento: 5,
        diasAntesDoVencimento: null,
        limiteCentavos: null
      }
    ])
  })

  it('a compra parcelada vira uma despesa por parcela, no vencimento da fatura', () => {
    const cartao = inserirCartao(banco, nubank)

    const criadas = registrarCompraNoCartao(banco, comprar(cartao.id))

    const lancamentos = listarLancamentos(banco).sort((a, b) => a.data.localeCompare(b.data))
    expect(criadas).toBe(3)
    expect(lancamentos.map((l) => [l.descricao, l.valorCentavos, l.data, l.tipo])).toEqual([
      ['Notebook (1/3)', 3334, '2026-10-05', 'despesa'],
      ['Notebook (2/3)', 3333, '2026-11-05', 'despesa'],
      ['Notebook (3/3)', 3333, '2026-12-05', 'despesa']
    ])
    expect(lancamentos.reduce((soma, l) => soma + l.valorCentavos, 0)).toBe(10000)
  })

  it('todas as parcelas ficam ligadas ao mesmo grupo e ao cartão', () => {
    const cartao = inserirCartao(banco, nubank)
    registrarCompraNoCartao(banco, comprar(cartao.id))

    const vinculos = listarVinculos(banco)

    expect(vinculos).toHaveLength(3)
    expect(new Set(vinculos.map((v) => v.grupoId)).size).toBe(1)
    expect(vinculos.every((v) => v.cartaoId === cartao.id && v.parcelasTotal === 3)).toBe(true)
    expect(vinculos.map((v) => v.parcelaNumero).sort()).toEqual([1, 2, 3])
  })

  it('duas compras têm grupos diferentes', () => {
    const cartao = inserirCartao(banco, nubank)
    registrarCompraNoCartao(banco, comprar(cartao.id))
    registrarCompraNoCartao(banco, comprar(cartao.id, { descricao: 'Fone', parcelas: 1 }))

    expect(new Set(listarVinculos(banco).map((v) => v.grupoId)).size).toBe(2)
  })

  it('excluir a compra apaga todas as parcelas e os vínculos', () => {
    const cartao = inserirCartao(banco, nubank)
    registrarCompraNoCartao(banco, comprar(cartao.id))
    registrarCompraNoCartao(banco, comprar(cartao.id, { descricao: 'Fone', parcelas: 1 }))
    const [primeiroVinculo] = listarVinculos(banco)

    excluirCompraNoCartao(banco, primeiroVinculo.grupoId)

    expect(listarLancamentos(banco).map((l) => l.descricao)).toEqual(['Fone'])
    expect(listarVinculos(banco)).toHaveLength(1)
  })

  it('apagar só uma parcela pela lista comum remove só o vínculo dela', () => {
    const cartao = inserirCartao(banco, nubank)
    registrarCompraNoCartao(banco, comprar(cartao.id))
    const [vinculo] = listarVinculos(banco)

    excluirLancamento(banco, vinculo.lancamentoId)

    expect(listarLancamentos(banco)).toHaveLength(2)
    expect(listarVinculos(banco)).toHaveLength(2)
  })

  it('não deixa excluir um cartão que tem compras', () => {
    const cartao = inserirCartao(banco, nubank)
    registrarCompraNoCartao(banco, comprar(cartao.id))

    expect(() => excluirCartao(banco, cartao.id)).toThrow('compras registradas')
    expect(listarCartoes(banco)).toHaveLength(1)
  })

  it('exclui um cartão sem compras', () => {
    const cartao = inserirCartao(banco, nubank)

    excluirCartao(banco, cartao.id)

    expect(listarCartoes(banco)).toEqual([])
  })

  it('compra em cartão que não existe não cria nada', () => {
    expect(() => registrarCompraNoCartao(banco, comprar(99))).toThrow('Cartão não encontrado')
    expect(listarLancamentos(banco)).toEqual([])
  })

  it('se algo falhar no meio, nenhuma parcela é gravada', () => {
    const cartao = inserirCartao(banco, nubank)
    banco.exec('DROP TABLE compras_no_cartao')
    banco.exec(
      'CREATE TABLE compras_no_cartao (lancamento_id INTEGER PRIMARY KEY REFERENCES lancamentos (id) ON DELETE CASCADE, cartao_id INTEGER NOT NULL, grupo_id INTEGER NOT NULL, data_da_compra TEXT NOT NULL, parcela_numero INTEGER NOT NULL CHECK (parcela_numero < 2), parcelas_total INTEGER NOT NULL)'
    )

    expect(() => registrarCompraNoCartao(banco, comprar(cartao.id))).toThrow()
    expect(listarLancamentos(banco)).toEqual([])
  })

  describe('fechamento por dias antes do vencimento e ajustes por mês', () => {
    const itau: NovoCartao = {
      nome: 'Itaú',
      diaDeFechamento: 24,
      diaDeVencimento: 1,
      diasAntesDoVencimento: 6,
      limiteCentavos: null
    }

    it('guarda os dias antes do vencimento', () => {
      const cartao = inserirCartao(banco, itau)

      expect(listarCartoes(banco)[0]).toEqual({ id: cartao.id, ...itau })
    })

    it('a compra na melhor data já vence na fatura seguinte', () => {
      const cartao = inserirCartao(banco, itau)
      registrarCompraNoCartao(
        banco,
        comprar(cartao.id, { parcelas: 1, dataDaCompra: '2026-09-25' })
      )

      expect(listarLancamentos(banco).map((l) => l.data)).toEqual(['2026-11-01'])
    })

    it('o ajuste do mês muda a fatura em que a compra cai', () => {
      const cartao = inserirCartao(banco, itau)
      salvarAjuste(banco, {
        cartaoId: cartao.id,
        mesDoVencimento: '2026-10',
        melhorDataDeCompra: '2026-09-27'
      })
      registrarCompraNoCartao(
        banco,
        comprar(cartao.id, { parcelas: 1, dataDaCompra: '2026-09-25' })
      )

      expect(listarLancamentos(banco).map((l) => l.data)).toEqual(['2026-10-01'])
    })

    it('salvar de novo o mesmo mês troca a data, e remover apaga', () => {
      const cartao = inserirCartao(banco, itau)
      const ajuste = {
        cartaoId: cartao.id,
        mesDoVencimento: '2026-06',
        melhorDataDeCompra: '2026-05-23'
      }
      salvarAjuste(banco, ajuste)
      salvarAjuste(banco, { ...ajuste, melhorDataDeCompra: '2026-05-24' })

      expect(listarAjustes(banco)).toEqual([{ ...ajuste, melhorDataDeCompra: '2026-05-24' }])

      removerAjuste(banco, cartao.id, '2026-06')
      expect(listarAjustes(banco)).toEqual([])
    })

    it('excluir o cartão leva junto os ajustes dele', () => {
      const cartao = inserirCartao(banco, itau)
      salvarAjuste(banco, {
        cartaoId: cartao.id,
        mesDoVencimento: '2026-06',
        melhorDataDeCompra: '2026-05-23'
      })

      excluirCartao(banco, cartao.id)

      expect(listarAjustes(banco)).toEqual([])
    })
  })
})
