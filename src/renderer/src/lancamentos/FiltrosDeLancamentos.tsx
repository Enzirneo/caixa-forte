import { Search } from 'lucide-react'
import type { FiltroDeLancamentos } from '../../../shared/lancamentos/filtrarLancamentos'

const TAMANHO_DO_ICONE_DE_BUSCA = 16

interface Props {
  filtro: FiltroDeLancamentos
  aoMudar: (filtro: FiltroDeLancamentos) => void
}

export function FiltrosDeLancamentos({ filtro, aoMudar }: Props): React.JSX.Element {
  return (
    <div className="campo-com-icone-a-esquerda busca-de-lancamentos">
      <Search size={TAMANHO_DO_ICONE_DE_BUSCA} />
      <input
        placeholder="Buscar por descrição ou categoria"
        aria-label="Buscar lançamentos"
        value={filtro.texto}
        onChange={(e) => aoMudar({ ...filtro, texto: e.target.value })}
      />
    </div>
  )
}
