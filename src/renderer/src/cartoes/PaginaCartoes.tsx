import { useState } from 'react'
import { listarCategoriasEmUso } from '../../../shared/categorias/nomeDaCategoria'
import type {
  AjusteDeFechamento,
  Cartao,
  NovaCompraNoCartao,
  NovoCartao,
  VinculoDeCompra
} from '../../../shared/cartoes/tipos'
import type { Lancamento } from '../../../shared/lancamentos/tipos'
import { extrairMensagemDeErro } from '../compartilhado/extrairMensagemDeErro'
import { FormularioCartao } from './FormularioCartao'
import { FormularioCompra } from './FormularioCompra'
import { PainelDoCartao } from './PainelDoCartao'

interface Props {
  lancamentos: Lancamento[]
  cartoes: Cartao[]
  vinculos: VinculoDeCompra[]
  ajustes: AjusteDeFechamento[]
  aoCriarCartao: (novoCartao: NovoCartao) => Promise<void>
  aoAtualizarCartao: (cartao: Cartao) => Promise<void>
  aoExcluirCartao: (id: number) => Promise<void>
  aoRegistrarCompra: (novaCompra: NovaCompraNoCartao) => Promise<void>
  aoExcluirCompra: (grupoId: number) => Promise<void>
  aoSalvarAjuste: (ajuste: AjusteDeFechamento) => Promise<void>
  aoRemoverAjuste: (cartaoId: number, mesDoVencimento: string) => Promise<void>
}

export function PaginaCartoes({
  lancamentos,
  cartoes,
  vinculos,
  ajustes,
  aoCriarCartao,
  aoAtualizarCartao,
  aoExcluirCartao,
  aoRegistrarCompra,
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
        Cada parcela vira uma despesa na data em que a fatura vence, que é quando o dinheiro sai da
        conta. Parcelas de meses futuros só entram no saldo quando o dia chega.
      </p>

      <FormularioCartao
        key={cartaoEmEdicao?.id ?? 'novo'}
        cartaoEmEdicao={cartaoEmEdicao}
        aoSalvar={salvarCartao}
        aoCancelarEdicao={() => setCartaoEmEdicao(null)}
      />
      <FormularioCompra
        cartoes={cartoes}
        ajustes={ajustes}
        categoriasSugeridas={listarCategoriasEmUso(lancamentos)}
        aoRegistrar={aoRegistrarCompra}
      />

      {erroDeExclusao && <p className="erro-de-exclusao">{erroDeExclusao}</p>}
      {cartoes.map((cartao) => (
        <PainelDoCartao
          key={cartao.id}
          cartao={cartao}
          lancamentos={lancamentos}
          vinculos={vinculos}
          ajustes={ajustes.filter((ajuste) => ajuste.cartaoId === cartao.id)}
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
