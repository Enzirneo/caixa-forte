import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import type { Resumo } from '../../../shared/lancamentos/resumo'

interface Props {
  resumo: Resumo
}

export function ResumoDoMes({ resumo }: Props): React.JSX.Element {
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
        <span>Saldo do mês</span>
        <strong className={resumo.saldoCentavos < 0 ? 'despesa' : 'receita'}>
          {formatarCentavosComoReal(resumo.saldoCentavos)}
        </strong>
      </div>
    </div>
  )
}
