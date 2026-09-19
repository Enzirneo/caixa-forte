import { useState, type FormEvent } from 'react'
import { converterTextoEmCentavos } from '../../../shared/dinheiro/converterTextoEmCentavos'
import { formatarCentavosParaCampo } from '../../../shared/dinheiro/formatarCentavosParaCampo'
import { validarNovoCartao } from '../../../shared/cartoes/regras'
import type { Cartao, NovoCartao } from '../../../shared/cartoes/tipos'

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
  const [nome, setNome] = useState(cartaoEmEdicao?.nome ?? '')
  const [fechamentoTexto, setFechamentoTexto] = useState(
    cartaoEmEdicao ? String(cartaoEmEdicao.diaDeFechamento) : ''
  )
  const [vencimentoTexto, setVencimentoTexto] = useState(
    cartaoEmEdicao ? String(cartaoEmEdicao.diaDeVencimento) : ''
  )
  const [limiteTexto, setLimiteTexto] = useState(
    cartaoEmEdicao?.limiteCentavos ? formatarCentavosParaCampo(cartaoEmEdicao.limiteCentavos) : ''
  )
  const [erros, setErros] = useState<string[]>([])

  const enviar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault()
    const informouLimite = limiteTexto.trim() !== ''
    const limiteCentavos = informouLimite ? converterTextoEmCentavos(limiteTexto) : null
    if (informouLimite && limiteCentavos === null) {
      setErros(['O limite deve ser um valor, como 5000,00.'])
      return
    }

    const novoCartao: NovoCartao = {
      nome,
      diaDeFechamento: Number(fechamentoTexto),
      diaDeVencimento: Number(vencimentoTexto),
      limiteCentavos
    }
    const errosEncontrados = validarNovoCartao(novoCartao)
    setErros(errosEncontrados)
    if (errosEncontrados.length > 0) return

    await aoSalvar(novoCartao)
    setNome('')
    setFechamentoTexto('')
    setVencimentoTexto('')
    setLimiteTexto('')
  }

  return (
    <form className="formulario formulario-cartao" onSubmit={enviar}>
      <label>
        Nome do cartão
        <input
          placeholder="Ex.: Nubank, Itaú Platinum"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </label>
      <label>
        Fecha no dia
        <input
          type="number"
          min={1}
          max={31}
          value={fechamentoTexto}
          onChange={(e) => setFechamentoTexto(e.target.value)}
        />
      </label>
      <label>
        Vence no dia
        <input
          type="number"
          min={1}
          max={31}
          value={vencimentoTexto}
          onChange={(e) => setVencimentoTexto(e.target.value)}
        />
      </label>
      <label>
        Limite (R$)
        <input
          inputMode="decimal"
          placeholder="Opcional"
          value={limiteTexto}
          onChange={(e) => setLimiteTexto(e.target.value)}
        />
      </label>
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
