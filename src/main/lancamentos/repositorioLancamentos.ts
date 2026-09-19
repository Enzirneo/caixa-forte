import type { Database } from 'better-sqlite3'
import type {
  Lancamento,
  LancamentoEditado,
  NovoLancamento,
  TipoLancamento
} from '../../shared/lancamentos/tipos'

const AGORA_COM_MILISSEGUNDOS = "strftime('%Y-%m-%d %H:%M:%f', 'now')"

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
  const linha = banco.prepare('SELECT * FROM lancamentos WHERE id = ?').get(id) as LinhaLancamento
  return converterLinhaEmLancamento(linha)
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
      `INSERT INTO lancamentos (descricao, valor_centavos, data, tipo, categoria, alterado_em)
       VALUES (@descricao, @valorCentavos, @data, @tipo, @categoria, ${AGORA_COM_MILISSEGUNDOS})`
    )
    .run(novoLancamento)
  return buscarLancamentoPorId(banco, Number(lastInsertRowid))
}

export function atualizarLancamento(banco: Database, lancamento: LancamentoEditado): void {
  const { changes } = banco
    .prepare(
      `UPDATE lancamentos
       SET descricao = @descricao, valor_centavos = @valorCentavos,
           data = @data, tipo = @tipo, categoria = @categoria,
           alterado_em = ${AGORA_COM_MILISSEGUNDOS}
       WHERE id = @id`
    )
    .run(lancamento)
  if (changes === 0) throw new Error(`Lançamento ${lancamento.id} não encontrado`)
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
