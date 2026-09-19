import { useId } from 'react'
import { formatarMesAbreviado, formatarMesPorExtenso } from '../../../shared/datas/mes'
import type { PontoDoPatrimonio } from '../../../shared/dashboard/dadosDosGraficos'
import {
  calcularEscalaVertical,
  montarCaminhoDaArea,
  montarCaminhoDeLinhaSuave
} from '../../../shared/dashboard/geometria'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import { formatarCentavosCompacto } from '../../../shared/dinheiro/formatarCentavosCompacto'

const LARGURA = 560
const ALTURA = 240
const MARGEM = { esquerda: 56, direita: 24, topo: 14, base: 34 }
const RAIO_DO_PONTO = 4
const OPACIDADE_INICIAL_DO_DEGRADE = 0.28

interface Props {
  pontos: PontoDoPatrimonio[]
}

export function GraficoDeArea({ pontos }: Props): React.JSX.Element {
  const identificadorDoDegrade = useId()
  const maiorValor = Math.max(0, ...pontos.map((ponto) => ponto.saldoEstimadoCentavos))
  const escala = calcularEscalaVertical(maiorValor)

  const larguraUtil = LARGURA - MARGEM.esquerda - MARGEM.direita
  const alturaUtil = ALTURA - MARGEM.topo - MARGEM.base
  const passoHorizontal = pontos.length > 1 ? larguraUtil / (pontos.length - 1) : 0
  const converterEmY = (valor: number): number =>
    MARGEM.topo + alturaUtil * (1 - valor / escala.topo)

  const coordenadas = pontos.map((ponto, indice) => ({
    x: MARGEM.esquerda + indice * passoHorizontal,
    y: converterEmY(ponto.saldoEstimadoCentavos)
  }))
  const linhaDeBase = MARGEM.topo + alturaUtil

  return (
    <svg
      className="grafico-svg"
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      role="img"
      aria-label="Evolução do valor guardado"
    >
      <defs>
        <linearGradient id={identificadorDoDegrade} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="5%"
            stopColor="var(--grafico-1)"
            stopOpacity={OPACIDADE_INICIAL_DO_DEGRADE}
          />
          <stop offset="95%" stopColor="var(--grafico-1)" stopOpacity={0} />
        </linearGradient>
      </defs>

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

      <path
        d={montarCaminhoDaArea(coordenadas, linhaDeBase)}
        fill={`url(#${identificadorDoDegrade})`}
      />
      <path className="grafico-linha" d={montarCaminhoDeLinhaSuave(coordenadas)} />

      {pontos.map((ponto, indice) => (
        <g key={ponto.mes}>
          <circle
            className="grafico-ponto"
            cx={coordenadas[indice].x}
            cy={coordenadas[indice].y}
            r={RAIO_DO_PONTO}
          >
            <title>{`${formatarMesPorExtenso(ponto.mes)}: ${formatarCentavosComoReal(ponto.saldoEstimadoCentavos)}`}</title>
          </circle>
          <text
            className="grafico-rotulo"
            x={coordenadas[indice].x}
            y={ALTURA - 10}
            textAnchor="middle"
          >
            {formatarMesAbreviado(ponto.mes)}
          </text>
        </g>
      ))}
    </svg>
  )
}
