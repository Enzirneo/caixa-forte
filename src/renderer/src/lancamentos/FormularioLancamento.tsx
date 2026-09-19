import { useState, type FormEvent } from 'react'
import { obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { converterTextoEmCentavos } from '../../../shared/dinheiro/converterTextoEmCentavos'
import {
  TIPOS_LANCAMENTO,
  type NovoLancamento,
  type TipoLancamento
} from '../../../shared/lancamentos/tipos'
import { validarNovoLancamento } from '../../../shared/lancamentos/validarNovoLancamento'

const ROTULO_DO_TIPO: Record<TipoLancamento, string> = {
  receita: 'Receita',
  despesa: 'Despesa'
}

interface Props {
  aoCriar: (novoLancamento: NovoLancamento) => Promise<void>
}

export function FormularioLancamento({ aoCriar }: Props): React.JSX.Element {
  const [descricao, setDescricao] = useState('')
  const [valorTexto, setValorTexto] = useState('')
  const [data, setData] = useState(obterDataIsoDeHoje())
  const [tipo, setTipo] = useState<TipoLancamento>('despesa')
  const [categoria, setCategoria] = useState('')
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

    await aoCriar(novoLancamento)
    limparCamposDigitados()
  }

  return (
    <form className="formulario" onSubmit={enviar}>
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
        <input value={categoria} onChange={(e) => setCategoria(e.target.value)} />
      </label>
      <button type="submit">Adicionar</button>
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
