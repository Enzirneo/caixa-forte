import { ehDataIsoValida } from '../datas/dataIso'

const PADRAO_DATA_BRASILEIRA = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?$/
const TAMANHO_DO_ANO_ABREVIADO = 2
const SECULO_DO_ANO_ABREVIADO = 2000

export function converterTextoEmDataIso(texto: string, anoPadrao: number): string | null {
  const textoLimpo = texto.trim()
  if (ehDataIsoValida(textoLimpo)) return textoLimpo

  const partes = PADRAO_DATA_BRASILEIRA.exec(textoLimpo)
  if (!partes) return null

  const [, dia, mes, anoInformado] = partes
  const ano =
    anoInformado === undefined
      ? anoPadrao
      : anoInformado.length === TAMANHO_DO_ANO_ABREVIADO
        ? SECULO_DO_ANO_ABREVIADO + Number(anoInformado)
        : Number(anoInformado)

  const dataIso = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
  return ehDataIsoValida(dataIso) ? dataIso : null
}
