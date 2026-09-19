import { formatarDataIsoComoBrasileira } from '../../../shared/datas/dataIso'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import type { ItemDaPrevia } from '../../../shared/importacao/tipos'

interface Props {
  itens: ItemDaPrevia[]
  estaIncluido: (item: ItemDaPrevia) => boolean
  aoAlternar: (numeroDaLinha: number) => void
}

function descreverSituacao(item: ItemDaPrevia): React.JSX.Element {
  if (item.lancamento === null) {
    return <span className="ressalva">Erro: {item.erros.join(' ')}</span>
  }
  if (item.duplicada) return <span className="situacao">Já existe</span>
  return <span className="situacao">Novo</span>
}

export function PreviaDaImportacao({ itens, estaIncluido, aoAlternar }: Props): React.JSX.Element {
  return (
    <table className="lista">
      <thead>
        <tr>
          <th />
          <th>Linha</th>
          <th>Data</th>
          <th>Descrição</th>
          <th>Categoria</th>
          <th className="numero">Valor</th>
          <th>Situação</th>
        </tr>
      </thead>
      <tbody>
        {itens.map((item) => (
          <tr key={item.numeroDaLinha}>
            <td>
              <input
                type="checkbox"
                aria-label={`Importar a linha ${item.numeroDaLinha}`}
                checked={estaIncluido(item)}
                disabled={item.lancamento === null}
                onChange={() => aoAlternar(item.numeroDaLinha)}
              />
            </td>
            <td>{item.numeroDaLinha}</td>
            {item.lancamento ? (
              <>
                <td>{formatarDataIsoComoBrasileira(item.lancamento.data)}</td>
                <td>{item.lancamento.descricao}</td>
                <td>{item.lancamento.categoria}</td>
                <td className={`numero ${item.lancamento.tipo}`}>
                  {item.lancamento.tipo === 'receita' ? '+ ' : ''}
                  {formatarCentavosComoReal(item.lancamento.valorCentavos)}
                </td>
              </>
            ) : (
              <td colSpan={4}>{item.textoOriginal}</td>
            )}
            <td>{descreverSituacao(item)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
