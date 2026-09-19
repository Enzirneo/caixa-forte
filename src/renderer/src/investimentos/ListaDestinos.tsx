import { obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import { calcularPosicaoDoDestino } from '../../../shared/investimentos/rendimento'
import { formatarTaxa } from '../../../shared/investimentos/taxa'
import type { Destino, Movimentacao } from '../../../shared/investimentos/tipos'
import { ROTULO_DO_TIPO_DE_DESTINO } from './rotulos'

interface Props {
  destinos: Destino[]
  movimentacoes: Movimentacao[]
}

export function ListaDestinos({ destinos, movimentacoes }: Props): React.JSX.Element | null {
  if (destinos.length === 0) return null

  const hoje = obterDataIsoDeHoje()

  return (
    <table className="lista">
      <thead>
        <tr>
          <th>Destino</th>
          <th>Tipo</th>
          <th>Taxa</th>
          <th className="numero">Aplicado</th>
          <th className="numero">Rendeu (estimado)</th>
          <th className="numero">Valor atual (estimado)</th>
        </tr>
      </thead>
      <tbody>
        {destinos.map((destino) => {
          const posicao = calcularPosicaoDoDestino(destino, movimentacoes, hoje)
          return (
            <tr key={destino.id}>
              <td>{destino.nome}</td>
              <td>{ROTULO_DO_TIPO_DE_DESTINO[destino.tipo]}</td>
              <td>
                {destino.taxaRendimentoCentesimos !== null && destino.periodicidadeDaTaxa !== null
                  ? formatarTaxa(destino.taxaRendimentoCentesimos, destino.periodicidadeDaTaxa)
                  : '—'}
              </td>
              <td className="numero">{formatarCentavosComoReal(posicao.aplicadoCentavos)}</td>
              <td className="numero receita">
                {formatarCentavosComoReal(posicao.rendimentoEstimadoCentavos)}
              </td>
              <td className="numero">{formatarCentavosComoReal(posicao.saldoEstimadoCentavos)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
