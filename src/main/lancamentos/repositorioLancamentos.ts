import type { Database } from 'better-sqlite3'
import type { Lancamento, NovoLancamento, TipoLancamento } from '../../shared/lancamentos/tipos'

interface LinhaLancamento {
  id: number
  descricao: string
  valor_centavos: number
  data: string
  tipo: TipoLancamento
  categoria: string
}

function converterLinhaEmLancamento(linha: LinhaLancamento): Lancamento {
  return {
    id: linha.id,
    descricao: linha.descricao,
    valorCentavos: linha.valor_centavos,
    data: linha.data,
    tipo: linha.tipo,
    categoria: linha.categoria
  }
}

export function listarLancamentos(banco: Database): Lancamento[] {
  const linhas = banco
    .prepare('SELECT * FROM lancamentos ORDER BY data DESC, id DESC')
    .all() as LinhaLancamento[]
  return linhas.map(converterLinhaEmLancamento)
}

export function inserirLancamento(banco: Database, novoLancamento: NovoLancamento): Lancamento {
  const { lastInsertRowid } = banco
    .prepare(
      `INSERT INTO lancamentos (descricao, valor_centavos, data, tipo, categoria)
       VALUES (@descricao, @valorCentavos, @data, @tipo, @categoria)`
    )
    .run(novoLancamento)
  return { id: Number(lastInsertRowid), ...novoLancamento }
}

export function excluirLancamento(banco: Database, id: number): void {
  banco.prepare('DELETE FROM lancamentos WHERE id = ?').run(id)
}

export function atualizarLancamento(banco: Database, lancamento: Lancamento): void {
  const { changes } = banco
    .prepare(
      `UPDATE lancamentos
       SET descricao = @descricao, valor_centavos = @valorCentavos,
           data = @data, tipo = @tipo, categoria = @categoria
       WHERE id = @id`
    )
    .run(lancamento)
  if (changes === 0) throw new Error(`Lançamento ${lancamento.id} não encontrado`)
}
