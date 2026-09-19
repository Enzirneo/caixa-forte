import { useState } from 'react'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import { calcularTotalGuardado } from '../../../shared/investimentos/calculos'
import type {
  Destino,
  Movimentacao,
  NovaMovimentacao,
  NovoDestino
} from '../../../shared/investimentos/tipos'
import { extrairMensagemDeErro } from '../compartilhado/extrairMensagemDeErro'
import { FormularioDestino } from './FormularioDestino'
import { FormularioMovimentacao } from './FormularioMovimentacao'
import { ListaDestinos } from './ListaDestinos'
import { ListaMovimentacoes } from './ListaMovimentacoes'

interface Props {
  destinos: Destino[]
  movimentacoes: Movimentacao[]
  aoCriarDestino: (novoDestino: NovoDestino) => Promise<void>
  aoCriarMovimentacao: (novaMovimentacao: NovaMovimentacao) => Promise<void>
  aoExcluirMovimentacao: (id: number) => Promise<void>
}

export function PaginaInvestimentos({
  destinos,
  movimentacoes,
  aoCriarDestino,
  aoCriarMovimentacao,
  aoExcluirMovimentacao
}: Props): React.JSX.Element {
  const [erroDeExclusao, setErroDeExclusao] = useState<string | null>(null)

  const excluirMovimentacao = async (id: number): Promise<void> => {
    try {
      await aoExcluirMovimentacao(id)
      setErroDeExclusao(null)
    } catch (erro) {
      setErroDeExclusao(extrairMensagemDeErro(erro))
    }
  }

  return (
    <>
      <div className="resumo-do-mes resumo-unico">
        <div>
          <span>Total guardado (fora do saldo da conta)</span>
          <strong>{formatarCentavosComoReal(calcularTotalGuardado(movimentacoes))}</strong>
        </div>
      </div>
      <FormularioDestino aoCriar={aoCriarDestino} />
      <ListaDestinos destinos={destinos} movimentacoes={movimentacoes} />
      <FormularioMovimentacao
        destinos={destinos}
        movimentacoes={movimentacoes}
        aoCriar={aoCriarMovimentacao}
      />
      {erroDeExclusao && <p className="erro-de-exclusao">{erroDeExclusao}</p>}
      <ListaMovimentacoes
        destinos={destinos}
        movimentacoes={movimentacoes}
        aoExcluir={excluirMovimentacao}
      />
    </>
  )
}
