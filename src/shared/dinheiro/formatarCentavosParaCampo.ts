const CENTAVOS_POR_REAL = 100
const CASAS_DECIMAIS = 2

export function formatarCentavosParaCampo(centavos: number): string {
  const reais = Math.trunc(centavos / CENTAVOS_POR_REAL)
  const restoEmCentavos = centavos % CENTAVOS_POR_REAL
  return `${reais},${String(restoEmCentavos).padStart(CASAS_DECIMAIS, '0')}`
}
