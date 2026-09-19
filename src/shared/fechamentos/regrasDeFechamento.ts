import { obterMesDaData } from '../datas/mes'
import type { Lancamento } from '../lancamentos/tipos'
import type { FechamentoMes } from './tipos'

const PADRAO_MES = /^\d{4}-(0[1-9]|1[0-2])$/

export function validarFechamento(
  mes: string,
  mesAtual: string,
  fechamentos: FechamentoMes[]
): string[] {
  if (!PADRAO_MES.test(mes)) return ['Mês inválido.']
  if (mes >= mesAtual) return ['Só é possível fechar meses que já terminaram.']
  if (fechamentos.some((fechamento) => fechamento.mes === mes)) return ['Este mês já está fechado.']
  return []
}

export function foiAlteradoAposFechamento(
  lancamento: Lancamento,
  fechamentos: FechamentoMes[]
): boolean {
  const mesDoLancamento = obterMesDaData(lancamento.data)
  const fechamento = fechamentos.find((candidato) => candidato.mes === mesDoLancamento)
  return fechamento !== undefined && lancamento.alteradoEm > fechamento.fechadoEm
}
