import { converterTextoEmCentavos } from '../dinheiro/converterTextoEmCentavos'
import type { NovoLancamento, TipoLancamento } from '../lancamentos/tipos'
import { validarNovoLancamento } from '../lancamentos/validarNovoLancamento'
import { converterTextoEmDataIso } from './converterTextoEmDataIso'
import { CATEGORIA_PADRAO_DA_IMPORTACAO, type LinhaInterpretada } from './tipos'

const PADRAO_DATA_NO_INICIO = /^(\d{1,2}\/\d{1,2}(?:\/(?:\d{4}|\d{2}))?)\s+/
const PADRAO_CATEGORIA = /(?:^|\s)#(\S+)/
const PADRAO_VALOR_NO_FIM = /(?:^|\s)(?:R\$\s*)?((?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?)\s*$/
const PRIMEIRO_CARACTERE_DO_ANO = 0
const TAMANHO_DO_ANO = 4

function rejeitar(
  textoOriginal: string,
  numeroDaLinha: number,
  erros: string[]
): LinhaInterpretada {
  return { numeroDaLinha, textoOriginal, lancamento: null, erros }
}

function extrairAno(dataIso: string): number {
  return Number(dataIso.slice(PRIMEIRO_CARACTERE_DO_ANO, TAMANHO_DO_ANO))
}

export function interpretarLinhaLivre(
  textoOriginal: string,
  numeroDaLinha: number,
  dataDoLote: string
): LinhaInterpretada {
  let resto = textoOriginal.trim()
  let tipo: TipoLancamento = 'despesa'
  if (resto.startsWith('+')) {
    tipo = 'receita'
    resto = resto.slice(1).trim()
  } else if (resto.startsWith('-')) {
    resto = resto.slice(1).trim()
  }

  let data = dataDoLote
  const dataNoInicio = PADRAO_DATA_NO_INICIO.exec(resto)
  if (dataNoInicio) {
    const dataConvertida = converterTextoEmDataIso(dataNoInicio[1], extrairAno(dataDoLote))
    if (dataConvertida === null) return rejeitar(textoOriginal, numeroDaLinha, ['Data inválida.'])
    data = dataConvertida
    resto = resto.slice(dataNoInicio[0].length)
  }

  const marcadorDeCategoria = PADRAO_CATEGORIA.exec(resto)
  const categoria = marcadorDeCategoria ? marcadorDeCategoria[1] : CATEGORIA_PADRAO_DA_IMPORTACAO
  if (marcadorDeCategoria) resto = resto.replace(PADRAO_CATEGORIA, ' ').trim()

  const valorNoFim = PADRAO_VALOR_NO_FIM.exec(resto)
  if (!valorNoFim) {
    return rejeitar(textoOriginal, numeroDaLinha, ['Não encontrei o valor no fim da linha.'])
  }

  const lancamento: NovoLancamento = {
    descricao: resto.slice(0, valorNoFim.index).trim(),
    valorCentavos: converterTextoEmCentavos(valorNoFim[1]) ?? 0,
    data,
    tipo,
    categoria
  }
  const erros = validarNovoLancamento(lancamento)
  return { numeroDaLinha, textoOriginal, lancamento: erros.length === 0 ? lancamento : null, erros }
}
