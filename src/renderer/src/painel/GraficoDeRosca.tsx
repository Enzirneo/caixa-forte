import {
  ROTULO_DE_OUTRAS_CATEGORIAS,
  type FatiaDeCategoria
} from '../../../shared/dashboard/dadosDosGraficos'
import { calcularAngulosDasFatias, montarCaminhoDaFatia } from '../../../shared/dashboard/geometria'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'

const TAMANHO = 200
const CENTRO = TAMANHO / 2
const RAIO_EXTERNO = 92
const RAIO_INTERNO = 60
const PERMILAGEM_POR_PERCENTUAL = 10
const QUANTIDADE_DE_CORES = 6

interface Props {
  fatias: FatiaDeCategoria[]
}

function escolherCor(fatia: FatiaDeCategoria, indice: number): string {
  if (fatia.categoria === ROTULO_DE_OUTRAS_CATEGORIAS) return 'var(--texto-suave)'
  return `var(--grafico-${(indice % QUANTIDADE_DE_CORES) + 1})`
}

export function GraficoDeRosca({ fatias }: Props): React.JSX.Element {
  const total = fatias.reduce((soma, fatia) => soma + fatia.valorCentavos, 0)
  const angulos = calcularAngulosDasFatias(fatias.map((fatia) => fatia.valorCentavos))

  return (
    <div className="rosca">
      <svg
        className="rosca-svg"
        viewBox={`0 0 ${TAMANHO} ${TAMANHO}`}
        role="img"
        aria-label="Despesas por categoria"
      >
        {fatias.map((fatia, indice) => (
          <path
            key={fatia.categoria}
            d={montarCaminhoDaFatia(CENTRO, CENTRO, RAIO_EXTERNO, RAIO_INTERNO, angulos[indice])}
            fill={escolherCor(fatia, indice)}
            className="fatia-da-rosca"
          >
            <title>{`${fatia.categoria}: ${formatarCentavosComoReal(fatia.valorCentavos)}`}</title>
          </path>
        ))}
        <text className="rosca-rotulo" x={CENTRO} y={CENTRO - 4} textAnchor="middle">
          Despesas
        </text>
        <text className="rosca-total" x={CENTRO} y={CENTRO + 16} textAnchor="middle">
          {formatarCentavosComoReal(total)}
        </text>
      </svg>

      <ul className="legenda">
        {fatias.map((fatia, indice) => (
          <li key={fatia.categoria}>
            <span className="legenda-cor" style={{ background: escolherCor(fatia, indice) }} />
            <span className="legenda-nome">{fatia.categoria}</span>
            <span className="legenda-valor">{formatarCentavosComoReal(fatia.valorCentavos)}</span>
            <span className="legenda-percentual">
              {Math.round(fatia.permilagem / PERMILAGEM_POR_PERCENTUAL)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
