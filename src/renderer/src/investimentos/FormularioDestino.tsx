import { useState, type FormEvent } from 'react'
import {
  PERIODICIDADES_DA_TAXA,
  TIPOS_DESTINO,
  type NovoDestino,
  type PeriodicidadeDaTaxa,
  type TipoDestino
} from '../../../shared/investimentos/tipos'
import { converterTextoEmCentesimosDePercentual } from '../../../shared/investimentos/taxa'
import { validarNovoDestino } from '../../../shared/investimentos/validacoes'
import { ROTULO_DO_TIPO_DE_DESTINO } from './rotulos'

const ROTULO_DA_PERIODICIDADE: Record<PeriodicidadeDaTaxa, string> = {
  mensal: 'ao mês',
  anual: 'ao ano'
}

interface Props {
  aoCriar: (novoDestino: NovoDestino) => Promise<void>
}

export function FormularioDestino({ aoCriar }: Props): React.JSX.Element {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoDestino>('caixinha')
  const [taxaTexto, setTaxaTexto] = useState('')
  const [periodicidade, setPeriodicidade] = useState<PeriodicidadeDaTaxa>('mensal')
  const [erros, setErros] = useState<string[]>([])

  const enviar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault()
    const informouTaxa = taxaTexto.trim() !== ''
    const taxaEmCentesimos = informouTaxa ? converterTextoEmCentesimosDePercentual(taxaTexto) : null
    if (informouTaxa && taxaEmCentesimos === null) {
      setErros(['A taxa deve ser um número, como 1,05.'])
      return
    }

    const novoDestino: NovoDestino = {
      nome,
      tipo,
      taxaRendimentoCentesimos: taxaEmCentesimos,
      periodicidadeDaTaxa: informouTaxa ? periodicidade : null
    }
    const errosEncontrados = validarNovoDestino(novoDestino)
    setErros(errosEncontrados)
    if (errosEncontrados.length > 0) return

    await aoCriar(novoDestino)
    setNome('')
    setTaxaTexto('')
  }

  return (
    <form className="formulario formulario-destino" onSubmit={enviar}>
      <label>
        Nome do destino
        <input
          placeholder="Ex.: CDB Banco X, Caixinha Nubank"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </label>
      <label>
        Tipo
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoDestino)}>
          {TIPOS_DESTINO.map((opcao) => (
            <option key={opcao} value={opcao}>
              {ROTULO_DO_TIPO_DE_DESTINO[opcao]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Rendimento (%)
        <input
          inputMode="decimal"
          placeholder="Opcional"
          value={taxaTexto}
          onChange={(e) => setTaxaTexto(e.target.value)}
        />
      </label>
      <label>
        Período da taxa
        <select
          value={periodicidade}
          onChange={(e) => setPeriodicidade(e.target.value as PeriodicidadeDaTaxa)}
        >
          {PERIODICIDADES_DA_TAXA.map((opcao) => (
            <option key={opcao} value={opcao}>
              {ROTULO_DA_PERIODICIDADE[opcao]}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">Cadastrar destino</button>
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
