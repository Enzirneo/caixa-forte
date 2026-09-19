import { readSheet } from 'read-excel-file/universal'
import { normalizarCelulasDoXlsx } from '../../../shared/importacao/normalizarCelulasDoXlsx'
import type { CelulaDaPlanilha } from '../../../shared/importacao/tipos'

// Usa a versão sem Web Worker: o CSP do app não permite worker, e as planilhas de gastos
// são pequenas o bastante para ler na thread principal.
export async function lerPlanilhaXlsx(arquivo: File): Promise<CelulaDaPlanilha[][]> {
  const linhas = await readSheet(await arquivo.arrayBuffer())
  return normalizarCelulasDoXlsx(linhas)
}
