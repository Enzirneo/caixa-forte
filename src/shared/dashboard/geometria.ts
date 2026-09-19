const VOLTA_COMPLETA = Math.PI * 2
const ANGULO_DO_TOPO = -Math.PI / 2
const MARGEM_DE_ARREDONDAMENTO_DA_VOLTA = 1e-6
const ESCALA_DE_REFERENCIA_PADRAO_CENTAVOS = 100_000
const PASSOS_AGRADAVEIS = [1, 2, 2.5, 5, 10]
const PASSO_MINIMO_EM_CENTAVOS = 1

export interface EscalaVertical {
  topo: number
  marcas: number[]
}

export interface Ponto {
  x: number
  y: number
}

export interface Fatia {
  inicio: number
  fim: number
}

// Escolhe um passo "redondo" (1, 2, 2,5 ou 5 vezes uma potência de 10) para a grade do gráfico.
export function calcularEscalaVertical(
  valorMaximo: number,
  quantidadeDeMarcas: number = 4
): EscalaVertical {
  const maximo = valorMaximo > 0 ? valorMaximo : ESCALA_DE_REFERENCIA_PADRAO_CENTAVOS
  const passoBruto = maximo / quantidadeDeMarcas
  const ordemDeGrandeza = 10 ** Math.floor(Math.log10(passoBruto))
  const normalizado = passoBruto / ordemDeGrandeza
  const passoAgradavel = PASSOS_AGRADAVEIS.find((passo) => normalizado <= passo) ?? 10
  const passo = Math.max(PASSO_MINIMO_EM_CENTAVOS, Math.round(passoAgradavel * ordemDeGrandeza))

  const topo = Math.ceil(maximo / passo) * passo
  const marcas = Array.from({ length: topo / passo + 1 }, (_, indice) => indice * passo)
  return { topo, marcas }
}

export function calcularAngulosDasFatias(valores: number[]): Fatia[] {
  const total = valores.reduce((soma, valor) => soma + valor, 0)
  if (total <= 0) return []

  let anguloAtual = ANGULO_DO_TOPO
  return valores.map((valor) => {
    const inicio = anguloAtual
    anguloAtual += (valor / total) * VOLTA_COMPLETA
    return { inicio, fim: anguloAtual }
  })
}

function converterPolarEmPonto(
  centroX: number,
  centroY: number,
  raio: number,
  angulo: number
): Ponto {
  return { x: centroX + raio * Math.cos(angulo), y: centroY + raio * Math.sin(angulo) }
}

function formatar(numero: number): string {
  return numero.toFixed(2)
}

export function montarCaminhoDaFatia(
  centroX: number,
  centroY: number,
  raioExterno: number,
  raioInterno: number,
  { inicio, fim }: Fatia
): string {
  const ehVoltaCompleta = fim - inicio >= VOLTA_COMPLETA - MARGEM_DE_ARREDONDAMENTO_DA_VOLTA
  const fimEfetivo = ehVoltaCompleta ? inicio + Math.PI : fim

  const p1 = converterPolarEmPonto(centroX, centroY, raioExterno, inicio)
  const p2 = converterPolarEmPonto(centroX, centroY, raioExterno, fimEfetivo)
  const p3 = converterPolarEmPonto(centroX, centroY, raioInterno, fimEfetivo)
  const p4 = converterPolarEmPonto(centroX, centroY, raioInterno, inicio)
  const arcoGrande = fimEfetivo - inicio > Math.PI ? 1 : 0

  const metadeExterna = `M ${formatar(p1.x)} ${formatar(p1.y)} A ${raioExterno} ${raioExterno} 0 ${arcoGrande} 1 ${formatar(p2.x)} ${formatar(p2.y)}`
  const ligacao = `L ${formatar(p3.x)} ${formatar(p3.y)}`
  const metadeInterna = `A ${raioInterno} ${raioInterno} 0 ${arcoGrande} 0 ${formatar(p4.x)} ${formatar(p4.y)} Z`
  if (!ehVoltaCompleta) return `${metadeExterna} ${ligacao} ${metadeInterna}`

  const outraMetade = montarCaminhoDaFatia(centroX, centroY, raioExterno, raioInterno, {
    inicio: fimEfetivo,
    fim: inicio + VOLTA_COMPLETA - MARGEM_DE_ARREDONDAMENTO_DA_VOLTA * 2
  })
  return `${metadeExterna} ${ligacao} ${metadeInterna} ${outraMetade}`
}

// Curva suave que nunca ultrapassa os pontos (tangentes horizontais em cada ponto).
export function montarCaminhoDeLinhaSuave(pontos: Ponto[]): string {
  if (pontos.length === 0) return ''

  const [primeiro, ...demais] = pontos
  let caminho = `M ${formatar(primeiro.x)} ${formatar(primeiro.y)}`
  let anterior = primeiro
  for (const ponto of demais) {
    const meio = (anterior.x + ponto.x) / 2
    caminho += ` C ${formatar(meio)} ${formatar(anterior.y)} ${formatar(meio)} ${formatar(ponto.y)} ${formatar(ponto.x)} ${formatar(ponto.y)}`
    anterior = ponto
  }
  return caminho
}

export function montarCaminhoDaArea(pontos: Ponto[], linhaDeBase: number): string {
  if (pontos.length === 0) return ''

  const ultimo = pontos[pontos.length - 1]
  const primeiro = pontos[0]
  return `${montarCaminhoDeLinhaSuave(pontos)} L ${formatar(ultimo.x)} ${formatar(linhaDeBase)} L ${formatar(primeiro.x)} ${formatar(linhaDeBase)} Z`
}

// Barra com os cantos de cima arredondados e a base reta, colada no eixo.
export function montarCaminhoDeBarra(
  x: number,
  y: number,
  largura: number,
  altura: number,
  raio: number
): string {
  const r = Math.min(raio, largura / 2, altura)
  const direita = x + largura
  const base = y + altura
  return `M ${formatar(x)} ${formatar(base)} L ${formatar(x)} ${formatar(y + r)} Q ${formatar(x)} ${formatar(y)} ${formatar(x + r)} ${formatar(y)} L ${formatar(direita - r)} ${formatar(y)} Q ${formatar(direita)} ${formatar(y)} ${formatar(direita)} ${formatar(y + r)} L ${formatar(direita)} ${formatar(base)} Z`
}
