import { useState, type KeyboardEvent } from 'react'
import {
  capitalizarPrimeiraLetra,
  filtrarSugestoesDeCategoria
} from '../../../shared/categorias/nomeDaCategoria'
import { useFecharAoClicarFora } from './useFecharAoClicarFora'

interface Props {
  valor: string
  aoMudar: (categoria: string) => void
  sugestoes: string[]
  rotuloDeAcessibilidade?: string
}

export function CampoDeCategoria({
  valor,
  aoMudar,
  sugestoes,
  rotuloDeAcessibilidade = 'Categoria'
}: Props): React.JSX.Element {
  const [aberto, setAberto] = useState(false)
  const [indiceDestacado, setIndiceDestacado] = useState(-1)
  const referencia = useFecharAoClicarFora(aberto, () => setAberto(false))

  const filtradas = filtrarSugestoesDeCategoria(sugestoes, valor)
  const mostrarLista = aberto && filtradas.length > 0

  const escolher = (categoria: string): void => {
    aoMudar(categoria)
    setAberto(false)
    setIndiceDestacado(-1)
  }

  const aoApertarTecla = (evento: KeyboardEvent): void => {
    if (!mostrarLista) return
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault()
      const passo = evento.key === 'ArrowDown' ? 1 : -1
      setIndiceDestacado((atual) => (atual + passo + filtradas.length) % filtradas.length)
    }
    // Só intercepta o Enter quando há uma sugestão destacada; senão o formulário é enviado.
    if (evento.key === 'Enter' && indiceDestacado >= 0) {
      evento.preventDefault()
      escolher(filtradas[indiceDestacado])
    }
  }

  return (
    <div className="popover-ancora" ref={referencia}>
      <input
        autoComplete="off"
        aria-label={rotuloDeAcessibilidade}
        value={valor}
        onFocus={() => setAberto(true)}
        onChange={(e) => {
          aoMudar(capitalizarPrimeiraLetra(e.target.value))
          setAberto(true)
          setIndiceDestacado(-1)
        }}
        onKeyDown={aoApertarTecla}
      />

      {mostrarLista && (
        <ul className="popover selecao-lista" role="listbox">
          {filtradas.map((categoria, indice) => (
            <li key={categoria} role="option" aria-selected={indice === indiceDestacado}>
              <button
                type="button"
                className={indice === indiceDestacado ? 'selecao-opcao destacada' : 'selecao-opcao'}
                onMouseEnter={() => setIndiceDestacado(indice)}
                onClick={() => escolher(categoria)}
              >
                {categoria}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
