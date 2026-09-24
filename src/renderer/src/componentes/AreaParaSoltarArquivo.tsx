import { FileUp } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'

interface Props {
  extensoesAceitas: string
  aoEscolher: (arquivo: File) => void
  rotulo: string
}

const TAMANHO_DO_ICONE = 18

export function AreaParaSoltarArquivo({
  extensoesAceitas,
  aoEscolher,
  rotulo
}: Props): React.JSX.Element {
  const [arrastando, setArrastando] = useState(false)
  const campoDeArquivo = useRef<HTMLInputElement>(null)

  const aoSoltar = (evento: DragEvent): void => {
    evento.preventDefault()
    setArrastando(false)
    const arquivo = evento.dataTransfer.files[0]
    if (arquivo) aoEscolher(arquivo)
  }

  const aoArrastarSobre = (evento: DragEvent): void => {
    evento.preventDefault()
    setArrastando(true)
  }

  return (
    <button
      type="button"
      className={arrastando ? 'area-de-arquivo arrastando' : 'area-de-arquivo'}
      onClick={() => campoDeArquivo.current?.click()}
      onDragOver={aoArrastarSobre}
      onDragLeave={() => setArrastando(false)}
      onDrop={aoSoltar}
    >
      <FileUp size={TAMANHO_DO_ICONE} />
      <span>{rotulo}</span>
      <input
        ref={campoDeArquivo}
        type="file"
        hidden
        accept={extensoesAceitas}
        onChange={(e) => {
          const arquivo = e.target.files?.[0]
          if (arquivo) aoEscolher(arquivo)
          e.target.value = ''
        }}
      />
    </button>
  )
}
