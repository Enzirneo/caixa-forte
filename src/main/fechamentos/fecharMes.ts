import type { Database } from 'better-sqlite3'
import {
  identificarMesesParaFechar,
  validarFechamento
} from '../../shared/fechamentos/regrasDeFechamento'
import { calcularResumo, filtrarPorMes } from '../../shared/lancamentos/resumo'
import { listarLancamentos } from '../lancamentos/repositorioLancamentos'
import { inserirFechamento, listarFechamentos, removerFechamento } from './repositorioFechamentos'

function registrarFechamento(banco: Database, mes: string): void {
  const { receitasCentavos, despesasCentavos } = calcularResumo(
    filtrarPorMes(listarLancamentos(banco), mes)
  )
  inserirFechamento(banco, { mes, receitasCentavos, despesasCentavos })
}

export function fecharMes(banco: Database, mes: string, mesAtual: string): void {
  const erros = validarFechamento(mes, mesAtual, listarFechamentos(banco))
  if (erros.length > 0) throw new Error(erros.join(' '))
  registrarFechamento(banco, mes)
}

export function fecharMesesEncerrados(banco: Database, mesAtual: string): void {
  const mesesParaFechar = identificarMesesParaFechar(
    listarLancamentos(banco),
    listarFechamentos(banco),
    mesAtual
  )
  mesesParaFechar.forEach((mes) => fecharMes(banco, mes, mesAtual))
}

export function refazerFechamento(banco: Database, mes: string): void {
  const estaFechado = listarFechamentos(banco).some((fechamento) => fechamento.mes === mes)
  if (!estaFechado) throw new Error('Este mês não está fechado.')

  banco.transaction(() => {
    removerFechamento(banco, mes)
    registrarFechamento(banco, mes)
  })()
}
