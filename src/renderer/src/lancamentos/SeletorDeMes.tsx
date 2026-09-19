import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatarMesPorExtenso, somarMeses } from '../../../shared/datas/mes'

interface Props {
  mes: string
  aoMudar: (mes: string) => void
}

export function SeletorDeMes({ mes, aoMudar }: Props): React.JSX.Element {
  return (
    <div className="seletor-de-mes">
      <button
        className="secundario"
        aria-label="Mês anterior"
        onClick={() => aoMudar(somarMeses(mes, -1))}
      >
        <ChevronLeft size={16} />
      </button>
      <strong>{formatarMesPorExtenso(mes)}</strong>
      <button
        className="secundario"
        aria-label="Próximo mês"
        onClick={() => aoMudar(somarMeses(mes, 1))}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
