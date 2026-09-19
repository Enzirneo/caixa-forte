import { useState, type FormEvent } from 'react'
import { obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { converterTextoEmCentavos } from '../../../shared/dinheiro/converterTextoEmCentavos'
import {
  TIPOS_MOVIMENTACAO,
  type Destino,
  type Movimentacao,
  type NovaMovimentacao,
  type TipoMovimentacao
} from '../../../shared/investimentos/tipos'
import { validarNovaMovimentacao } from '../../../shared/investimentos/validacoes'
import { ROTULO_DO_TIPO_DE_MOVIMENTACAO } from './rotulos'
import { CampoDeData } from '../componentes/CampoDeData'
import { Selecao } from '../componentes/Selecao'

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

  const destino = destinos.find((candidato) => candidato.id === destinoEscolhido) ?? destinos[0]
  const destinoId = destino.id

  const enviar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault()
    const novaMovimentacao: NovaMovimentacao = {
      destinoId,
      tipo,
      valorCentavos: converterTextoEmCentavos(valorTexto) ?? 0,
      data
    }

    const errosEncontrados = validarNovaMovimentacao(novaMovimentacao, destino, movimentacoes)
    setErros(errosEncontrados)
    if (errosEncontrados.length > 0) return

    await aoCriar(novaMovimentacao)
    setValorTexto('')
  }

  return (
    <form className="formulario formulario-movimentacao" onSubmit={enviar}>
      <div className="campo">
        <span className="rotulo-do-campo">Destino</span>
        <Selecao
          valor={String(destinoId)}
          opcoes={destinos.map((opcao) => ({ valor: String(opcao.id), rotulo: opcao.nome }))}
          aoMudar={(valor) => setDestinoEscolhido(Number(valor))}
          rotuloDeAcessibilidade="Destino"
        />
      </div>
      <div className="campo">
        <span className="rotulo-do-campo">Operação</span>
        <Selecao
          valor={tipo}
          opcoes={TIPOS_MOVIMENTACAO.map((opcao) => ({
            valor: opcao,
            rotulo: ROTULO_DO_TIPO_DE_MOVIMENTACAO[opcao]
          }))}
          aoMudar={(valor) => setTipo(valor as TipoMovimentacao)}
          rotuloDeAcessibilidade="Operação"
        />
      </div>
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
