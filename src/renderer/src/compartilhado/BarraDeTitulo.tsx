import { IconeCofre } from './IconeCofre'

const TAMANHO_DO_ICONE = 15

export function BarraDeTitulo(): React.JSX.Element {
  return (
    <div className="barra-de-titulo">
      <IconeCofre size={TAMANHO_DO_ICONE} />
      <span>Caixa Forte</span>
    </div>
  )
}
