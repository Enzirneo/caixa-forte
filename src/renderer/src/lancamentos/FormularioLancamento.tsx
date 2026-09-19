import { useState, type FormEvent } from 'react'
import { indexarAjustesDoCartao } from '../../../shared/cartoes/cicloDaFatura'
import { aplicarMascaraDeValor } from '../../../shared/dinheiro/aplicarMascaraDeValor'
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
import { formatarMesPorExtenso } from '../../../shared/datas/mes'
import type { DefinicaoDeRecorrencia } from '../../../shared/recorrencias/tipos'
import {
  listarDespesasReembolsaveis,
  validarReembolso
} from '../../../shared/lancamentos/reembolsos'
import { validarNovoLancamento } from '../../../shared/lancamentos/validarNovoLancamento'
import { CampoDeMes } from '../componentes/CampoDeMes'
import { CampoDeEscolhaComBusca } from '../componentes/CampoDeEscolhaComBusca'
import { OpcaoDeCartao } from '../componentes/OpcaoDeCartao'
import { CampoDeCategoria } from '../componentes/CampoDeCategoria'
import { CampoDeData } from '../componentes/CampoDeData'
import { Selecao } from '../componentes/Selecao'
import { CampoDeValor } from '../componentes/CampoDeValor'

const PARCELAS_PADRAO = '1'
const MAXIMO_DE_PARCELAS_NO_CAMPO = 60

function descreverEfeitoDaRecorrencia(recorrente: boolean, recorrenteInicial: boolean): string {
  if (recorrente && recorrenteInicial)
    return 'Continua sendo lançado todo mês, até o mês escolhido.'
  if (recorrente) {
    return 'Os próximos meses são lançados sozinhos, a partir do mês seguinte, até o mês escolhido.'
  }
  if (recorrenteInicial) return 'Ao salvar, deixa de ser lançado nos próximos meses.'
  return ''
}

const ROTULO_DO_TIPO: Record<TipoLancamento, string> = {
  receita: 'Receita',
  despesa: 'Despesa',
  reembolso: 'Reembolso'
}

interface Props {
  lancamentoEmEdicao: Lancamento | null
  todosOsLancamentos: Lancamento[]
  podeSerRecorrente: boolean
  recorrenteInicial: boolean
  mesDeFimInicial: string
  mesMinimoDeTermino: string
  categoriasSugeridas: string[]
  cartoes: Cartao[]
  ajustesDeFechamento: AjusteDeFechamento[]
  aoSalvar: (
    novoLancamento: NovoLancamento,
    definicaoDeRecorrencia?: DefinicaoDeRecorrencia
  ) => Promise<void>
  aoRegistrarNoCartao: (compra: NovaCompraNoCartao) => Promise<void>
  aoCancelarEdicao: () => void
}

export function FormularioLancamento({
  lancamentoEmEdicao,
  todosOsLancamentos,
  podeSerRecorrente,
  recorrenteInicial,
  mesDeFimInicial,
  mesMinimoDeTermino,
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
  const [despesaReembolsadaId, setDespesaReembolsadaId] = useState(
    lancamentoEmEdicao?.reembolsoDeId ? String(lancamentoEmEdicao.reembolsoDeId) : ''
  )
  const [recorrente, setRecorrente] = useState(recorrenteInicial)
  const [mesDeFim, setMesDeFim] = useState(mesDeFimInicial)
  const [ehDeCartao, setEhDeCartao] = useState(false)
  const [cartaoEscolhido, setCartaoEscolhido] = useState('')
  const [parcelasTexto, setParcelasTexto] = useState(PARCELAS_PADRAO)
  const [erros, setErros] = useState<string[]>([])

  const ehReembolso = tipo === 'reembolso'
  const mostrarRecorrente = Boolean(lancamentoEmEdicao) && podeSerRecorrente && !ehReembolso
  const despesasReembolsaveis = ehReembolso
    ? listarDespesasReembolsaveis(todosOsLancamentos, lancamentoEmEdicao?.id)
    : []
  const despesaEscolhida = despesasReembolsaveis.find(
    ({ despesa }) => String(despesa.id) === despesaReembolsadaId
  )

  const escolherDespesaReembolsada = (id: string): void => {
    setDespesaReembolsadaId(id)
    const escolhida = despesasReembolsaveis.find(({ despesa }) => String(despesa.id) === id)
    if (!escolhida) return
    setCategoria(escolhida.despesa.categoria)
    if (!valorTexto) setValorTexto(aplicarMascaraDeValor(String(escolhida.reembolsavelCentavos)))
    if (!descricao) setDescricao(`Reembolso: ${escolhida.despesa.descricao}`)
  }

  const podeUsarCartao = !lancamentoEmEdicao && tipo === 'despesa' && cartoes.length > 0
  // Cartão de crédito só tem despesa: não existe devolução que entre como dinheiro na conta.
  const cartao =
    podeUsarCartao && ehDeCartao
      ? (cartoes.find((candidato) => String(candidato.id) === cartaoEscolhido) ?? cartoes[0])
      : undefined

  const temOpcoesExtras = ehReembolso || podeUsarCartao || mostrarRecorrente

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
    setDespesaReembolsadaId('')
  }

  const registrarNoCartao = async (cartaoDaCompra: Cartao): Promise<void> => {
    const compra = montarCompra(cartaoDaCompra)
    const errosEncontrados = validarNovaCompra(compra)
    setErros(errosEncontrados)
    if (errosEncontrados.length > 0) return

    await aoRegistrarNoCartao(compra)
    limparCamposDigitados()
  }

  // Só avisa o sistema quando a pessoa mudou algo: marcar, desmarcar ou trocar o término.
  const montarDefinicaoDeRecorrencia = (): DefinicaoDeRecorrencia | undefined => {
    const mudouTermino = recorrente && mesDeFim !== mesDeFimInicial
    if (!mostrarRecorrente || (recorrente === recorrenteInicial && !mudouTermino)) return undefined
    return { recorrente, mesDeFim: mesDeFim === '' ? null : mesDeFim }
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
      categoria,
      reembolsoDeId: ehReembolso && despesaReembolsadaId ? Number(despesaReembolsadaId) : null
    }

    const errosEncontrados = [
      ...validarNovoLancamento(novoLancamento),
      ...(mostrarRecorrente && recorrente && mesDeFim !== '' && mesDeFim < mesMinimoDeTermino
        ? [`O término não pode ser antes de ${formatarMesPorExtenso(mesMinimoDeTermino)}.`]
        : []),
      ...(ehReembolso && !despesaReembolsadaId
        ? ['Escolha a despesa que foi reembolsada.']
        : validarReembolso(novoLancamento, todosOsLancamentos, lancamentoEmEdicao?.id))
    ]
    setErros(errosEncontrados)
    if (errosEncontrados.length > 0) return

    const definicaoDeRecorrencia = montarDefinicaoDeRecorrencia()
    await aoSalvar(novoLancamento, definicaoDeRecorrencia)
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
        <CampoDeValor valor={valorTexto} aoMudar={setValorTexto} placeholder="0,00" />
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
      {temOpcoesExtras && (
        <div className="opcoes-extras">
          {ehReembolso && (
            <div className="opcao-extra">
              <span className="titulo-da-opcao">Reembolso de uma despesa</span>
              <div className="campos-da-opcao">
                <div className="campo campo-da-despesa-reembolsada">
                  <span className="rotulo-do-campo">Despesa reembolsada</span>
                  <CampoDeEscolhaComBusca
                    valor={despesaReembolsadaId}
                    opcoes={despesasReembolsaveis.map(({ despesa, reembolsavelCentavos }) => ({
                      valor: String(despesa.id),
                      rotulo: `${despesa.descricao} · ${formatarDataIsoComoBrasileira(despesa.data)} · falta devolver ${formatarCentavosComoReal(reembolsavelCentavos)}`
                    }))}
                    aoEscolher={escolherDespesaReembolsada}
                    placeholder="Busque pela descrição da despesa"
                    rotuloDeAcessibilidade="Despesa reembolsada"
                  />
                </div>
                <p className="dica-da-opcao">
                  {despesaEscolhida
                    ? `Pode devolver até ${formatarCentavosComoReal(despesaEscolhida.reembolsavelCentavos)}. Para devolução parcial, digite um valor menor.`
                    : 'O reembolso abate a despesa escolhida, no todo ou em parte, e fica datado neste dia.'}
                </p>
              </div>
            </div>
          )}
          {podeUsarCartao && (
            <OpcaoDeCartao
              cartoes={cartoes}
              ehDeCartao={ehDeCartao}
              aoMudarEhDeCartao={setEhDeCartao}
              cartaoEscolhido={cartao}
              aoEscolherCartao={setCartaoEscolhido}
              textoDaCaixa="Esta despesa é de um cartão de crédito"
            >
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
              {parcelasDaCompra.length > 0 && (
                <p className="dica-da-opcao">
                  {parcelasDaCompra.length}× de{' '}
                  {formatarCentavosComoReal(parcelasDaCompra[0].lancamento.valorCentavos)} · a
                  primeira parcela vence em{' '}
                  {formatarDataIsoComoBrasileira(parcelasDaCompra[0].lancamento.data)}
                  {parcelasDaCompra.length > 1 &&
                    ` e a última em ${formatarDataIsoComoBrasileira(parcelasDaCompra[parcelasDaCompra.length - 1].lancamento.data)}`}
                </p>
              )}
            </OpcaoDeCartao>
          )}
          {mostrarRecorrente && (
            <div className="opcao-extra">
              <label className="caixa-de-selecao">
                <input
                  type="checkbox"
                  checked={recorrente}
                  onChange={(e) => setRecorrente(e.target.checked)}
                />
                Este lançamento se repete todo mês
              </label>
              {(recorrente || recorrenteInicial) && (
                <div className="campos-da-opcao">
                  {recorrente && (
                    <div className="campo">
                      <span className="rotulo-do-campo">Repete até</span>
                      <CampoDeMes
                        valor={mesDeFim}
                        aoMudar={setMesDeFim}
                        rotuloDeAcessibilidade="Repete até"
                        textoQuandoVazio="Até eu parar"
                        podeLimpar
                      />
                    </div>
                  )}
                  <p className="dica-da-opcao">
                    {descreverEfeitoDaRecorrencia(recorrente, recorrenteInicial)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div className="acoes-formulario">
        <button type="submit">{lancamentoEmEdicao ? 'Salvar' : 'Adicionar'}</button>
        {lancamentoEmEdicao && (
          <button type="button" className="secundario" onClick={aoCancelarEdicao}>
            Cancelar
          </button>
        )}
      </div>
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
