import { useState, type FormEvent } from 'react'
import { obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { obterMesDaData } from '../../../shared/datas/mes'
import { converterTextoEmCentavos } from '../../../shared/dinheiro/converterTextoEmCentavos'
import { formatarCentavosParaCampo } from '../../../shared/dinheiro/formatarCentavosParaCampo'
import { TIPOS_LANCAMENTO, type TipoLancamento } from '../../../shared/lancamentos/tipos'
import { validarNovaRecorrencia } from '../../../shared/recorrencias/regras'
import type { NovaRecorrencia, Recorrencia } from '../../../shared/recorrencias/tipos'

const ROTULO_DO_TIPO: Record<TipoLancamento, string> = { receita: 'Receita', despesa: 'Despesa' }
const ID_DAS_CATEGORIAS_DA_RECORRENCIA = 'categorias-da-recorrencia'
const DIA_PADRAO_DO_MES = '5'

interface Props {
  recorrenciaEmEdicao: Recorrencia | null
  categoriasSugeridas: string[]
  aoSalvar: (novaRecorrencia: NovaRecorrencia) => Promise<void>
  aoCancelarEdicao: () => void
}

export function FormularioRecorrencia({
  recorrenciaEmEdicao,
  categoriasSugeridas,
  aoSalvar,
  aoCancelarEdicao
}: Props): React.JSX.Element {
  const [descricao, setDescricao] = useState(recorrenciaEmEdicao?.descricao ?? '')
  const [valorTexto, setValorTexto] = useState(
    recorrenciaEmEdicao ? formatarCentavosParaCampo(recorrenciaEmEdicao.valorCentavos) : ''
  )
  const [tipo, setTipo] = useState<TipoLancamento>(recorrenciaEmEdicao?.tipo ?? 'despesa')
  const [categoria, setCategoria] = useState(recorrenciaEmEdicao?.categoria ?? '')
  const [diaTexto, setDiaTexto] = useState(
    recorrenciaEmEdicao ? String(recorrenciaEmEdicao.diaDoMes) : DIA_PADRAO_DO_MES
  )
  const [mesDeInicio, setMesDeInicio] = useState(
    recorrenciaEmEdicao?.mesDeInicio ?? obterMesDaData(obterDataIsoDeHoje())
  )
  const [mesDeFim, setMesDeFim] = useState(recorrenciaEmEdicao?.mesDeFim ?? '')
  const [erros, setErros] = useState<string[]>([])

  const enviar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault()
    const novaRecorrencia: NovaRecorrencia = {
      descricao,
      valorCentavos: converterTextoEmCentavos(valorTexto) ?? 0,
      tipo,
      categoria,
      diaDoMes: Number(diaTexto),
      mesDeInicio,
      mesDeFim: mesDeFim === '' ? null : mesDeFim
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
    <form className="formulario formulario-recorrencia" onSubmit={enviar}>
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
        <input
          inputMode="decimal"
          placeholder="0,00"
          value={valorTexto}
          onChange={(e) => setValorTexto(e.target.value)}
        />
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
          list={ID_DAS_CATEGORIAS_DA_RECORRENCIA}
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        />
        <datalist id={ID_DAS_CATEGORIAS_DA_RECORRENCIA}>
          {categoriasSugeridas.map((nome) => (
            <option key={nome} value={nome} />
          ))}
        </datalist>
      </label>
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
      <label>
        Começa em
        <input type="month" value={mesDeInicio} onChange={(e) => setMesDeInicio(e.target.value)} />
      </label>
      <label>
        Termina em (opcional)
        <input type="month" value={mesDeFim} onChange={(e) => setMesDeFim(e.target.value)} />
      </label>
      <div className="acoes-formulario">
        <button type="submit">{recorrenciaEmEdicao ? 'Salvar' : 'Adicionar'}</button>
        {recorrenciaEmEdicao && (
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
