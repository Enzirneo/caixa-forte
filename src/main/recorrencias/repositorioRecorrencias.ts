import type { Database } from 'better-sqlite3'
import type { TipoDeRecorrencia } from '../../shared/lancamentos/tipos'
import type {
  NovaRecorrencia,
  Recorrencia,
  RecorrenciaEditada
} from '../../shared/recorrencias/tipos'
import { obterOuCriarCategoria } from '../categorias/repositorioCategorias'

interface LinhaRecorrencia {
  id: number
  descricao: string
  valor_centavos: number
  tipo: TipoDeRecorrencia
  categoria: string
  dia_do_mes: number
  mes_de_inicio: string
  mes_de_fim: string | null
  cartao_id: number | null
  ativa: number
}

const SELECIONAR_RECORRENCIAS = `
  SELECT r.id, r.descricao, r.valor_centavos, r.tipo, c.nome AS categoria,
         r.dia_do_mes, r.mes_de_inicio, r.mes_de_fim, r.cartao_id, r.ativa
  FROM recorrencias r
  JOIN categorias c ON c.id = r.categoria_id
`

function converterLinhaEmRecorrencia(linha: LinhaRecorrencia): Recorrencia {
  return {
    id: linha.id,
    descricao: linha.descricao,
    valorCentavos: linha.valor_centavos,
    tipo: linha.tipo,
    categoria: linha.categoria,
    diaDoMes: linha.dia_do_mes,
    mesDeInicio: linha.mes_de_inicio,
    mesDeFim: linha.mes_de_fim,
    cartaoId: linha.cartao_id,
    ativa: linha.ativa === 1
  }
}

export function listarRecorrencias(banco: Database): Recorrencia[] {
  const linhas = banco
    .prepare(`${SELECIONAR_RECORRENCIAS} ORDER BY r.ativa DESC, r.dia_do_mes, r.descricao`)
    .all() as LinhaRecorrencia[]
  return linhas.map(converterLinhaEmRecorrencia)
}

export function inserirRecorrencia(banco: Database, nova: NovaRecorrencia): Recorrencia {
  const inserirEmTransacao = banco.transaction(() => {
    const categoriaId = obterOuCriarCategoria(banco, nova.categoria)
    const { lastInsertRowid } = banco
      .prepare(
        `INSERT INTO recorrencias
           (descricao, valor_centavos, tipo, categoria_id, dia_do_mes, mes_de_inicio, mes_de_fim,
            cartao_id)
         VALUES (@descricao, @valorCentavos, @tipo, @categoriaId, @diaDoMes, @mesDeInicio,
                 @mesDeFim, @cartaoId)`
      )
      .run({ ...nova, cartaoId: nova.cartaoId ?? null, categoriaId })
    return Number(lastInsertRowid)
  })
  const id = inserirEmTransacao()
  const linha = banco
    .prepare(`${SELECIONAR_RECORRENCIAS} WHERE r.id = ?`)
    .get(id) as LinhaRecorrencia
  return converterLinhaEmRecorrencia(linha)
}

export function atualizarRecorrencia(banco: Database, recorrencia: RecorrenciaEditada): void {
  const atualizarEmTransacao = banco.transaction(() => {
    const categoriaId = obterOuCriarCategoria(banco, recorrencia.categoria)
    return banco
      .prepare(
        `UPDATE recorrencias
         SET descricao = @descricao, valor_centavos = @valorCentavos, tipo = @tipo,
             categoria_id = @categoriaId, dia_do_mes = @diaDoMes,
             mes_de_inicio = @mesDeInicio, mes_de_fim = @mesDeFim, cartao_id = @cartaoId
         WHERE id = @id`
      )
      .run({ ...recorrencia, cartaoId: recorrencia.cartaoId ?? null, categoriaId }).changes
  })
  if (atualizarEmTransacao() === 0) throw new Error(`Recorrência ${recorrencia.id} não encontrada`)
}

export function definirRecorrenciaAtiva(banco: Database, id: number, ativa: boolean): void {
  const { changes } = banco
    .prepare('UPDATE recorrencias SET ativa = ? WHERE id = ?')
    .run(ativa ? 1 : 0, id)
  if (changes === 0) throw new Error(`Recorrência ${id} não encontrada`)
}

export function definirFimDaRecorrencia(
  banco: Database,
  id: number,
  mesDeFim: string | null
): void {
  banco.prepare('UPDATE recorrencias SET mes_de_fim = ? WHERE id = ?').run(mesDeFim, id)
}

// Os lançamentos que ela já criou continuam: só a regra de criar os próximos é removida.
export function excluirRecorrencia(banco: Database, id: number): void {
  banco.prepare('DELETE FROM recorrencias WHERE id = ?').run(id)
}

export function listarCompetenciasGeradas(banco: Database, recorrenciaId: number): Set<string> {
  const linhas = banco
    .prepare('SELECT competencia FROM recorrencias_geradas WHERE recorrencia_id = ?')
    .all(recorrenciaId) as { competencia: string }[]
  return new Set(linhas.map((linha) => linha.competencia))
}

export function registrarCompetenciaGerada(
  banco: Database,
  recorrenciaId: number,
  competencia: string
): void {
  banco
    .prepare('INSERT INTO recorrencias_geradas (recorrencia_id, competencia) VALUES (?, ?)')
    .run(recorrenciaId, competencia)
}
