import { formatarDataIsoComoBrasileira } from '../../../shared/datas/dataIso'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import type { Lancamento } from '../../../shared/lancamentos/tipos'

interface Props {
  lancamentos: Lancamento[]
  aoExcluir: (id: number) => Promise<void>
}

export function ListaLancamentos({ lancamentos, aoExcluir }: Props): React.JSX.Element {
  if (lancamentos.length === 0) {
    return <p className="vazio">Nenhum lançamento ainda.</p>
  }

  return (
    <table className="lista">
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th>Categoria</th>
          <th className="numero">Valor</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {lancamentos.map((lancamento) => (
          <tr key={lancamento.id}>
            <td>{formatarDataIsoComoBrasileira(lancamento.data)}</td>
            <td>{lancamento.descricao}</td>
            <td>{lancamento.categoria}</td>
            <td className={`numero ${lancamento.tipo}`}>
              {formatarCentavosComoReal(lancamento.valorCentavos)}
            </td>
            <td>
              <button className="excluir" onClick={() => aoExcluir(lancamento.id)}>
                Excluir
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
