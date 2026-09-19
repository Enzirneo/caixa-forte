import {
  converterTimestampDoBancoEmDataIsoLocal,
  formatarDataIsoComoBrasileira
} from '../../../shared/datas/dataIso'
import { formatarMesPorExtenso, obterMesDaData } from '../../../shared/datas/mes'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import { foiAlteradoAposFechamento } from '../../../shared/fechamentos/regrasDeFechamento'
import type { FechamentoMes } from '../../../shared/fechamentos/tipos'
import {
  calcularGuardadoNoMes,
  calcularSaldoDaContaNoMes
} from '../../../shared/investimentos/calculos'
import type { Movimentacao } from '../../../shared/investimentos/tipos'
import type { ResumoMensal } from '../../../shared/lancamentos/resumo'
import type { Lancamento } from '../../../shared/lancamentos/tipos'

interface Props {
  resumos: ResumoMensal[]
  lancamentos: Lancamento[]
  movimentacoes: Movimentacao[]
  fechamentos: FechamentoMes[]
  aoSelecionarMes: (mes: string) => void
  aoRefazerFechamento: (mes: string) => Promise<void>
}

export function HistoricoMensal({
  resumos,
  lancamentos,
  movimentacoes,
  fechamentos,
  aoSelecionarMes,
  aoRefazerFechamento
}: Props): React.JSX.Element {
  if (resumos.length === 0) {
    return <p className="vazio">O histórico aparece quando houver lançamentos.</p>
  }

  const contarPosteriores = (mes: string): number =>
    lancamentos.filter(
      (lancamento) =>
        obterMesDaData(lancamento.data) === mes &&
        foiAlteradoAposFechamento(lancamento, fechamentos)
    ).length

  const renderizarSituacao = (mes: string): React.JSX.Element => {
    const fechamento = fechamentos.find((candidato) => candidato.mes === mes)
    if (!fechamento) return <span className="situacao">Em andamento</span>

    const dataDoFechamento = formatarDataIsoComoBrasileira(
      converterTimestampDoBancoEmDataIsoLocal(fechamento.fechadoEm)
    )
    const posteriores = contarPosteriores(mes)
    return (
      <span className="situacao">
        <span className="situacao-texto">Fechado em {dataDoFechamento}</span>
        {posteriores > 0 && (
          <>
            <span className="ressalva"> · {posteriores} lançado(s) após o fechamento</span>
            <button className="secundario" onClick={() => aoRefazerFechamento(mes)}>
              Refazer fechamento
            </button>
          </>
        )}
      </span>
    )
  }

  return (
    <table className="lista">
      <thead>
        <tr>
          <th>Mês</th>
          <th className="numero">Receitas</th>
          <th className="numero">Despesas</th>
          <th className="numero">Guardado</th>
          <th className="numero">Saldo na conta</th>
          <th>Situação</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {resumos.map((resumo) => {
          const guardadoNoMes = calcularGuardadoNoMes(movimentacoes, resumo.mes)
          const saldoDaContaNoMes = calcularSaldoDaContaNoMes(resumo, guardadoNoMes)
          return (
            <tr key={resumo.mes}>
              <td>{formatarMesPorExtenso(resumo.mes)}</td>
              <td className="numero receita">
                {formatarCentavosComoReal(resumo.receitasCentavos)}
              </td>
              <td className="numero despesa">
                {formatarCentavosComoReal(resumo.despesasCentavos)}
              </td>
              <td className="numero">{formatarCentavosComoReal(guardadoNoMes)}</td>
              <td className={`numero ${saldoDaContaNoMes < 0 ? 'despesa' : 'receita'}`}>
                {formatarCentavosComoReal(saldoDaContaNoMes)}
              </td>
              <td>{renderizarSituacao(resumo.mes)}</td>
              <td className="acoes-linha">
                <button className="secundario" onClick={() => aoSelecionarMes(resumo.mes)}>
                  Ver lançamentos
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
