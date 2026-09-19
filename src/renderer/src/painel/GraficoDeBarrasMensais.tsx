import { formatarMesAbreviado, formatarMesPorExtenso } from '../../../shared/datas/mes'
import type { PontoMensal } from '../../../shared/dashboard/dadosDosGraficos'
import { calcularEscalaVertical, montarCaminhoDeBarra } from '../../../shared/dashboard/geometria'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import { formatarCentavosCompacto } from '../../../shared/dinheiro/formatarCentavosCompacto'

const LARGURA = 560
const ALTURA = 350
const MARGEM = { esquerda: 56, direita: 12, topo: 14, base: 34 }
const LARGURA_MAXIMA_DA_BARRA = 26
const ESPACO_ENTRE_BARRAS = 4
const RAIO_DA_BARRA = 4
const FRACAO_DO_GRUPO_OCUPADA_PELAS_BARRAS = 0.62

interface Props {
  pontos: PontoMensal[]
}

export function GraficoDeBarrasMensais({ pontos }: Props): React.JSX.Element {
  const maiorValor = Math.max(
    0,
    ...pontos.flatMap((ponto) => [ponto.receitasCentavos, ponto.despesasCentavos])
  )
  const escala = calcularEscalaVertical(maiorValor)

  const larguraUtil = LARGURA - MARGEM.esquerda - MARGEM.direita
  const alturaUtil = ALTURA - MARGEM.topo - MARGEM.base
  const larguraDoGrupo = larguraUtil / pontos.length
  const larguraDaBarra = Math.min(
    LARGURA_MAXIMA_DA_BARRA,
    (larguraDoGrupo * FRACAO_DO_GRUPO_OCUPADA_PELAS_BARRAS - ESPACO_ENTRE_BARRAS) / 2
  )
  const converterEmY = (valor: number): number =>
    MARGEM.topo + alturaUtil * (1 - valor / escala.topo)

  const renderizarBarra = (
    valor: number,
    x: number,
    classe: string,
    rotulo: string
  ): React.JSX.Element | null => {
    if (valor <= 0) return null
    const y = converterEmY(valor)
    return (
      <path
        className={classe}
        d={montarCaminhoDeBarra(x, y, larguraDaBarra, MARGEM.topo + alturaUtil - y, RAIO_DA_BARRA)}
      >
        <title>{rotulo}</title>
      </path>
    )
  }

  return (
    <svg
      className="grafico-svg"
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      role="img"
      aria-label="Receitas e despesas por mês"
    >
      {escala.marcas.map((marca) => (
        <g key={marca}>
          <line
            className="grafico-grade"
            x1={MARGEM.esquerda}
            x2={LARGURA - MARGEM.direita}
            y1={converterEmY(marca)}
            y2={converterEmY(marca)}
          />
          <text
            className="grafico-rotulo"
            x={MARGEM.esquerda - 8}
            y={converterEmY(marca) + 4}
            textAnchor="end"
          >
            {formatarCentavosCompacto(marca)}
          </text>
        </g>
      ))}

      {pontos.map((ponto, indice) => {
        const inicioDoGrupo = MARGEM.esquerda + indice * larguraDoGrupo
        const xDasBarras =
          inicioDoGrupo + (larguraDoGrupo - (larguraDaBarra * 2 + ESPACO_ENTRE_BARRAS)) / 2
        const nomeDoMes = formatarMesPorExtenso(ponto.mes)
        return (
          <g key={ponto.mes}>
            {renderizarBarra(
              ponto.receitasCentavos,
              xDasBarras,
              'barra-receita',
              `${nomeDoMes} — Receitas: ${formatarCentavosComoReal(ponto.receitasCentavos)}`
            )}
            {renderizarBarra(
              ponto.despesasCentavos,
              xDasBarras + larguraDaBarra + ESPACO_ENTRE_BARRAS,
              'barra-despesa',
              `${nomeDoMes} — Despesas: ${formatarCentavosComoReal(ponto.despesasCentavos)}`
            )}
            <text
              className="grafico-rotulo"
              x={inicioDoGrupo + larguraDoGrupo / 2}
              y={ALTURA - 10}
              textAnchor="middle"
            >
              {formatarMesAbreviado(ponto.mes)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
