import { Monitor, Moon, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PreferenciaDeTema } from '../../../shared/tema/resolverTema'

const TAMANHO_DO_ICONE = 15

const OPCOES_DE_TEMA: { id: PreferenciaDeTema; rotulo: string; icone: LucideIcon }[] = [
  { id: 'claro', rotulo: 'Tema claro', icone: Sun },
  { id: 'escuro', rotulo: 'Tema escuro', icone: Moon },
  { id: 'automatico', rotulo: 'Seguir o sistema', icone: Monitor }
]

interface Props {
  preferencia: PreferenciaDeTema
  aoEscolher: (preferencia: PreferenciaDeTema) => void
  recolhida: boolean
  aoExpandir: () => void
}

export function SeletorDeTema({
  preferencia,
  aoEscolher,
  recolhida,
  aoExpandir
}: Props): React.JSX.Element {
  const opcaoAtual = OPCOES_DE_TEMA.find((opcao) => opcao.id === preferencia) ?? OPCOES_DE_TEMA[2]

  if (recolhida) {
    const IconeAtual = opcaoAtual.icone
    return (
      <button
        className="botao-de-tema-recolhido"
        onClick={aoExpandir}
        title="Tema"
        aria-label="Abrir opções de tema"
      >
        <IconeAtual size={TAMANHO_DO_ICONE} />
      </button>
    )
  }

  const indiceAtivo = OPCOES_DE_TEMA.findIndex((opcao) => opcao.id === preferencia)

  return (
    <div
      className="seletor-de-tema"
      role="group"
      aria-label="Tema"
      style={{ '--indice-ativo': indiceAtivo } as React.CSSProperties}
    >
      <div className="seletor-de-tema-indicador" aria-hidden="true" />
      {OPCOES_DE_TEMA.map(({ id, rotulo, icone: Icone }) => (
        <button
          key={id}
          className={preferencia === id ? 'opcao-de-tema ativa' : 'opcao-de-tema'}
          title={rotulo}
          aria-label={rotulo}
          aria-pressed={preferencia === id}
          onClick={() => aoEscolher(id)}
        >
          <Icone size={TAMANHO_DO_ICONE} />
        </button>
      ))}
    </div>
  )
}
