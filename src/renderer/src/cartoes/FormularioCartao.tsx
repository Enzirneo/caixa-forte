import { useState, type FormEvent } from 'react'
import { converterTextoEmCentavos } from '../../../shared/dinheiro/converterTextoEmCentavos'
import { formatarCentavosParaCampo } from '../../../shared/dinheiro/formatarCentavosParaCampo'
import { obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import {
  calcularFaturaAberta,
  derivarRegraDoCiclo,
  validarDatasDoCiclo,
  type ModoDeFechamento
} from '../../../shared/cartoes/cicloDaFatura'
import { validarNovoCartao } from '../../../shared/cartoes/regras'
import type { Cartao, NovoCartao } from '../../../shared/cartoes/tipos'
import { CampoDeData } from '../componentes/CampoDeData'
import { Selecao } from '../componentes/Selecao'

const OPCOES_DE_MODO = [
  { valor: 'dias-antes-do-vencimento', rotulo: 'Fecha X dias antes do vencimento' },
  { valor: 'dia-fixo', rotulo: 'Fecha sempre no mesmo dia' }
]

interface Props {
  cartaoEmEdicao: Cartao | null
  aoSalvar: (novoCartao: NovoCartao) => Promise<void>
  aoCancelarEdicao: () => void
}

export function FormularioCartao({
  cartaoEmEdicao,
  aoSalvar,
  aoCancelarEdicao
}: Props): React.JSX.Element {
  const faturaAberta = cartaoEmEdicao
    ? calcularFaturaAberta(obterDataIsoDeHoje(), cartaoEmEdicao)
    : null

  const [nome, setNome] = useState(cartaoEmEdicao?.nome ?? '')
  const [vencimento, setVencimento] = useState(faturaAberta?.vencimento ?? '')
  const [melhorDataDeCompra, setMelhorDataDeCompra] = useState(
    faturaAberta?.melhorDataDeCompra ?? ''
  )
  const [modo, setModo] = useState<ModoDeFechamento>(
    cartaoEmEdicao?.diasAntesDoVencimento === null ? 'dia-fixo' : 'dias-antes-do-vencimento'
  )
  const [limiteTexto, setLimiteTexto] = useState(
    cartaoEmEdicao?.limiteCentavos ? formatarCentavosParaCampo(cartaoEmEdicao.limiteCentavos) : ''
  )
  const [erros, setErros] = useState<string[]>([])

  const limparCampos = (): void => {
    setNome('')
    setVencimento('')
    setMelhorDataDeCompra('')
    setLimiteTexto('')
  }

  const enviar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault()
    const informouLimite = limiteTexto.trim() !== ''
    const limiteCentavos = informouLimite ? converterTextoEmCentavos(limiteTexto) : null
    if (informouLimite && limiteCentavos === null) {
      setErros(['O limite deve ser um valor, como 5000,00.'])
      return
    }

    const datas = { vencimento, melhorDataDeCompra, modo }
    const errosDasDatas = validarDatasDoCiclo(datas)
    if (errosDasDatas.length > 0) {
      setErros(errosDasDatas)
      return
    }

    const novoCartao: NovoCartao = { nome, ...derivarRegraDoCiclo(datas), limiteCentavos }
    const errosEncontrados = validarNovoCartao(novoCartao)
    setErros(errosEncontrados)
    if (errosEncontrados.length > 0) return

    await aoSalvar(novoCartao)
    limparCampos()
  }

  return (
    <form
      className={
        cartaoEmEdicao ? 'formulario formulario-cartao em-edicao' : 'formulario formulario-cartao'
      }
      onSubmit={enviar}
    >
      <label>
        Nome do cartão
        <input
          placeholder="Ex.: Nubank, Itaú Platinum"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </label>
      <div className="campo">
        <span className="rotulo-do-campo">Vencimento da fatura aberta</span>
        <CampoDeData
          valor={vencimento}
          aoMudar={setVencimento}
          rotuloDeAcessibilidade="Vencimento da fatura aberta"
        />
      </div>
      <div className="campo">
        <span className="rotulo-do-campo">Melhor data de compra</span>
        <CampoDeData
          valor={melhorDataDeCompra}
          aoMudar={setMelhorDataDeCompra}
          rotuloDeAcessibilidade="Melhor data de compra"
        />
      </div>
      <div className="campo">
        <span className="rotulo-do-campo">Como o cartão fecha</span>
        <Selecao
          valor={modo}
          opcoes={OPCOES_DE_MODO}
          aoMudar={(valor) => setModo(valor as ModoDeFechamento)}
          rotuloDeAcessibilidade="Como o cartão fecha"
        />
      </div>
      <label>
        Limite (R$)
        <input
          inputMode="decimal"
          placeholder="Opcional"
          value={limiteTexto}
          onChange={(e) => setLimiteTexto(e.target.value)}
        />
      </label>
      <p className="dica-de-importacao">
        Copie da fatura aberta no app do banco: o vencimento e a melhor data de compra. O app
        calcula sozinho as faturas dos outros meses.
      </p>
      <div className="acoes-formulario">
        <button type="submit">{cartaoEmEdicao ? 'Salvar' : 'Cadastrar cartão'}</button>
        {cartaoEmEdicao && (
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
