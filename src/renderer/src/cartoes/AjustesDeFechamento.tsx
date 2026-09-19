import { useState } from 'react'
import { formatarDataIsoComoBrasileira } from '../../../shared/datas/dataIso'
import { formatarMesPorExtenso } from '../../../shared/datas/mes'
import type { AjusteDeFechamento, Cartao } from '../../../shared/cartoes/tipos'
import { CampoDeData } from '../componentes/CampoDeData'
import { CampoDeMes } from '../componentes/CampoDeMes'

interface Props {
  cartao: Cartao
  ajustes: AjusteDeFechamento[]
  aoSalvar: (ajuste: AjusteDeFechamento) => Promise<void>
  aoRemover: (cartaoId: number, mesDoVencimento: string) => Promise<void>
}

export function AjustesDeFechamento({
  cartao,
  ajustes,
  aoSalvar,
  aoRemover
}: Props): React.JSX.Element {
  const [mesDoVencimento, setMesDoVencimento] = useState('')
  const [melhorDataDeCompra, setMelhorDataDeCompra] = useState('')

  const podeAdicionar = mesDoVencimento !== '' && melhorDataDeCompra !== ''

  const adicionar = async (): Promise<void> => {
    await aoSalvar({ cartaoId: cartao.id, mesDoVencimento, melhorDataDeCompra })
    setMesDoVencimento('')
    setMelhorDataDeCompra('')
  }

  return (
    <>
      <h3 className="titulo-da-secao">Ajustes de fechamento</h3>
      <p className="vazio-pequeno">
        Só para os meses em que o banco fugiu da regra do cartão: informe a melhor data de compra
        que aparece na fatura daquele mês.
      </p>
      <div className="formulario ajuste-de-fechamento">
        <div className="campo">
          <span className="rotulo-do-campo">Fatura que vence em</span>
          <CampoDeMes
            valor={mesDoVencimento}
            aoMudar={setMesDoVencimento}
            rotuloDeAcessibilidade="Mês do vencimento da fatura"
          />
        </div>
        <div className="campo">
          <span className="rotulo-do-campo">Melhor data de compra</span>
          <CampoDeData
            valor={melhorDataDeCompra}
            aoMudar={setMelhorDataDeCompra}
            rotuloDeAcessibilidade="Melhor data de compra"
          />
        </div>
        <button type="button" disabled={!podeAdicionar} onClick={adicionar}>
          Adicionar ajuste
        </button>
      </div>

      {ajustes.length > 0 && (
        <table className="lista">
          <thead>
            <tr>
              <th>Fatura que vence em</th>
              <th>Melhor data de compra</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ajustes.map((ajuste) => (
              <tr key={ajuste.mesDoVencimento}>
                <td>{formatarMesPorExtenso(ajuste.mesDoVencimento)}</td>
                <td>{formatarDataIsoComoBrasileira(ajuste.melhorDataDeCompra)}</td>
                <td className="acoes-linha">
                  <button
                    type="button"
                    className="secundario"
                    onClick={() => aoRemover(cartao.id, ajuste.mesDoVencimento)}
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
