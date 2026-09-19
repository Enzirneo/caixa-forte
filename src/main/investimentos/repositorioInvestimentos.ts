import type { Database } from 'better-sqlite3'
import type {
  Destino,
  Movimentacao,
  NovaMovimentacao,
  NovoDestino,
  PeriodicidadeDaTaxa,
  TipoDestino,
  TipoMovimentacao
} from '../../shared/investimentos/tipos'

interface LinhaDestino {
  id: number
  nome: string
  tipo: TipoDestino
  taxa_rendimento_centesimos: number | null
  periodicidade_taxa: PeriodicidadeDaTaxa | null
}

interface LinhaMovimentacao {
  id: number
  destino_id: number
  tipo: TipoMovimentacao
  valor_centavos: number
  data: string
}

function converterLinhaEmDestino(linha: LinhaDestino): Destino {
  return {
    id: linha.id,
    nome: linha.nome,
    tipo: linha.tipo,
    taxaRendimentoCentesimos: linha.taxa_rendimento_centesimos,
    periodicidadeDaTaxa: linha.periodicidade_taxa
  }
}

function converterLinhaEmMovimentacao(linha: LinhaMovimentacao): Movimentacao {
  return {
    id: linha.id,
    destinoId: linha.destino_id,
    tipo: linha.tipo,
    valorCentavos: linha.valor_centavos,
    data: linha.data
  }
}

export function listarDestinos(banco: Database): Destino[] {
  const linhas = banco
    .prepare('SELECT * FROM destinos_investimento ORDER BY nome COLLATE NOCASE')
    .all() as LinhaDestino[]
  return linhas.map(converterLinhaEmDestino)
}

export function inserirDestino(banco: Database, novoDestino: NovoDestino): Destino {
  const { lastInsertRowid } = banco
    .prepare(
      `INSERT INTO destinos_investimento (nome, tipo, taxa_rendimento_centesimos, periodicidade_taxa)
       VALUES (@nome, @tipo, @taxaRendimentoCentesimos, @periodicidadeDaTaxa)`
    )
    .run(novoDestino)
  return { id: Number(lastInsertRowid), ...novoDestino }
}

export function listarMovimentacoes(banco: Database): Movimentacao[] {
  const linhas = banco
    .prepare('SELECT * FROM movimentacoes_investimento ORDER BY data DESC, id DESC')
    .all() as LinhaMovimentacao[]
  return linhas.map(converterLinhaEmMovimentacao)
}

export function inserirMovimentacao(
  banco: Database,
  novaMovimentacao: NovaMovimentacao
): Movimentacao {
  const { lastInsertRowid } = banco
    .prepare(
      `INSERT INTO movimentacoes_investimento (destino_id, tipo, valor_centavos, data)
       VALUES (@destinoId, @tipo, @valorCentavos, @data)`
    )
    .run(novaMovimentacao)
  return { id: Number(lastInsertRowid), ...novaMovimentacao }
}

export function excluirMovimentacao(banco: Database, id: number): void {
  banco.prepare('DELETE FROM movimentacoes_investimento WHERE id = ?').run(id)
}
