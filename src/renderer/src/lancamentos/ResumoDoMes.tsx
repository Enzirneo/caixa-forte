import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import { calcularSaldoDaContaNoMes } from '../../../shared/investimentos/calculos'
import type { Resumo } from '../../../shared/lancamentos/resumo'

interface Props {
  resumo: Resumo
  guardadoNoMesCentavos: number
}

export function ResumoDoMes({ resumo, guardadoNoMesCentavos }: Props): React.JSX.Element {
  const saldoDaContaNoMes = calcularSaldoDaContaNoMes(resumo, guardadoNoMesCentavos)

  return (
    <div className="resumo-do-mes">
      <div>
        <span>Receitas</span>
        <strong className="receita">{formatarCentavosComoReal(resumo.receitasCentavos)}</strong>
      </div>
      <div>
        <span>Despesas</span>
        <strong className="despesa">{formatarCentavosComoReal(resumo.despesasCentavos)}</strong>
      </div>
      <div>
        <span>Guardado</span>
        <strong>{formatarCentavosComoReal(guardadoNoMesCentavos)}</strong>
      </div>
      <div>
        <span>Saldo do mês na conta</span>
        <strong className={saldoDaContaNoMes < 0 ? 'despesa' : 'receita'}>
          {formatarCentavosComoReal(saldoDaContaNoMes)}
        </strong>
      </div>
    </div>
  )
}
