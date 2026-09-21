import { useState, type FormEvent } from 'react'
import { obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { obterMesDaData } from '../../../shared/datas/mes'
import { converterTextoEmCentavos } from '../../../shared/dinheiro/converterTextoEmCentavos'
import { formatarCentavosParaCampo } from '../../../shared/dinheiro/formatarCentavosParaCampo'
import { TIPOS_DE_RECORRENCIA, type TipoDeRecorrencia } from '../../../shared/lancamentos/tipos'
import type { Cartao } from '../../../shared/cartoes/tipos'
import { validarNovaRecorrencia } from '../../../shared/recorrencias/regras'
import type { NovaRecorrencia, Recorrencia } from '../../../shared/recorrencias/tipos'
import { CampoDeCategoria } from '../componentes/CampoDeCategoria'
import { CampoDeMes } from '../componentes/CampoDeMes'
import { Selecao } from '../componentes/Selecao'
import { CampoDeValor } from '../componentes/CampoDeValor'
import { CaixaDeSelecao } from '../componentes/CaixaDeSelecao'
import { CamposDoCartao } from '../componentes/CamposDoCartao'

const ROTULO_DO_TIPO: Record<TipoDeRecorrencia, string> = { receita: 'Receita', despesa: 'Despesa' }
const DIA_PADRAO_DO_MES = '5'

interface Props {
  recorrenciaEmEdicao: Recorrencia | null
  cartoes: Cartao[]
  categoriasSugeridas: string[]
  aoSalvar: (novaRecorrencia: NovaRecorrencia) => Promise<void>
  aoCancelarEdicao: () => void
}

export function FormularioRecorrencia({
  recorrenciaEmEdicao,
  cartoes,
  categoriasSugeridas,
  aoSalvar,
  aoCancelarEdicao
}: Props): React.JSX.Element {
  const [descricao, setDescricao] = useState(recorrenciaEmEdicao?.descricao ?? '')
  const [valorTexto, setValorTexto] = useState(
    recorrenciaEmEdicao ? formatarCentavosParaCampo(recorrenciaEmEdicao.valorCentavos) : ''
  )
  const [tipo, setTipo] = useState<TipoDeRecorrencia>(recorrenciaEmEdicao?.tipo ?? 'despesa')
  const [categoria, setCategoria] = useState(recorrenciaEmEdicao?.categoria ?? '')
  const [diaTexto, setDiaTexto] = useState(
    recorrenciaEmEdicao ? String(recorrenciaEmEdicao.diaDoMes) : DIA_PADRAO_DO_MES
  )
  const [mesDeInicio, setMesDeInicio] = useState(
    recorrenciaEmEdicao?.mesDeInicio ?? obterMesDaData(obterDataIsoDeHoje())
  )
  const [mesDeFim, setMesDeFim] = useState(recorrenciaEmEdicao?.mesDeFim ?? '')
  const [ehDeCartao, setEhDeCartao] = useState(recorrenciaEmEdicao?.cartaoId != null)
  const [cartaoEscolhidoId, setCartaoEscolhidoId] = useState(
    recorrenciaEmEdicao?.cartaoId != null ? String(recorrenciaEmEdicao.cartaoId) : ''
  )
  const [erros, setErros] = useState<string[]>([])

  const podeUsarCartao = tipo === 'despesa' && cartoes.length > 0
  const cartao =
    podeUsarCartao && ehDeCartao
      ? (cartoes.find((candidato) => String(candidato.id) === cartaoEscolhidoId) ?? cartoes[0])
      : undefined

  const enviar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault()
    const novaRecorrencia: NovaRecorrencia = {
      descricao,
      valorCentavos: converterTextoEmCentavos(valorTexto) ?? 0,
      tipo,
      categoria,
      diaDoMes: Number(diaTexto),
      mesDeInicio,
      mesDeFim: mesDeFim === '' ? null : mesDeFim,
      cartaoId: cartao?.id ?? null
    }

    const errosEncontrados = validarNovaRecorrencia(novaRecorrencia)
    setErros(errosEncontrados)
    if (errosEncontrados.length > 0) return

    await aoSalvar(novaRecorrencia)
    setDescricao('')
    setValorTexto('')
    setCategoria('')
    setMesDeFim('')
  }

  return (
    <form
      className={
        recorrenciaEmEdicao
          ? 'formulario formulario-recorrencia em-edicao'
          : 'formulario formulario-recorrencia'
      }
      onSubmit={enviar}
    >
      <div className="linha-em-colunas">
        <label>
          Descrição
          <input
            placeholder="Ex.: Aluguel, Netflix, Salário"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </label>
        <label>
          Valor (R$)
          <CampoDeValor valor={valorTexto} aoMudar={setValorTexto} placeholder="0,00" />
        </label>
        <div className="campo">
          <span className="rotulo-do-campo">Tipo</span>
          <Selecao
            valor={tipo}
            opcoes={TIPOS_DE_RECORRENCIA.map((opcao) => ({
              valor: opcao,
              rotulo: ROTULO_DO_TIPO[opcao]
            }))}
            aoMudar={(valor) => setTipo(valor as TipoDeRecorrencia)}
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
        <label>
          Todo dia
          <input
            type="number"
            min={1}
            max={31}
            value={diaTexto}
            onChange={(e) => setDiaTexto(e.target.value)}
          />
        </label>
      </div>

      <div className="linha-em-colunas">
        <div className="campo">
          <span className="rotulo-do-campo">Começa em</span>
          <CampoDeMes
            valor={mesDeInicio}
            aoMudar={setMesDeInicio}
            rotuloDeAcessibilidade="Começa em"
          />
        </div>
        <div className="campo">
          <span className="rotulo-do-campo">Termina em (opcional)</span>
          <CampoDeMes
            valor={mesDeFim}
            aoMudar={setMesDeFim}
            rotuloDeAcessibilidade="Termina em"
            textoQuandoVazio="Sem término"
            podeLimpar
          />
        </div>
        {cartao && (
          <CamposDoCartao
            cartoes={cartoes}
            cartaoEscolhido={cartao}
            aoEscolherCartao={setCartaoEscolhidoId}
          />
        )}
        <div className="acoes-formulario">
          <button type="submit">{recorrenciaEmEdicao ? 'Salvar' : 'Adicionar'}</button>
          {recorrenciaEmEdicao && (
            <button type="button" className="secundario" onClick={aoCancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      {podeUsarCartao && (
        <div className="linha-de-caixas">
          <CaixaDeSelecao
            marcada={ehDeCartao}
            aoMudar={setEhDeCartao}
            texto="Esta cobrança é de um cartão de crédito"
          />
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
