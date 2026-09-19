import { ChevronLeft, ChevronRight, Vault } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PreferenciaDeTema } from '../../../shared/tema/resolverTema'
import { SeletorDeTema } from './SeletorDeTema'

export interface OpcaoDeNavegacao<Identificador extends string> {
  id: Identificador
  rotulo: string
  icone: LucideIcon
}

const TAMANHO_DO_ICONE_DE_NAVEGACAO = 18
const TAMANHO_DO_ICONE_DA_MARCA = 18
const TAMANHO_DO_ICONE_DE_RECOLHER = 16

interface Props<Identificador extends string> {
  opcoes: OpcaoDeNavegacao<Identificador>[]
  opcaoAtiva: Identificador
  aoEscolher: (id: Identificador) => void
  recolhida: boolean
  aoAlternarRecolhimento: () => void
  preferenciaDeTema: PreferenciaDeTema
  aoEscolherTema: (preferencia: PreferenciaDeTema) => void
}

export function BarraLateral<Identificador extends string>({
  opcoes,
  opcaoAtiva,
  aoEscolher,
  recolhida,
  aoAlternarRecolhimento,
  preferenciaDeTema,
  aoEscolherTema
}: Props<Identificador>): React.JSX.Element {
  const IconeDeRecolher = recolhida ? ChevronRight : ChevronLeft

  return (
    <aside className="barra-lateral">
      <div className="marca">
        <div className="marca-icone">
          <Vault size={TAMANHO_DO_ICONE_DA_MARCA} />
        </div>
        <div className="marca-nome">
          <span className="marca-cursiva">Caixa</span>
          <span className="marca-legenda">Forte</span>
        </div>
        <button
          className="botao-de-recolher"
          onClick={aoAlternarRecolhimento}
          title={recolhida ? 'Expandir o menu' : 'Recolher o menu'}
          aria-label={recolhida ? 'Expandir o menu' : 'Recolher o menu'}
        >
          <IconeDeRecolher size={TAMANHO_DO_ICONE_DE_RECOLHER} />
        </button>
      </div>

      <nav className="navegacao">
        {opcoes.map(({ id, rotulo, icone: Icone }) => (
          <button
            key={id}
            className={opcaoAtiva === id ? 'item-de-navegacao ativo' : 'item-de-navegacao'}
            onClick={() => aoEscolher(id)}
            title={rotulo}
          >
            <Icone size={TAMANHO_DO_ICONE_DE_NAVEGACAO} />
            <span>{rotulo}</span>
          </button>
        ))}
      </nav>

      <SeletorDeTema preferencia={preferenciaDeTema} aoEscolher={aoEscolherTema} />
    </aside>
  )
}
