import { useState } from 'react'
import { formatarDataIsoComoBrasileira } from '../../../shared/datas/dataIso'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import { foiAlteradoAposFechamento } from '../../../shared/fechamentos/regrasDeFechamento'
import type { FechamentoMes } from '../../../shared/fechamentos/tipos'
import type { Lancamento } from '../../../shared/lancamentos/tipos'

interface Props {
  lancamentos: Lancamento[]
  fechamentos: FechamentoMes[]
  aoEditar: (lancamento: Lancamento) => void
  aoExcluir: (id: number) => Promise<void>
}

export function ListaLancamentos({
  lancamentos,
  fechamentos,
  aoEditar,
  aoExcluir
}: Props): React.JSX.Element {
  const [idAguardandoConfirmacao, setIdAguardandoConfirmacao] = useState<number | null>(null)

  if (lancamentos.length === 0) {
    return <p className="vazio">Nenhum lançamento neste mês.</p>
  }

  const confirmarExclusao = async (id: number): Promise<void> => {
    await aoExcluir(id)
    setIdAguardandoConfirmacao(null)
  }

  const renderizarAcoes = (lancamento: Lancamento): React.JSX.Element => {
    if (idAguardandoConfirmacao === lancamento.id) {
      return (
        <>
          <span className="situacao">Excluir mesmo?</span>
          <button className="perigo" onClick={() => confirmarExclusao(lancamento.id)}>
            Sim, excluir
          </button>
          <button className="secundario" onClick={() => setIdAguardandoConfirmacao(null)}>
            Cancelar
          </button>
        </>
      )
    }

    return (
      <>
        <button className="secundario" onClick={() => aoEditar(lancamento)}>
          Editar
        </button>
        <button className="secundario" onClick={() => setIdAguardandoConfirmacao(lancamento.id)}>
          Excluir
        </button>
      </>
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
            </td>
            <td>{lancamento.categoria}</td>
            <td className={`numero ${lancamento.tipo}`}>
              {formatarCentavosComoReal(lancamento.valorCentavos)}
            </td>
            <td className="acoes-linha">{renderizarAcoes(lancamento)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
