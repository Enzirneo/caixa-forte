import { obterDataIsoDeHoje } from '../datas/dataIso'
import { converterTextoEmCentavos } from '../dinheiro/converterTextoEmCentavos'
import type { NovoLancamento, TipoLancamento } from '../lancamentos/tipos'
import { validarNovoLancamento } from '../lancamentos/validarNovoLancamento'
import { converterTextoEmDataIso } from './converterTextoEmDataIso'
import {
  CATEGORIA_PADRAO_DA_IMPORTACAO,
  type CelulaDaPlanilha,
  type LinhaInterpretada
} from './tipos'

const CENTAVOS_POR_REAL = 100
const PRIMEIRO_CARACTERE_DO_ANO = 0
const TAMANHO_DO_ANO = 4

function normalizarTexto(celula: CelulaDaPlanilha): string {
  return String(celula ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function ehLinhaVazia(celulas: CelulaDaPlanilha[]): boolean {
  return celulas.every((celula) => normalizarTexto(celula) === '')
}

function ehCabecalho(celulas: CelulaDaPlanilha[]): boolean {
  return normalizarTexto(celulas[0]) === 'data' && normalizarTexto(celulas[1]).startsWith('descri')
}

function converterCelulaEmData(celula: CelulaDaPlanilha, dataDoLote: string): string | null {
  if (celula === null || celula === '') return dataDoLote
  if (celula instanceof Date) return obterDataIsoDeHoje(celula)
  const anoDoLote = Number(dataDoLote.slice(PRIMEIRO_CARACTERE_DO_ANO, TAMANHO_DO_ANO))
  return converterTextoEmDataIso(String(celula), anoDoLote)
}

// O número vem de uma planilha já como decimal; arredondamos aqui, na entrada, e daí em diante
// o valor é sempre inteiro em centavos.
function converterCelulaEmCentavos(celula: CelulaDaPlanilha): number | null {
  if (typeof celula === 'number') return Math.round(celula * CENTAVOS_POR_REAL)
  return converterTextoEmCentavos(String(celula ?? ''))
}

function converterCelulaEmTipo(celula: CelulaDaPlanilha): TipoLancamento | null {
  const texto = normalizarTexto(celula)
  if (texto === '' || texto === 'despesa') return 'despesa'
  if (texto === 'receita') return 'receita'
  return null
}

function montarTextoOriginal(celulas: CelulaDaPlanilha[]): string {
  return celulas.map((celula) => String(celula ?? '')).join(' | ')
}

export function interpretarLinhaTabular(
  celulas: CelulaDaPlanilha[],
  numeroDaLinha: number,
  dataDoLote: string
): LinhaInterpretada | null {
  if (ehLinhaVazia(celulas) || ehCabecalho(celulas)) return null

  const textoOriginal = montarTextoOriginal(celulas)
  const [celulaData, celulaDescricao, celulaValor, celulaTipo, celulaCategoria] = celulas
  const erros: string[] = []

  const data = converterCelulaEmData(celulaData ?? null, dataDoLote)
  if (data === null) erros.push('Data inválida.')

  const valorCentavos = converterCelulaEmCentavos(celulaValor ?? null)
  if (valorCentavos === null) erros.push('Valor inválido.')

  const tipo = converterCelulaEmTipo(celulaTipo ?? null)
  if (tipo === null) erros.push('O tipo deve ser receita ou despesa.')

  if (erros.length > 0 || data === null || valorCentavos === null || tipo === null) {
    return { numeroDaLinha, textoOriginal, lancamento: null, erros }
  }

  const lancamento: NovoLancamento = {
    descricao: String(celulaDescricao ?? '').trim(),
    valorCentavos,
    data,
    tipo,
    categoria: String(celulaCategoria ?? '').trim() || CATEGORIA_PADRAO_DA_IMPORTACAO
  }
  const errosDeValidacao = validarNovoLancamento(lancamento)
  return {
    numeroDaLinha,
    textoOriginal,
    lancamento: errosDeValidacao.length === 0 ? lancamento : null,
    erros: errosDeValidacao
  }
}
