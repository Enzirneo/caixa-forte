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
  TIPOS_DO_FORMULARIO,
  type Lancamento,
  type NovoLancamento,
  type TipoDoFormulario
} from '../../../shared/lancamentos/tipos'
import {
  CATEGORIA_REEMBOLSO,
  ehCategoriaDeReembolso,
  montarSugestoesDeCategoria
} from '../../../shared/categorias/categoriasPadrao'
import { formatarMesPorExtenso } from '../../../shared/datas/mes'
import { calcularMesDeInicioAPartirDoLancamento } from '../../../shared/recorrencias/regras'
import type { DefinicaoDeRecorrencia } from '../../../shared/recorrencias/tipos'
import {
  listarDespesasReembolsaveis,
  validarReembolso
} from '../../../shared/lancamentos/reembolsos'
import { validarNovoLancamento } from '../../../shared/lancamentos/validarNovoLancamento'
import { CampoDeMes } from '../componentes/CampoDeMes'
import { CampoDeEscolhaComBusca } from '../componentes/CampoDeEscolhaComBusca'
import { CaixaDeSelecao } from '../componentes/CaixaDeSelecao'
import { CamposDoCartao } from '../componentes/CamposDoCartao'
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

const ROTULO_DO_TIPO: Record<TipoDoFormulario, string> = {
  receita: 'Receita',
  despesa: 'Despesa'
}

const ERRO_REEMBOLSO_SO_NA_RECEITA = 'Reembolso é uma categoria só de receita.'

function obterTipoDoFormulario(lancamento: Lancamento | null): TipoDoFormulario {
  if (!lancamento) return 'despesa'
  return lancamento.tipo === 'despesa' ? 'despesa' : 'receita'
}

function obterCategoriaDoFormulario(lancamento: Lancamento | null): string {
  if (!lancamento) return ''
  return lancamento.tipo === 'reembolso' ? CATEGORIA_REEMBOLSO : lancamento.categoria
}

interface Props {
  lancamentoEmEdicao: Lancamento | null
  todosOsLancamentos: Lancamento[]
  podeSerRecorrente: boolean
  recorrenteInicial: boolean
  mesDeFimInicial: string
  mesMinimoDeTermino: string | null
  cartoes: Cartao[]
  ajustesDeFechamento: AjusteDeFechamento[]
  aoSalvar: (
    novoLancamento: NovoLancamento,
    definicaoDeRecorrencia?: DefinicaoDeRecorrencia
  ) => Promise<void>
  aoRegistrarNoCartao: (
    compra: NovaCompraNoCartao,
    definicaoDeRecorrencia?: DefinicaoDeRecorrencia
  ) => Promise<void>
  aoCancelarEdicao: () => void
}

export function FormularioLancamento({
  lancamentoEmEdicao,
  todosOsLancamentos,
  podeSerRecorrente,
  recorrenteInicial,
  mesDeFimInicial,
  mesMinimoDeTermino,
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
  const [tipo, setTipo] = useState<TipoDoFormulario>(obterTipoDoFormulario(lancamentoEmEdicao))
  const [categoria, setCategoria] = useState(obterCategoriaDoFormulario(lancamentoEmEdicao))
  const [despesaReembolsadaId, setDespesaReembolsadaId] = useState(
    lancamentoEmEdicao?.reembolsoDeId ? String(lancamentoEmEdicao.reembolsoDeId) : ''
  )
  const [recorrente, setRecorrente] = useState(recorrenteInicial)
  const [mesDeFim, setMesDeFim] = useState(mesDeFimInicial)
  const [ehDeCartao, setEhDeCartao] = useState(false)
  const [cartaoEscolhido, setCartaoEscolhido] = useState('')
  const [parcelasTexto, setParcelasTexto] = useState(PARCELAS_PADRAO)
  const [erros, setErros] = useState<string[]>([])

  const ehReembolso = tipo === 'receita' && ehCategoriaDeReembolso(categoria)
  const categoriasSugeridas = montarSugestoesDeCategoria(
    tipo,
    todosOsLancamentos,
    !recorrenteInicial
  )
  const mostrarRecorrente = podeSerRecorrente && !ehReembolso
  const mesMinimo =
    mesMinimoDeTermino ?? calcularMesDeInicioAPartirDoLancamento(data, obterDataIsoDeHoje())
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
    if (!valorTexto) setValorTexto(aplicarMascaraDeValor(String(escolhida.reembolsavelCentavos)))
    if (!descricao) setDescricao(`Reembolso: ${escolhida.despesa.descricao}`)
  }

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

  const mudarTipo = (novoTipo: TipoDoFormulario): void => {
    setTipo(novoTipo)
    if (novoTipo === 'despesa' && ehCategoriaDeReembolso(categoria)) setCategoria('')
  }

  const limparCamposDigitados = (): void => {
    setDescricao('')
    setValorTexto('')
    setCategoria('')
    setParcelasTexto(PARCELAS_PADRAO)
    setDespesaReembolsadaId('')
    setRecorrente(false)
    setMesDeFim('')
  }

  const validarTermino = (): string[] =>
    mostrarRecorrente && recorrente && mesDeFim !== '' && mesDeFim < mesMinimo
      ? [`O término não pode ser antes de ${formatarMesPorExtenso(mesMinimo)}.`]
      : []

  const registrarNoCartao = async (cartaoDaCompra: Cartao): Promise<void> => {
    const compra = montarCompra(cartaoDaCompra)
    const errosEncontrados = [
      ...validarNovaCompra(compra),
      ...validarTermino(),
      ...(recorrente && compra.parcelas > 1
        ? ['Uma compra parcelada não pode se repetir todo mês.']
        : [])
    ]
    setErros(errosEncontrados)
    if (errosEncontrados.length > 0) return

    await aoRegistrarNoCartao(compra, montarDefinicaoDeRecorrencia())
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

    // No banco o reembolso guarda a categoria da despesa devolvida, para abatê-la nos resumos.
    const novoLancamento: NovoLancamento = {
      descricao,
      valorCentavos: converterTextoEmCentavos(valorTexto) ?? 0,
      data,
      tipo: ehReembolso ? 'reembolso' : tipo,
      categoria: ehReembolso ? (despesaEscolhida?.despesa.categoria ?? categoria) : categoria,
      reembolsoDeId: ehReembolso && despesaReembolsadaId ? Number(despesaReembolsadaId) : null
    }

    const errosEncontrados = [
      ...(tipo === 'despesa' && ehCategoriaDeReembolso(categoria)
        ? [ERRO_REEMBOLSO_SO_NA_RECEITA]
        : []),
      ...validarNovoLancamento(novoLancamento),
      ...validarTermino(),
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

  const acoes = (
    <div className="acoes-formulario">
      <button type="submit">{lancamentoEmEdicao ? 'Salvar' : 'Adicionar'}</button>
      {lancamentoEmEdicao && (
        <button type="button" className="secundario" onClick={aoCancelarEdicao}>
          Cancelar
        </button>
      )}
    </div>
  )

  const camposDeRecorrencia = mostrarRecorrente && recorrente && (
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
  )

  // Só uma dica por linha, para não apertar: com cartão e repetição juntos, a prévia do cartão vence.
  const dicaDaLinhaExtra = cartao
    ? parcelasDaCompra.length > 0 &&
      `${parcelasDaCompra.length}× de ${formatarCentavosComoReal(parcelasDaCompra[0].lancamento.valorCentavos)} · a primeira parcela vence em ${formatarDataIsoComoBrasileira(parcelasDaCompra[0].lancamento.data)}${
        parcelasDaCompra.length > 1
          ? ` e a última em ${formatarDataIsoComoBrasileira(parcelasDaCompra[parcelasDaCompra.length - 1].lancamento.data)}`
          : ''
      }`
    : mostrarRecorrente
      ? descreverEfeitoDaRecorrencia(recorrente, recorrenteInicial)
      : ''

  // Os botões ficam sempre na última linha de campos, no canto de baixo à direita.
  // As caixinhas de opção ficam numa linha própria, abaixo de tudo.
  const mostrarLinhaExtra = ehReembolso || Boolean(cartao) || (mostrarRecorrente && recorrente)
  const temCaixas = podeUsarCartao || mostrarRecorrente
  // Editando são dois botões: sem linha extra, vão para a linha das caixinhas para não apertar os campos.
  const acoesNaLinhaDasCaixas = !mostrarLinhaExtra && Boolean(lancamentoEmEdicao) && temCaixas
  const acoesNaLinhaPrincipal = !mostrarLinhaExtra && !acoesNaLinhaDasCaixas

  return (
    <form
      className={
        lancamentoEmEdicao
          ? 'formulario formulario-lancamento em-edicao'
          : 'formulario formulario-lancamento'
      }
      onSubmit={enviar}
    >
      <div
        className={
          acoesNaLinhaPrincipal
            ? 'linha-em-colunas linha-do-lancamento com-acoes'
            : 'linha-em-colunas linha-do-lancamento'
        }
      >
        <label>
          Descrição
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </label>
        <label>
          Valor (R$)
          <CampoDeValor valor={valorTexto} aoMudar={setValorTexto} placeholder="0,00" />
        </label>
        <div className="campo">
          <span className="rotulo-do-campo">Data</span>
          <CampoDeData valor={data} aoMudar={setData} rotuloDeAcessibilidade="Data" />
        </div>
        <div className="campo">
          <span className="rotulo-do-campo">Tipo</span>
          <Selecao
            valor={tipo}
            opcoes={TIPOS_DO_FORMULARIO.map((opcao) => ({
              valor: opcao,
              rotulo: ROTULO_DO_TIPO[opcao]
            }))}
            aoMudar={(valor) => mudarTipo(valor as TipoDoFormulario)}
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
        {acoesNaLinhaPrincipal && acoes}
      </div>

      {mostrarLinhaExtra && (
        <div className="linha-em-colunas linha-do-lancamento linha-extra">
          {ehReembolso && (
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
          )}
          {cartao && (
            <CamposDoCartao
              cartoes={cartoes}
              cartaoEscolhido={cartao}
              aoEscolherCartao={setCartaoEscolhido}
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
            </CamposDoCartao>
          )}
          {camposDeRecorrencia}
          {dicaDaLinhaExtra && <p className="dica-da-opcao">{dicaDaLinhaExtra}</p>}
          {acoes}
          {ehReembolso && (
            <p className="dica-da-opcao dica-do-reembolso">
              {despesaEscolhida
                ? `Pode devolver até ${formatarCentavosComoReal(despesaEscolhida.reembolsavelCentavos)}. Para devolução parcial, digite um valor menor.`
                : 'O reembolso abate a despesa escolhida, no todo ou em parte, e fica datado neste dia.'}
            </p>
          )}
        </div>
      )}

      {temCaixas && (
        <div className="linha-de-caixas">
          {podeUsarCartao && (
            <CaixaDeSelecao
              marcada={ehDeCartao}
              aoMudar={setEhDeCartao}
              texto="Esta despesa é de um cartão de crédito"
            />
          )}
          {mostrarRecorrente && (
            <CaixaDeSelecao
              marcada={recorrente}
              aoMudar={setRecorrente}
              texto="Este lançamento se repete todo mês"
            />
          )}
          {mostrarRecorrente && !recorrente && recorrenteInicial && (
            <span className="dica-da-opcao">
              {descreverEfeitoDaRecorrencia(recorrente, recorrenteInicial)}
            </span>
          )}
          {acoesNaLinhaDasCaixas && acoes}
        </div>
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
