import type { ReactNode } from 'react'
import type { Cartao } from '../../../shared/cartoes/tipos'
import { Selecao } from './Selecao'

interface Props {
  cartoes: Cartao[]
  ehDeCartao: boolean
  aoMudarEhDeCartao: (ehDeCartao: boolean) => void
  cartaoEscolhido: Cartao | undefined
  aoEscolherCartao: (cartaoId: string) => void
  textoDaCaixa: string
  // Campos extras que só fazem sentido com cartão (por exemplo, as parcelas).
  children?: ReactNode
}

export function OpcaoDeCartao({
  cartoes,
  ehDeCartao,
  aoMudarEhDeCartao,
  cartaoEscolhido,
  aoEscolherCartao,
  textoDaCaixa,
  children
}: Props): React.JSX.Element {
  return (
    <div className="opcao-extra">
      <label className="caixa-de-selecao">
        <input
          type="checkbox"
          checked={ehDeCartao}
          onChange={(e) => aoMudarEhDeCartao(e.target.checked)}
        />
        {textoDaCaixa}
      </label>
      {ehDeCartao && cartaoEscolhido && (
        <div className="campos-da-opcao">
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
        </div>
      )}
    </div>
  )
}
