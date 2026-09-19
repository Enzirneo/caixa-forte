import { useState, type KeyboardEvent } from 'react'
import { gerarChaveDaCategoria } from '../../../shared/categorias/nomeDaCategoria'
import { useFecharAoClicarFora } from './useFecharAoClicarFora'

export interface OpcaoDeBusca {
  valor: string
  rotulo: string
}

interface Props {
  valor: string
  opcoes: OpcaoDeBusca[]
  aoEscolher: (valor: string) => void
  placeholder: string
  rotuloDeAcessibilidade: string
}

const VALOR_SEM_ESCOLHA = ''

// Para escolher entre muitas opções: digitar filtra a lista pelo texto.
export function CampoDeEscolhaComBusca({
  valor,
  opcoes,
  aoEscolher,
  placeholder,
  rotuloDeAcessibilidade
}: Props): React.JSX.Element {
  const [aberto, setAberto] = useState(false)
  const [textoDigitado, setTextoDigitado] = useState<string | null>(null)
  const [indiceDestacado, setIndiceDestacado] = useState(-1)
  const referencia = useFecharAoClicarFora(aberto, () => setAberto(false))

  const opcaoEscolhida = opcoes.find((opcao) => opcao.valor === valor)
  const chaveDaBusca = gerarChaveDaCategoria(textoDigitado ?? '')
  const filtradas = opcoes.filter((opcao) =>
    gerarChaveDaCategoria(opcao.rotulo).includes(chaveDaBusca)
  )
  const mostrarLista = aberto && filtradas.length > 0

  const escolher = (opcao: OpcaoDeBusca): void => {
    aoEscolher(opcao.valor)
    setTextoDigitado(null)
    setAberto(false)
    setIndiceDestacado(-1)
  }

  const aoDigitar = (texto: string): void => {
    setTextoDigitado(texto)
    setAberto(true)
    setIndiceDestacado(-1)
    if (valor !== VALOR_SEM_ESCOLHA) aoEscolher(VALOR_SEM_ESCOLHA)
  }

  const aoApertarTecla = (evento: KeyboardEvent): void => {
    if (!mostrarLista) return
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault()
      const passo = evento.key === 'ArrowDown' ? 1 : -1
      setIndiceDestacado((atual) => (atual + passo + filtradas.length) % filtradas.length)
    }
    if (evento.key === 'Enter' && indiceDestacado >= 0) {
      evento.preventDefault()
      escolher(filtradas[indiceDestacado])
    }
  }

  return (
    <div className="popover-ancora" ref={referencia}>
      <input
        autoComplete="off"
        placeholder={placeholder}
        aria-label={rotuloDeAcessibilidade}
        value={textoDigitado ?? opcaoEscolhida?.rotulo ?? ''}
        onFocus={() => setAberto(true)}
        onChange={(e) => aoDigitar(e.target.value)}
        onKeyDown={aoApertarTecla}
      />

      {mostrarLista && (
        <ul className="popover selecao-lista lista-com-busca" role="listbox">
          {filtradas.map((opcao, indice) => (
            <li key={opcao.valor} role="option" aria-selected={indice === indiceDestacado}>
              <button
                type="button"
                className={indice === indiceDestacado ? 'selecao-opcao destacada' : 'selecao-opcao'}
                onMouseEnter={() => setIndiceDestacado(indice)}
                onClick={() => escolher(opcao)}
              >
                {opcao.rotulo}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
