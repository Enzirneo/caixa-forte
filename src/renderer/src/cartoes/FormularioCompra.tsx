import { useState, type FormEvent } from 'react'
import { formatarDataIsoComoBrasileira, obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { converterTextoEmCentavos } from '../../../shared/dinheiro/converterTextoEmCentavos'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import { montarParcelasDaCompra, validarNovaCompra } from '../../../shared/cartoes/regras'
import { indexarAjustesDoCartao } from '../../../shared/cartoes/cicloDaFatura'
import type { AjusteDeFechamento, Cartao, NovaCompraNoCartao } from '../../../shared/cartoes/tipos'
import { CampoDeCategoria } from '../componentes/CampoDeCategoria'
import { CampoDeData } from '../componentes/CampoDeData'
import { Selecao } from '../componentes/Selecao'

const PARCELAS_PADRAO = '1'

interface Props {
  cartoes: Cartao[]
  ajustes: AjusteDeFechamento[]
  categoriasSugeridas: string[]
  aoRegistrar: (novaCompra: NovaCompraNoCartao) => Promise<void>
}

export function FormularioCompra({
  cartoes,
  ajustes,
  categoriasSugeridas,
  aoRegistrar
}: Props): React.JSX.Element {
  const [cartaoEscolhido, setCartaoEscolhido] = useState<number | null>(null)
  const [descricao, setDescricao] = useState('')
  const [valorTexto, setValorTexto] = useState('')
  const [parcelasTexto, setParcelasTexto] = useState(PARCELAS_PADRAO)
  const [dataDaCompra, setDataDaCompra] = useState(obterDataIsoDeHoje())
  const [categoria, setCategoria] = useState('')
  const [erros, setErros] = useState<string[]>([])

  if (cartoes.length === 0) {
    return <p className="vazio">Cadastre um cartão para registrar compras.</p>
  }

  const cartao = cartoes.find((candidato) => candidato.id === cartaoEscolhido) ?? cartoes[0]
  const compra: NovaCompraNoCartao = {
    cartaoId: cartao.id,
    descricao,
    valorTotalCentavos: converterTextoEmCentavos(valorTexto) ?? 0,
    parcelas: Number(parcelasTexto),
    dataDaCompra,
    categoria
  }

  const parcelas =
    validarNovaCompra(compra).length === 0
      ? montarParcelasDaCompra(compra, cartao, indexarAjustesDoCartao(ajustes, cartao.id))
      : []
  const primeira = parcelas[0]
  const ultima = parcelas[parcelas.length - 1]

  const enviar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault()
    const errosEncontrados = validarNovaCompra(compra)
    setErros(errosEncontrados)
    if (errosEncontrados.length > 0) return

    await aoRegistrar(compra)
    setDescricao('')
    setValorTexto('')
    setParcelasTexto(PARCELAS_PADRAO)
    setCategoria('')
  }

  return (
    <form className="formulario formulario-compra" onSubmit={enviar}>
      <div className="campo">
        <span className="rotulo-do-campo">Cartão</span>
        <Selecao
          valor={String(cartao.id)}
          opcoes={cartoes.map((opcao) => ({ valor: String(opcao.id), rotulo: opcao.nome }))}
          aoMudar={(valor) => setCartaoEscolhido(Number(valor))}
          rotuloDeAcessibilidade="Cartão"
        />
      </div>
      <label>
        Descrição
        <input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </label>
      <label>
        Valor total (R$)
        <input
          inputMode="decimal"
          placeholder="0,00"
          value={valorTexto}
          onChange={(e) => setValorTexto(e.target.value)}
        />
      </label>
      <label>
        Parcelas
        <input
          type="number"
          min={1}
          max={60}
          value={parcelasTexto}
          onChange={(e) => setParcelasTexto(e.target.value)}
        />
      </label>
      <div className="campo">
        <span className="rotulo-do-campo">Data da compra</span>
        <CampoDeData
          valor={dataDaCompra}
          aoMudar={setDataDaCompra}
          rotuloDeAcessibilidade="Data da compra"
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
      <button type="submit">Registrar compra</button>

      {primeira && ultima && (
        <p className="previa-da-compra">
          {parcelas.length}× de {formatarCentavosComoReal(primeira.lancamento.valorCentavos)} · a
          primeira parcela vence em {formatarDataIsoComoBrasileira(primeira.lancamento.data)}
          {parcelas.length > 1 &&
            ` e a última em ${formatarDataIsoComoBrasileira(ultima.lancamento.data)}`}
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
