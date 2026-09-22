import type { Database } from 'better-sqlite3'
import { indexarAjustesDoCartao } from '../../shared/cartoes/cicloDaFatura'
import { montarParcelasDaCompra } from '../../shared/cartoes/regras'
import type {
  AjusteDeFechamento,
  Cartao,
  NovaCompraNoCartao,
  NovoCartao,
  VinculoDeCompra
} from '../../shared/cartoes/tipos'
import { inserirLancamento } from '../lancamentos/repositorioLancamentos'

interface LinhaCartao {
  id: number
  nome: string
  dia_de_fechamento: number
  dia_de_vencimento: number
  dias_antes_do_vencimento: number | null
  limite_centavos: number | null
  paga_pela_conta_corrente: number
}

interface LinhaAjuste {
  cartao_id: number
  mes_do_vencimento: string
  melhor_data_de_compra: string
}

interface LinhaVinculo {
  lancamento_id: number
  cartao_id: number
  grupo_id: number
  data_da_compra: string
  parcela_numero: number
  parcelas_total: number
}

function converterLinhaEmCartao(linha: LinhaCartao): Cartao {
  return {
    id: linha.id,
    nome: linha.nome,
    diaDeFechamento: linha.dia_de_fechamento,
    diaDeVencimento: linha.dia_de_vencimento,
    diasAntesDoVencimento: linha.dias_antes_do_vencimento,
    limiteCentavos: linha.limite_centavos,
    pagaPelaContaCorrente: linha.paga_pela_conta_corrente === 1
  }
}

export function listarCartoes(banco: Database): Cartao[] {
  const linhas = banco
    .prepare('SELECT * FROM cartoes ORDER BY nome COLLATE NOCASE')
    .all() as LinhaCartao[]
  return linhas.map(converterLinhaEmCartao)
}

export function buscarCartaoPorId(banco: Database, id: number): Cartao | undefined {
  const linha = banco.prepare('SELECT * FROM cartoes WHERE id = ?').get(id) as
    LinhaCartao | undefined
  return linha ? converterLinhaEmCartao(linha) : undefined
}

export function inserirCartao(banco: Database, novo: NovoCartao): Cartao {
  const { lastInsertRowid } = banco
    .prepare(
      `INSERT INTO cartoes
         (nome, dia_de_fechamento, dia_de_vencimento, dias_antes_do_vencimento, limite_centavos,
          paga_pela_conta_corrente)
       VALUES (@nome, @diaDeFechamento, @diaDeVencimento, @diasAntesDoVencimento, @limiteCentavos,
               @pagaPelaContaCorrente)`
    )
    .run({ ...novo, pagaPelaContaCorrente: novo.pagaPelaContaCorrente ? 1 : 0 })
  return { id: Number(lastInsertRowid), ...novo }
}

export function atualizarCartao(banco: Database, cartao: Cartao): void {
  const { changes } = banco
    .prepare(
      `UPDATE cartoes
       SET nome = @nome, dia_de_fechamento = @diaDeFechamento,
           dia_de_vencimento = @diaDeVencimento,
           dias_antes_do_vencimento = @diasAntesDoVencimento, limite_centavos = @limiteCentavos,
           paga_pela_conta_corrente = @pagaPelaContaCorrente
       WHERE id = @id`
    )
    .run({ ...cartao, pagaPelaContaCorrente: cartao.pagaPelaContaCorrente ? 1 : 0 })
  if (changes === 0) throw new Error(`Cartão ${cartao.id} não encontrado`)
}

export function contarComprasDoCartao(banco: Database, cartaoId: number): number {
  const { total } = banco
    .prepare('SELECT COUNT(*) AS total FROM compras_no_cartao WHERE cartao_id = ?')
    .get(cartaoId) as { total: number }
  return total
}

export function excluirCartao(banco: Database, id: number): void {
  if (contarComprasDoCartao(banco, id) > 0) {
    throw new Error('Este cartão tem compras registradas. Exclua as compras antes.')
  }
  const { total } = banco
    .prepare('SELECT COUNT(*) AS total FROM recorrencias WHERE cartao_id = ?')
    .get(id) as { total: number }
  if (total > 0) {
    throw new Error('Este cartão é usado em recorrências. Tire o cartão delas antes.')
  }
  banco.prepare('DELETE FROM cartoes WHERE id = ?').run(id)
}

export function listarVinculos(banco: Database): VinculoDeCompra[] {
  const linhas = banco.prepare('SELECT * FROM compras_no_cartao').all() as LinhaVinculo[]
  return linhas.map((linha) => ({
    lancamentoId: linha.lancamento_id,
    cartaoId: linha.cartao_id,
    grupoId: linha.grupo_id,
    dataDaCompra: linha.data_da_compra,
    parcelaNumero: linha.parcela_numero,
    parcelasTotal: linha.parcelas_total
  }))
}

export function listarAjustes(banco: Database): AjusteDeFechamento[] {
  const linhas = banco.prepare('SELECT * FROM ajustes_de_fechamento').all() as LinhaAjuste[]
  return linhas.map((linha) => ({
    cartaoId: linha.cartao_id,
    mesDoVencimento: linha.mes_do_vencimento,
    melhorDataDeCompra: linha.melhor_data_de_compra
  }))
}

export function salvarAjuste(banco: Database, ajuste: AjusteDeFechamento): void {
  banco
    .prepare(
      `INSERT INTO ajustes_de_fechamento (cartao_id, mes_do_vencimento, melhor_data_de_compra)
       VALUES (@cartaoId, @mesDoVencimento, @melhorDataDeCompra)
       ON CONFLICT (cartao_id, mes_do_vencimento)
       DO UPDATE SET melhor_data_de_compra = excluded.melhor_data_de_compra`
    )
    .run(ajuste)
}

export function removerAjuste(banco: Database, cartaoId: number, mesDoVencimento: string): void {
  banco
    .prepare('DELETE FROM ajustes_de_fechamento WHERE cartao_id = ? AND mes_do_vencimento = ?')
    .run(cartaoId, mesDoVencimento)
}

// Cria uma despesa por parcela e liga todas à mesma compra; ou entra tudo, ou nada.
// Devolve os ids dos lançamentos criados, um por parcela, na ordem das parcelas.
export function criarCompraNoCartao(banco: Database, compra: NovaCompraNoCartao): number[] {
  const cartao = buscarCartaoPorId(banco, compra.cartaoId)
  if (!cartao) throw new Error('Cartão não encontrado.')

  const registrarEmTransacao = banco.transaction(() => {
    const inserirVinculo = banco.prepare(
      `INSERT INTO compras_no_cartao
         (lancamento_id, cartao_id, grupo_id, data_da_compra, parcela_numero, parcelas_total)
       VALUES (@lancamentoId, @cartaoId, @grupoId, @dataDaCompra, @parcelaNumero, @parcelasTotal)`
    )

    let grupoId = 0
    const lancamentoIds: number[] = []
    const ajustes = indexarAjustesDoCartao(listarAjustes(banco), cartao.id)
    for (const parcela of montarParcelasDaCompra(compra, cartao, ajustes)) {
      const lancamento = inserirLancamento(banco, parcela.lancamento)
      if (grupoId === 0) grupoId = lancamento.id
      lancamentoIds.push(lancamento.id)
      inserirVinculo.run({
        lancamentoId: lancamento.id,
        cartaoId: cartao.id,
        grupoId,
        dataDaCompra: compra.dataDaCompra,
        parcelaNumero: parcela.parcelaNumero,
        parcelasTotal: parcela.parcelasTotal
      })
    }
    return lancamentoIds
  })
  return registrarEmTransacao()
}

export function registrarCompraNoCartao(banco: Database, compra: NovaCompraNoCartao): number {
  return criarCompraNoCartao(banco, compra).length
}

// Apagar os lançamentos leva junto os vínculos (ON DELETE CASCADE).
export function excluirCompraNoCartao(banco: Database, grupoId: number): void {
  banco
    .prepare(
      `DELETE FROM lancamentos
       WHERE id IN (SELECT lancamento_id FROM compras_no_cartao WHERE grupo_id = ?)`
    )
    .run(grupoId)
}
