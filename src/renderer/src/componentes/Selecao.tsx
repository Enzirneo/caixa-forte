import { Check, ChevronDown } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { useFecharAoClicarFora } from './useFecharAoClicarFora'

export interface OpcaoDeSelecao {
  valor: string
  rotulo: string
}

interface Props {
  valor: string
  opcoes: OpcaoDeSelecao[]
  aoMudar: (valor: string) => void
  rotuloDeAcessibilidade: string
  textoQuandoVazio?: string
}

const TAMANHO_DO_ICONE = 16

export function Selecao({
  valor,
  opcoes,
  aoMudar,
  rotuloDeAcessibilidade,
  textoQuandoVazio = 'Selecione'
}: Props): React.JSX.Element {
  const [aberto, setAberto] = useState(false)
  const [indiceDestacado, setIndiceDestacado] = useState(0)
  const referencia = useFecharAoClicarFora(aberto, () => setAberto(false))

  const opcaoSelecionada = opcoes.find((opcao) => opcao.valor === valor)

  const abrir = (): void => {
    setIndiceDestacado(
      Math.max(
        0,
        opcoes.findIndex((opcao) => opcao.valor === valor)
      )
    )
    setAberto(true)
  }

  const escolher = (opcao: OpcaoDeSelecao): void => {
    aoMudar(opcao.valor)
    setAberto(false)
  }

  const aoApertarTecla = (evento: KeyboardEvent): void => {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault()
      if (!aberto) return abrir()
      const passo = evento.key === 'ArrowDown' ? 1 : -1
      setIndiceDestacado((atual) => (atual + passo + opcoes.length) % opcoes.length)
    }
    if (evento.key === 'Enter' && aberto) {
      evento.preventDefault()
      escolher(opcoes[indiceDestacado])
    }
  }

  return (
    <div className="popover-ancora" ref={referencia}>
      <button
        type="button"
        className="selecao-botao"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={rotuloDeAcessibilidade}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={aoApertarTecla}
      >
        <span className={opcaoSelecionada ? undefined : 'selecao-vazia'}>
          {opcaoSelecionada?.rotulo ?? textoQuandoVazio}
        </span>
        <ChevronDown size={TAMANHO_DO_ICONE} />
      </button>

      {aberto && (
        <ul className="popover selecao-lista" role="listbox">
          {opcoes.map((opcao, indice) => (
            <li key={opcao.valor} role="option" aria-selected={opcao.valor === valor}>
              <button
                type="button"
                className={indice === indiceDestacado ? 'selecao-opcao destacada' : 'selecao-opcao'}
                onMouseEnter={() => setIndiceDestacado(indice)}
                onClick={() => escolher(opcao)}
              >
                <span>{opcao.rotulo}</span>
                {opcao.valor === valor && <Check size={TAMANHO_DO_ICONE} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
