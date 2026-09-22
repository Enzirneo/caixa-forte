import type { LucideIcon } from 'lucide-react'
import type { PreferenciaDeTema } from '../../../shared/tema/resolverTema'
import { IconeCofre } from '../compartilhado/IconeCofre'
import { SeletorDeTema } from './SeletorDeTema'

export interface OpcaoDeNavegacao<Identificador extends string> {
  id: Identificador
  rotulo: string
  icone: LucideIcon
}

const TAMANHO_DO_ICONE_DE_NAVEGACAO = 18
const TAMANHO_DO_ICONE_DA_MARCA = 18

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
  return (
    <aside className="barra-lateral">
      <div className="marca">
        <button
          className="marca-icone"
          onClick={aoAlternarRecolhimento}
          title={recolhida ? 'Expandir o menu' : 'Recolher o menu'}
          aria-label={recolhida ? 'Expandir o menu' : 'Recolher o menu'}
        >
          <IconeCofre size={TAMANHO_DO_ICONE_DA_MARCA} />
        </button>
        <div className="marca-nome">
          <span className="marca-cursiva">Caixa</span>
          <span className="marca-legenda">Forte</span>
        </div>
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

      <SeletorDeTema
        preferencia={preferenciaDeTema}
        aoEscolher={aoEscolherTema}
        recolhida={recolhida}
        aoExpandir={aoAlternarRecolhimento}
      />
    </aside>
  )
}
