import { useState, type FormEvent } from 'react'
import { obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { converterTextoEmCentavos } from '../../../shared/dinheiro/converterTextoEmCentavos'
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

const ROTULO_DO_TIPO: Record<TipoLancamento, string> = {
  receita: 'Receita',
  despesa: 'Despesa'
}

interface Props {
  lancamentoEmEdicao: Lancamento | null
  categoriasSugeridas: string[]
  aoSalvar: (novoLancamento: NovoLancamento) => Promise<void>
  aoCancelarEdicao: () => void
}

export function FormularioLancamento({
  lancamentoEmEdicao,
  categoriasSugeridas,
  aoSalvar,
  aoCancelarEdicao
}: Props): React.JSX.Element {
  const [descricao, setDescricao] = useState(lancamentoEmEdicao?.descricao ?? '')
  const [valorTexto, setValorTexto] = useState(
    lancamentoEmEdicao ? formatarCentavosParaCampo(lancamentoEmEdicao.valorCentavos) : ''
  )
  const [data, setData] = useState(lancamentoEmEdicao?.data ?? obterDataIsoDeHoje())
  const [tipo, setTipo] = useState<TipoLancamento>(lancamentoEmEdicao?.tipo ?? 'despesa')
  const [categoria, setCategoria] = useState(lancamentoEmEdicao?.categoria ?? '')
  const [erros, setErros] = useState<string[]>([])

  const limparCamposDigitados = (): void => {
    setDescricao('')
    setValorTexto('')
    setCategoria('')
  }

  const enviar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault()
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
      <div className="campo">
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
