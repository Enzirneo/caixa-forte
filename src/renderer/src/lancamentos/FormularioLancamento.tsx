import { useState, type FormEvent } from 'react'
import { indexarAjustesDoCartao } from '../../../shared/cartoes/cicloDaFatura'
import { montarParcelasDaCompra, validarNovaCompra } from '../../../shared/cartoes/regras'
import type { AjusteDeFechamento, Cartao, NovaCompraNoCartao } from '../../../shared/cartoes/tipos'
import { formatarDataIsoComoBrasileira, obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { converterTextoEmCentavos } from '../../../shared/dinheiro/converterTextoEmCentavos'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import { formatarCentavosParaCampo } from '../../../shared/dinheiro/formatarCentavosParaCampo'
import {
  TIPOS_LANCAMENTO,
  type Lancamento,
  type NovoLancamento,
  type TipoLancamento
} from '../../../shared/lancamentos/tipos'
import { validarNovoLancamento } from '../../../shared/lancamentos/validarNovoLancamento'
import { CampoDeCategoria } from '../componentes/CampoDeCategoria'
import { CampoDeData } from '../componentes/CampoDeData'
import { Selecao } from '../componentes/Selecao'

const PARCELAS_PADRAO = '1'
const MAXIMO_DE_PARCELAS_NO_CAMPO = 60

const ROTULO_DO_TIPO: Record<TipoLancamento, string> = {
  receita: 'Receita',
  despesa: 'Despesa'
}

interface Props {
  lancamentoEmEdicao: Lancamento | null
  categoriasSugeridas: string[]
  cartoes: Cartao[]
  ajustesDeFechamento: AjusteDeFechamento[]
  aoSalvar: (novoLancamento: NovoLancamento) => Promise<void>
  aoRegistrarNoCartao: (compra: NovaCompraNoCartao) => Promise<void>
  aoCancelarEdicao: () => void
}

export function FormularioLancamento({
  lancamentoEmEdicao,
  categoriasSugeridas,
  cartoes,
  ajustesDeFechamento,
  aoSalvar,
  aoRegistrarNoCartao,
  aoCancelarEdicao
}: Props): React.JSX.Element {
  const [descricao, setDescricao] = useState(lancamentoEmEdicao?.descricao ?? '')
  const [valorTexto, setValorTexto] = useState(
    lancamentoEmEdicao ? formatarCentavosParaCampo(lancamentoEmEdicao.valorCentavos) : ''
  )
  const [data, setData] = useState(lancamentoEmEdicao?.data ?? obterDataIsoDeHoje())
  const [tipo, setTipo] = useState<TipoLancamento>(lancamentoEmEdicao?.tipo ?? 'despesa')
  const [categoria, setCategoria] = useState(lancamentoEmEdicao?.categoria ?? '')
  const [ehDeCartao, setEhDeCartao] = useState(false)
  const [cartaoEscolhido, setCartaoEscolhido] = useState('')
  const [parcelasTexto, setParcelasTexto] = useState(PARCELAS_PADRAO)
  const [erros, setErros] = useState<string[]>([])

  const podeUsarCartao = !lancamentoEmEdicao && tipo === 'despesa' && cartoes.length > 0
  // Cartão de crédito só tem despesa: não existe devolução que entre como dinheiro na conta.
  const cartao =
    podeUsarCartao && ehDeCartao
      ? (cartoes.find((candidato) => String(candidato.id) === cartaoEscolhido) ?? cartoes[0])
      : undefined

  const montarCompra = (cartaoDaCompra: Cartao): NovaCompraNoCartao => ({
    cartaoId: cartaoDaCompra.id,
    descricao,
    valorTotalCentavos: converterTextoEmCentavos(valorTexto) ?? 0,
    parcelas: Number(parcelasTexto),
    dataDaCompra: data,
    categoria
  })

  const parcelasDaCompra =
    cartao && validarNovaCompra(montarCompra(cartao)).length === 0
      ? montarParcelasDaCompra(
          montarCompra(cartao),
          cartao,
          indexarAjustesDoCartao(ajustesDeFechamento, cartao.id)
        )
      : []

  const limparCamposDigitados = (): void => {
    setDescricao('')
    setValorTexto('')
    setCategoria('')
    setParcelasTexto(PARCELAS_PADRAO)
  }

  const registrarNoCartao = async (cartaoDaCompra: Cartao): Promise<void> => {
    const compra = montarCompra(cartaoDaCompra)
    const errosEncontrados = validarNovaCompra(compra)
    setErros(errosEncontrados)
    if (errosEncontrados.length > 0) return

    await aoRegistrarNoCartao(compra)
    limparCamposDigitados()
  }

  const enviar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault()
    if (cartao) {
      await registrarNoCartao(cartao)
      return
    }

    const novoLancamento: NovoLancamento = {
      descricao,
      valorCentavos: converterTextoEmCentavos(valorTexto) ?? 0,
      data,
      tipo,
      categoria
    }

    const errosEncontrados = validarNovoLancamento(novoLancamento)
    setErros(errosEncontrados)
    if (errosEncontrados.length > 0) return

    await aoSalvar(novoLancamento)
    limparCamposDigitados()
  }

  return (
    <form
      className={
        lancamentoEmEdicao
          ? 'formulario formulario-lancamento em-edicao'
          : 'formulario formulario-lancamento'
      }
      onSubmit={enviar}
    >
      <label>
        Descrição
        <input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </label>
      <label>
        Valor (R$)
        <input
          inputMode="decimal"
          placeholder="0,00"
          value={valorTexto}
          onChange={(e) => setValorTexto(e.target.value)}
        />
      </label>
      <div className="campo campo-de-data">
        <span className="rotulo-do-campo">Data</span>
        <CampoDeData valor={data} aoMudar={setData} rotuloDeAcessibilidade="Data" />
      </div>
      <div className="campo">
        <span className="rotulo-do-campo">Tipo</span>
        <Selecao
          valor={tipo}
          opcoes={TIPOS_LANCAMENTO.map((opcao) => ({
            valor: opcao,
            rotulo: ROTULO_DO_TIPO[opcao]
          }))}
          aoMudar={(valor) => setTipo(valor as TipoLancamento)}
          rotuloDeAcessibilidade="Tipo"
        />
      </div>
      <div className="campo">
        <span className="rotulo-do-campo">Categoria</span>
        <CampoDeCategoria
          valor={categoria}
          aoMudar={setCategoria}
          sugestoes={categoriasSugeridas}
        />
      </div>
      <div className="acoes-formulario">
        <button type="submit">{lancamentoEmEdicao ? 'Salvar' : 'Adicionar'}</button>
        {lancamentoEmEdicao && (
          <button type="button" className="secundario" onClick={aoCancelarEdicao}>
            Cancelar
          </button>
        )}
      </div>
      {podeUsarCartao && (
        <div className="opcao-de-cartao">
          <label className="caixa-de-selecao">
            <input
              type="checkbox"
              checked={ehDeCartao}
              onChange={(e) => setEhDeCartao(e.target.checked)}
            />
            Esta despesa é de um cartão de crédito
          </label>
          {cartao && (
            <>
              <div className="campo">
                <span className="rotulo-do-campo">Cartão</span>
                <Selecao
                  valor={String(cartao.id)}
                  opcoes={cartoes.map((opcao) => ({ valor: String(opcao.id), rotulo: opcao.nome }))}
                  aoMudar={setCartaoEscolhido}
                  rotuloDeAcessibilidade="Cartão"
                />
              </div>
              <label className="campo-de-parcelas">
                Parcelas
                <input
                  type="number"
                  min={1}
                  max={MAXIMO_DE_PARCELAS_NO_CAMPO}
                  value={parcelasTexto}
                  onChange={(e) => setParcelasTexto(e.target.value)}
                />
              </label>
            </>
          )}
        </div>
      )}
      {parcelasDaCompra.length > 0 && (
        <p className="previa-da-compra">
          {parcelasDaCompra.length}× de{' '}
          {formatarCentavosComoReal(parcelasDaCompra[0].lancamento.valorCentavos)} · a primeira
          parcela vence em {formatarDataIsoComoBrasileira(parcelasDaCompra[0].lancamento.data)}
          {parcelasDaCompra.length > 1 &&
            ` e a última em ${formatarDataIsoComoBrasileira(parcelasDaCompra[parcelasDaCompra.length - 1].lancamento.data)}`}
        </p>
      )}
      {erros.length > 0 && (
        <ul className="erros">
          {erros.map((erro) => (
            <li key={erro}>{erro}</li>
          ))}
        </ul>
      )}
    </form>
  )
}
