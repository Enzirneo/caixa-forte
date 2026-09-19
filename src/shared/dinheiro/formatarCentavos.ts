const CENTAVOS_POR_REAL = 100

const formatadorReal = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})

export function formatarCentavosComoReal(centavos: number): string {
  if (!Number.isInteger(centavos)) {
    throw new RangeError(`Dinheiro deve ser inteiro em centavos, recebido: ${centavos}`)
  }
  return formatadorReal.format(centavos / CENTAVOS_POR_REAL)
}
