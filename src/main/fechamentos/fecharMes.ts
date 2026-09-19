import type { Database } from 'better-sqlite3'
import { validarFechamento } from '../../shared/fechamentos/regrasDeFechamento'
import { calcularResumo, filtrarPorMes } from '../../shared/lancamentos/resumo'
import { listarLancamentos } from '../lancamentos/repositorioLancamentos'
import { inserirFechamento, listarFechamentos } from './repositorioFechamentos'

export function fecharMes(banco: Database, mes: string, mesAtual: string): void {
  const erros = validarFechamento(mes, mesAtual, listarFechamentos(banco))
  if (erros.length > 0) throw new Error(erros.join(' '))

  const { receitasCentavos, despesasCentavos } = calcularResumo(
    filtrarPorMes(listarLancamentos(banco), mes)
  )
  inserirFechamento(banco, { mes, receitasCentavos, despesasCentavos })
}
