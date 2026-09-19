const CENTAVOS_POR_REAL = 100
const CASAS_DECIMAIS = 2
const MAXIMO_DE_DIGITOS = 12
const PADRAO_DE_NAO_DIGITOS = /\D/g
const PADRAO_DE_MILHARES = /\B(?=(\d{3})+(?!\d))/g

function formatarComSeparadorDeMilhar(centavos: number): string {
  const reais = Math.trunc(centavos / CENTAVOS_POR_REAL)
  const restoEmCentavos = centavos % CENTAVOS_POR_REAL
  const reaisComPontos = String(reais).replace(PADRAO_DE_MILHARES, '.')
  return `${reaisComPontos},${String(restoEmCentavos).padStart(CASAS_DECIMAIS, '0')}`
}

// Os dígitos entram pelos centavos: "1" vira 0,01; "12" vira 0,12; "123" vira 1,23.
export function aplicarMascaraDeValor(textoDigitado: string): string {
  const digitos = textoDigitado.replace(PADRAO_DE_NAO_DIGITOS, '').slice(0, MAXIMO_DE_DIGITOS)
  const centavos = Number(digitos)
  return centavos === 0 ? '' : formatarComSeparadorDeMilhar(centavos)
}
