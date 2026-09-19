import { useState } from 'react'

interface Props {
  aoConfirmar: () => Promise<void>
}

export function BotaoExcluirComConfirmacao({ aoConfirmar }: Props): React.JSX.Element {
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false)

  const confirmar = async (): Promise<void> => {
    await aoConfirmar()
    setAguardandoConfirmacao(false)
  }

  if (!aguardandoConfirmacao) {
    return (
      <button className="secundario" onClick={() => setAguardandoConfirmacao(true)}>
        Excluir
      </button>
    )
  }

  return (
    <>
      <span className="situacao">Excluir mesmo?</span>
      <button className="perigo" onClick={confirmar}>
        Sim, excluir
      </button>
      <button className="secundario" onClick={() => setAguardandoConfirmacao(false)}>
        Cancelar
      </button>
    </>
  )
}
