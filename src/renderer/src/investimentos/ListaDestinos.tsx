import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import { calcularSaldoDoDestino } from '../../../shared/investimentos/calculos'
import { formatarTaxa } from '../../../shared/investimentos/taxa'
import type { Destino, Movimentacao } from '../../../shared/investimentos/tipos'
import { ROTULO_DO_TIPO_DE_DESTINO } from './rotulos'

interface Props {
  destinos: Destino[]
  movimentacoes: Movimentacao[]
}

export function ListaDestinos({ destinos, movimentacoes }: Props): React.JSX.Element | null {
  if (destinos.length === 0) return null

  return (
    <table className="lista">
      <thead>
        <tr>
          <th>Destino</th>
          <th>Tipo</th>
          <th>Rendimento</th>
          <th className="numero">Guardado</th>
        </tr>
      </thead>
      <tbody>
        {destinos.map((destino) => (
          <tr key={destino.id}>
            <td>{destino.nome}</td>
            <td>{ROTULO_DO_TIPO_DE_DESTINO[destino.tipo]}</td>
            <td>
              {destino.taxaRendimentoCentesimos !== null && destino.periodicidadeDaTaxa !== null
                ? formatarTaxa(destino.taxaRendimentoCentesimos, destino.periodicidadeDaTaxa)
                : '—'}
            </td>
            <td className="numero">
              {formatarCentavosComoReal(calcularSaldoDoDestino(movimentacoes, destino.id))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
