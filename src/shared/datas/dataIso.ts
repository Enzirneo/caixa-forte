const PADRAO_DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/

export function ehDataIsoValida(texto: string): boolean {
  const partes = PADRAO_DATA_ISO.exec(texto)
  if (!partes) return false

  const [ano, mes, dia] = partes.slice(1).map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  return (
    data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia
  )
}

export function formatarDataIsoComoBrasileira(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function obterDataIsoDeHoje(agora: Date = new Date()): string {
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function converterTimestampDoBancoEmDataIsoLocal(timestampUtc: string): string {
  return obterDataIsoDeHoje(new Date(`${timestampUtc.replace(' ', 'T')}Z`))
}

// Datas lidas de planilhas não têm fuso: o Excel guarda só o dia, e a leitura devolve a
// meia-noite em UTC. Ler no horário local mostraria o dia anterior em fusos a oeste de Greenwich.
export function obterDataIsoEmUtc(data: Date): string {
  const ano = data.getUTCFullYear()
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0')
  const dia = String(data.getUTCDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}
