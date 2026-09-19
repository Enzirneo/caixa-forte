import type { Database } from 'better-sqlite3'
import type { FechamentoMes } from '../../shared/fechamentos/tipos'

const AGORA_COM_MILISSEGUNDOS = "strftime('%Y-%m-%d %H:%M:%f', 'now')"

interface LinhaFechamento {
  mes: string
  fechado_em: string
  receitas_centavos: number
  despesas_centavos: number
}

export function listarFechamentos(banco: Database): FechamentoMes[] {
  const linhas = banco
    .prepare('SELECT * FROM fechamentos_meses ORDER BY mes DESC')
    .all() as LinhaFechamento[]
  return linhas.map((linha) => ({
    mes: linha.mes,
    fechadoEm: linha.fechado_em,
    receitasCentavos: linha.receitas_centavos,
    despesasCentavos: linha.despesas_centavos
  }))
}

export function inserirFechamento(
  banco: Database,
  fechamento: Pick<FechamentoMes, 'mes' | 'receitasCentavos' | 'despesasCentavos'>
): void {
  banco
    .prepare(
      `INSERT INTO fechamentos_meses (mes, fechado_em, receitas_centavos, despesas_centavos)
       VALUES (@mes, ${AGORA_COM_MILISSEGUNDOS}, @receitasCentavos, @despesasCentavos)`
    )
    .run(fechamento)
}

export function removerFechamento(banco: Database, mes: string): void {
  banco.prepare('DELETE FROM fechamentos_meses WHERE mes = ?').run(mes)
}
