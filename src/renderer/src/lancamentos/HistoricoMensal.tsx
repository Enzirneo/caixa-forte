import { formatarMesPorExtenso } from '../../../shared/datas/mes'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import type { ResumoMensal } from '../../../shared/lancamentos/resumo'

interface Props {
  resumos: ResumoMensal[]
  aoSelecionarMes: (mes: string) => void
}

export function HistoricoMensal({ resumos, aoSelecionarMes }: Props): React.JSX.Element {
  if (resumos.length === 0) {
    return <p className="vazio">O histórico aparece quando houver lançamentos.</p>
  }

  return (
    <table className="lista">
      <thead>
        <tr>
          <th>Mês</th>
          <th className="numero">Receitas</th>
          <th className="numero">Despesas</th>
          <th className="numero">Saldo</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {resumos.map((resumo) => (
          <tr key={resumo.mes}>
            <td>{formatarMesPorExtenso(resumo.mes)}</td>
            <td className="numero receita">{formatarCentavosComoReal(resumo.receitasCentavos)}</td>
            <td className="numero despesa">{formatarCentavosComoReal(resumo.despesasCentavos)}</td>
            <td className={`numero ${resumo.saldoCentavos < 0 ? 'despesa' : 'receita'}`}>
              {formatarCentavosComoReal(resumo.saldoCentavos)}
            </td>
            <td className="acoes-linha">
              <button className="secundario" onClick={() => aoSelecionarMes(resumo.mes)}>
                Ver lançamentos
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
