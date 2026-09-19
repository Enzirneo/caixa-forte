import { formatarDataIsoComoBrasileira } from '../../../shared/datas/dataIso'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import { foiAlteradoAposFechamento } from '../../../shared/fechamentos/regrasDeFechamento'
import type { FechamentoMes } from '../../../shared/fechamentos/tipos'
import type { Lancamento } from '../../../shared/lancamentos/tipos'
import { BotaoExcluirComConfirmacao } from '../compartilhado/BotaoExcluirComConfirmacao'

interface Props {
  lancamentos: Lancamento[]
  filtrando: boolean
  fechamentos: FechamentoMes[]
  rotulosDeCompra: Map<number, string>
  aoEditar: (lancamento: Lancamento) => void
  aoExcluir: (id: number) => Promise<void>
}

export function ListaLancamentos({
  lancamentos,
  filtrando,
  fechamentos,
  rotulosDeCompra,
  aoEditar,
  aoExcluir
}: Props): React.JSX.Element {
  if (lancamentos.length === 0) {
    return (
      <p className="vazio">
        {filtrando
          ? 'Nenhum lançamento encontrado com esses filtros.'
          : 'Nenhum lançamento neste mês.'}
      </p>
    )
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
            <td>
              {lancamento.descricao}
              {foiAlteradoAposFechamento(lancamento, fechamentos) && (
                <span className="ressalva"> · lançado após o fechamento</span>
              )}
              {rotulosDeCompra.has(lancamento.id) && (
                <span className="rotulo-de-compra">{rotulosDeCompra.get(lancamento.id)}</span>
              )}
            </td>
            <td>{lancamento.categoria}</td>
            <td className={`numero ${lancamento.tipo}`}>
              {formatarCentavosComoReal(lancamento.valorCentavos)}
            </td>
            <td className="acoes-linha">
              <button className="secundario" onClick={() => aoEditar(lancamento)}>
                Editar
              </button>
              <BotaoExcluirComConfirmacao aoConfirmar={() => aoExcluir(lancamento.id)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
