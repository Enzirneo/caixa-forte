import type { Database } from 'better-sqlite3'
import { CATEGORIA_PARA_NOME_VAZIO } from '../../shared/categorias/nomeDaCategoria'
import type {
  Lancamento,
  LancamentoEditado,
  NovoLancamento,
  TipoLancamento
} from '../../shared/lancamentos/tipos'
import { obterOuCriarCategoria } from '../categorias/repositorioCategorias'

const AGORA_COM_MILISSEGUNDOS = "strftime('%Y-%m-%d %H:%M:%f', 'now')"

const SELECIONAR_LANCAMENTOS = `
  SELECT l.id, l.descricao, l.valor_centavos, l.data, l.tipo, l.alterado_em,
         COALESCE(c.nome, ?) AS categoria
  FROM lancamentos l
  LEFT JOIN categorias c ON c.id = l.categoria_id
`

interface LinhaLancamento {
  id: number
  descricao: string
  valor_centavos: number
  data: string
  tipo: TipoLancamento
  categoria: string
  alterado_em: string
}

function converterLinhaEmLancamento(linha: LinhaLancamento): Lancamento {
  return {
    id: linha.id,
    descricao: linha.descricao,
    valorCentavos: linha.valor_centavos,
    data: linha.data,
    tipo: linha.tipo,
    categoria: linha.categoria,
    alteradoEm: linha.alterado_em
  }
}

function buscarLancamentoPorId(banco: Database, id: number): Lancamento {
  const linha = banco
    .prepare(`${SELECIONAR_LANCAMENTOS} WHERE l.id = ?`)
    .get(CATEGORIA_PARA_NOME_VAZIO, id) as LinhaLancamento
  return converterLinhaEmLancamento(linha)
}

export function listarLancamentos(banco: Database): Lancamento[] {
  const linhas = banco
    .prepare(`${SELECIONAR_LANCAMENTOS} ORDER BY l.data DESC, l.id DESC`)
    .all(CATEGORIA_PARA_NOME_VAZIO) as LinhaLancamento[]
  return linhas.map(converterLinhaEmLancamento)
}

export function inserirLancamento(banco: Database, novoLancamento: NovoLancamento): Lancamento {
  const inserirEmTransacao = banco.transaction(() => {
    const categoriaId = obterOuCriarCategoria(banco, novoLancamento.categoria)
    const { lastInsertRowid } = banco
      .prepare(
        `INSERT INTO lancamentos (descricao, valor_centavos, data, tipo, categoria_id, alterado_em)
         VALUES (@descricao, @valorCentavos, @data, @tipo, @categoriaId, ${AGORA_COM_MILISSEGUNDOS})`
      )
      .run({ ...novoLancamento, categoriaId })
    return Number(lastInsertRowid)
  })
  return buscarLancamentoPorId(banco, inserirEmTransacao())
}

export function atualizarLancamento(banco: Database, lancamento: LancamentoEditado): void {
  const atualizarEmTransacao = banco.transaction(() => {
    const categoriaId = obterOuCriarCategoria(banco, lancamento.categoria)
    return banco
      .prepare(
        `UPDATE lancamentos
         SET descricao = @descricao, valor_centavos = @valorCentavos,
             data = @data, tipo = @tipo, categoria_id = @categoriaId,
             alterado_em = ${AGORA_COM_MILISSEGUNDOS}
         WHERE id = @id`
      )
      .run({ ...lancamento, categoriaId }).changes
  })
  if (atualizarEmTransacao() === 0) throw new Error(`Lançamento ${lancamento.id} não encontrado`)
}

export function excluirLancamento(banco: Database, id: number): void {
  banco.prepare('DELETE FROM lancamentos WHERE id = ?').run(id)
}

export function inserirVariosLancamentos(
  banco: Database,
  novosLancamentos: NovoLancamento[]
): number {
  banco.transaction(() => {
    novosLancamentos.forEach((novoLancamento) => inserirLancamento(banco, novoLancamento))
  })()
  return novosLancamentos.length
}
