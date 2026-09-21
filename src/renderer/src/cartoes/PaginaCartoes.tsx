import { useState } from 'react'
import type {
  AjusteDeFechamento,
  Cartao,
  NovoCartao,
  VinculoDeCompra
} from '../../../shared/cartoes/tipos'
import type { Lancamento } from '../../../shared/lancamentos/tipos'
import type { Recorrencia } from '../../../shared/recorrencias/tipos'
import { extrairMensagemDeErro } from '../compartilhado/extrairMensagemDeErro'
import { FormularioCartao } from './FormularioCartao'
import { PainelDoCartao } from './PainelDoCartao'

interface Props {
  lancamentos: Lancamento[]
  cartoes: Cartao[]
  vinculos: VinculoDeCompra[]
  ajustes: AjusteDeFechamento[]
  recorrencias: Recorrencia[]
  aoCriarCartao: (novoCartao: NovoCartao) => Promise<void>
  aoAtualizarCartao: (cartao: Cartao) => Promise<void>
  aoExcluirCartao: (id: number) => Promise<void>
  aoExcluirCompra: (grupoId: number) => Promise<void>
  aoSalvarAjuste: (ajuste: AjusteDeFechamento) => Promise<void>
  aoRemoverAjuste: (cartaoId: number, mesDoVencimento: string) => Promise<void>
}

export function PaginaCartoes({
  lancamentos,
  cartoes,
  vinculos,
  ajustes,
  recorrencias,
  aoCriarCartao,
  aoAtualizarCartao,
  aoExcluirCartao,
  aoExcluirCompra,
  aoSalvarAjuste,
  aoRemoverAjuste
}: Props): React.JSX.Element {
  const [cartaoEmEdicao, setCartaoEmEdicao] = useState<Cartao | null>(null)
  const [erroDeExclusao, setErroDeExclusao] = useState<string | null>(null)

  const salvarCartao = async (novoCartao: NovoCartao): Promise<void> => {
    if (cartaoEmEdicao) await aoAtualizarCartao({ ...novoCartao, id: cartaoEmEdicao.id })
    else await aoCriarCartao(novoCartao)
    setCartaoEmEdicao(null)
  }

  const excluirCartao = async (id: number): Promise<void> => {
    try {
      await aoExcluirCartao(id)
      setErroDeExclusao(null)
    } catch (erro) {
      setErroDeExclusao(extrairMensagemDeErro(erro))
    }
  }

  return (
    <>
      <p className="aviso-de-fechamento">
        Para lançar uma compra no cartão, use a aba Lançamentos e marque que a despesa é de um
        cartão. Cada parcela vira uma despesa na data em que a fatura vence, que é quando o dinheiro
        sai da conta.
      </p>

      <FormularioCartao
        key={cartaoEmEdicao?.id ?? 'novo'}
        cartaoEmEdicao={cartaoEmEdicao}
        aoSalvar={salvarCartao}
        aoCancelarEdicao={() => setCartaoEmEdicao(null)}
      />

      {erroDeExclusao && <p className="erro-de-exclusao">{erroDeExclusao}</p>}
      {cartoes.map((cartao) => (
        <PainelDoCartao
          key={cartao.id}
          cartao={cartao}
          lancamentos={lancamentos}
          vinculos={vinculos}
          ajustes={ajustes.filter((ajuste) => ajuste.cartaoId === cartao.id)}
          recorrencias={recorrencias.filter((recorrencia) => recorrencia.cartaoId === cartao.id)}
          aoEditar={setCartaoEmEdicao}
          aoExcluirCartao={excluirCartao}
          aoExcluirCompra={aoExcluirCompra}
          aoSalvarAjuste={aoSalvarAjuste}
          aoRemoverAjuste={aoRemoverAjuste}
        />
      ))}
    </>
  )
}
