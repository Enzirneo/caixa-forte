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

const ROTULO_DO_TIPO: Record<TipoLancamento, string> = {
  receita: 'Receita',
  despesa: 'Despesa'
}

const ID_DAS_CATEGORIAS_SUGERIDAS = 'categorias-sugeridas'

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
    <form className="formulario formulario-lancamento" onSubmit={enviar}>
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
      <label>
        Data
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </label>
      <label>
        Tipo
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoLancamento)}>
          {TIPOS_LANCAMENTO.map((opcao) => (
            <option key={opcao} value={opcao}>
              {ROTULO_DO_TIPO[opcao]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Categoria
        <input
          list={ID_DAS_CATEGORIAS_SUGERIDAS}
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        />
        <datalist id={ID_DAS_CATEGORIAS_SUGERIDAS}>
          {categoriasSugeridas.map((nome) => (
            <option key={nome} value={nome} />
          ))}
        </datalist>
      </label>
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
