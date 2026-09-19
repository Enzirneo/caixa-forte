import { formatarDataIsoComoBrasileira } from '../../../shared/datas/dataIso'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import type { Destino, Movimentacao } from '../../../shared/investimentos/tipos'
import { BotaoExcluirComConfirmacao } from '../compartilhado/BotaoExcluirComConfirmacao'
import { ROTULO_DO_TIPO_DE_MOVIMENTACAO } from './rotulos'

interface Props {
  destinos: Destino[]
  movimentacoes: Movimentacao[]
  aoExcluir: (id: number) => Promise<void>
}

export function ListaMovimentacoes({
  destinos,
  movimentacoes,
  aoExcluir
}: Props): React.JSX.Element | null {
  if (movimentacoes.length === 0) return null

  const buscarNomeDoDestino = (destinoId: number): string =>
    destinos.find((destino) => destino.id === destinoId)?.nome ?? '—'

  return (
    <table className="lista">
      <thead>
        <tr>
          <th>Data</th>
          <th>Destino</th>
          <th>Operação</th>
          <th className="numero">Valor</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {movimentacoes.map((movimentacao) => (
          <tr key={movimentacao.id}>
            <td>{formatarDataIsoComoBrasileira(movimentacao.data)}</td>
            <td>{buscarNomeDoDestino(movimentacao.destinoId)}</td>
            <td>{ROTULO_DO_TIPO_DE_MOVIMENTACAO[movimentacao.tipo]}</td>
            <td className="numero">{formatarCentavosComoReal(movimentacao.valorCentavos)}</td>
            <td className="acoes-linha">
              <BotaoExcluirComConfirmacao aoConfirmar={() => aoExcluir(movimentacao.id)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
