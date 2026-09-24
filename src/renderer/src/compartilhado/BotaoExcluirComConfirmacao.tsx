import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  aoConfirmar: () => Promise<void>
}

export function BotaoExcluirComConfirmacao({ aoConfirmar }: Props): React.JSX.Element {
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false)

  useEffect(() => {
    if (!aguardandoConfirmacao) return
    const fecharComEsc = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') setAguardandoConfirmacao(false)
    }
    window.addEventListener('keydown', fecharComEsc)
    return () => window.removeEventListener('keydown', fecharComEsc)
  }, [aguardandoConfirmacao])

  const confirmar = async (): Promise<void> => {
    await aoConfirmar()
    setAguardandoConfirmacao(false)
  }

  return (
    <>
      <button className="secundario" onClick={() => setAguardandoConfirmacao(true)}>
        Excluir
      </button>
      {aguardandoConfirmacao &&
        createPortal(
          <div className="fundo-do-modal" onClick={() => setAguardandoConfirmacao(false)}>
            <div
              className="modal"
              role="alertdialog"
              aria-labelledby="titulo-da-exclusao"
              onClick={(evento) => evento.stopPropagation()}
            >
              <h2 id="titulo-da-exclusao">Excluir este item?</h2>
              <p>Essa ação não pode ser desfeita.</p>
              <div className="acoes-do-modal">
                <button className="secundario" onClick={() => setAguardandoConfirmacao(false)}>
                  Cancelar
                </button>
                <button className="perigo" autoFocus onClick={confirmar}>
                  Sim, excluir
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
