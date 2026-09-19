import { aplicarMascaraDeValor } from '../../../shared/dinheiro/aplicarMascaraDeValor'

interface Props {
  valor: string
  aoMudar: (texto: string) => void
  placeholder?: string
  rotuloDeAcessibilidade?: string
}

// Campo de dinheiro em que só se digitam números: eles entram pelos centavos, sem vírgula.
export function CampoDeValor({
  valor,
  aoMudar,
  placeholder = '0,00',
  rotuloDeAcessibilidade
}: Props): React.JSX.Element {
  return (
    <input
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      aria-label={rotuloDeAcessibilidade}
      value={valor}
      onChange={(e) => aoMudar(aplicarMascaraDeValor(e.target.value))}
    />
  )
}
