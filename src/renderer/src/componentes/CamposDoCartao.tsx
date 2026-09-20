import type { ReactNode } from 'react'
import type { Cartao } from '../../../shared/cartoes/tipos'
import { Selecao } from './Selecao'

interface Props {
  cartoes: Cartao[]
  cartaoEscolhido: Cartao
  aoEscolherCartao: (cartaoId: string) => void
  // Campos extras que só fazem sentido com cartão (por exemplo, as parcelas).
  children?: ReactNode
}

// Devolve os campos soltos (sem caixa em volta) para caberem na linha do formulário que os usa.
export function CamposDoCartao({
  cartoes,
  cartaoEscolhido,
  aoEscolherCartao,
  children
}: Props): React.JSX.Element {
  return (
    <>
      <div className="campo">
        <span className="rotulo-do-campo">Cartão</span>
        <Selecao
          valor={String(cartaoEscolhido.id)}
          opcoes={cartoes.map((opcao) => ({ valor: String(opcao.id), rotulo: opcao.nome }))}
          aoMudar={aoEscolherCartao}
          rotuloDeAcessibilidade="Cartão"
        />
      </div>
      {children}
    </>
  )
}
