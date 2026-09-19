import { useState, type FormEvent } from 'react'
import { obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { converterTextoEmCentavos } from '../../../shared/dinheiro/converterTextoEmCentavos'
import { calcularSaldoDoDestino } from '../../../shared/investimentos/calculos'
import {
  TIPOS_MOVIMENTACAO,
  type Destino,
  type Movimentacao,
  type NovaMovimentacao,
  type TipoMovimentacao
} from '../../../shared/investimentos/tipos'
import { validarNovaMovimentacao } from '../../../shared/investimentos/validacoes'
import { ROTULO_DO_TIPO_DE_MOVIMENTACAO } from './rotulos'

interface Props {
  destinos: Destino[]
  movimentacoes: Movimentacao[]
  aoCriar: (novaMovimentacao: NovaMovimentacao) => Promise<void>
}

export function FormularioMovimentacao({
  destinos,
  movimentacoes,
  aoCriar
}: Props): React.JSX.Element {
  const [destinoEscolhido, setDestinoEscolhido] = useState<number | null>(null)
  const [tipo, setTipo] = useState<TipoMovimentacao>('aporte')
  const [valorTexto, setValorTexto] = useState('')
  const [data, setData] = useState(obterDataIsoDeHoje())
  const [erros, setErros] = useState<string[]>([])

  if (destinos.length === 0) {
    return <p className="vazio">Cadastre um destino para começar a guardar dinheiro.</p>
  }

  const destinoId = destinoEscolhido ?? destinos[0].id

  const enviar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault()
    const novaMovimentacao: NovaMovimentacao = {
      destinoId,
      tipo,
      valorCentavos: converterTextoEmCentavos(valorTexto) ?? 0,
      data
    }

    const errosEncontrados = validarNovaMovimentacao(
      novaMovimentacao,
      calcularSaldoDoDestino(movimentacoes, destinoId)
    )
    setErros(errosEncontrados)
    if (errosEncontrados.length > 0) return

    await aoCriar(novaMovimentacao)
    setValorTexto('')
  }

  return (
    <form className="formulario formulario-movimentacao" onSubmit={enviar}>
      <label>
        Destino
        <select value={destinoId} onChange={(e) => setDestinoEscolhido(Number(e.target.value))}>
          {destinos.map((destino) => (
            <option key={destino.id} value={destino.id}>
              {destino.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Operação
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoMovimentacao)}>
          {TIPOS_MOVIMENTACAO.map((opcao) => (
            <option key={opcao} value={opcao}>
              {ROTULO_DO_TIPO_DE_MOVIMENTACAO[opcao]}
            </option>
          ))}
        </select>
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
      <button type="submit">Registrar</button>
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
