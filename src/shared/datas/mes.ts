const TAMANHO_ANO_MES = 7
const MESES_POR_ANO = 12

const NOMES_DOS_MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro'
]

export function obterMesDaData(dataIso: string): string {
  return dataIso.slice(0, TAMANHO_ANO_MES)
}

export function somarMeses(mes: string, quantidade: number): string {
  const [ano, numeroDoMes] = mes.split('-').map(Number)
  const indiceAbsoluto = ano * MESES_POR_ANO + (numeroDoMes - 1) + quantidade
  const novoAno = Math.floor(indiceAbsoluto / MESES_POR_ANO)
  const novoMes = (indiceAbsoluto % MESES_POR_ANO) + 1
  return `${novoAno}-${String(novoMes).padStart(2, '0')}`
}

export function formatarMesPorExtenso(mes: string): string {
  const [ano, numeroDoMes] = mes.split('-').map(Number)
  return `${NOMES_DOS_MESES[numeroDoMes - 1]} de ${ano}`
}

export function obterUltimoDiaDoMes(mes: string): string {
  const [ano, numeroDoMes] = mes.split('-').map(Number)
  const ultimoDia = new Date(Date.UTC(ano, numeroDoMes, 0)).getUTCDate()
  return `${mes}-${String(ultimoDia).padStart(2, '0')}`
}

const QUANTIDADE_DE_LETRAS_DO_MES_ABREVIADO = 3
const TAMANHO_DO_ANO_ABREVIADO = 2

export function formatarMesAbreviado(mes: string): string {
  const [ano, numeroDoMes] = mes.split('-')
  const nome = NOMES_DOS_MESES[Number(numeroDoMes) - 1].slice(
    0,
    QUANTIDADE_DE_LETRAS_DO_MES_ABREVIADO
  )
  return `${nome}/${ano.slice(-TAMANHO_DO_ANO_ABREVIADO)}`
}
