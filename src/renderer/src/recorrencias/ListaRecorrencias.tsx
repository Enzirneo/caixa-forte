import { formatarDataIsoComoBrasileira, obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { formatarMesAbreviado } from '../../../shared/datas/mes'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import { calcularProximaOcorrencia } from '../../../shared/recorrencias/regras'
import type { Cartao } from '../../../shared/cartoes/tipos'
import type { Recorrencia } from '../../../shared/recorrencias/tipos'
import { BotaoExcluirComConfirmacao } from '../compartilhado/BotaoExcluirComConfirmacao'

interface Props {
  recorrencias: Recorrencia[]
  cartoes: Cartao[]
  aoEditar: (recorrencia: Recorrencia) => void
  aoDefinirAtiva: (id: number, ativa: boolean) => Promise<void>
  aoExcluir: (id: number) => Promise<void>
}

function descreverPeriodo(recorrencia: Recorrencia): string {
  const inicio = formatarMesAbreviado(recorrencia.mesDeInicio)
  return recorrencia.mesDeFim === null
    ? `desde ${inicio}`
    : `${inicio} até ${formatarMesAbreviado(recorrencia.mesDeFim)}`
}

export function ListaRecorrencias({
  recorrencias,
  cartoes,
  aoEditar,
  aoDefinirAtiva,
  aoExcluir
}: Props): React.JSX.Element {
  if (recorrencias.length === 0) {
    return (
      <p className="vazio">
        Nenhuma recorrência ainda. Cadastre o aluguel, uma assinatura ou o salário, e ele passa a
        ser lançado sozinho todo mês.
      </p>
    )
  }

  const hoje = obterDataIsoDeHoje()
  const nomePorCartao = new Map(cartoes.map((cartao) => [cartao.id, cartao.nome]))

  return (
    <table className="lista">
      <thead>
        <tr>
          <th>Descrição</th>
          <th>Categoria</th>
          <th className="numero">Valor</th>
          <th>Todo dia</th>
          <th>Período</th>
          <th>Próximo</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {recorrencias.map((recorrencia) => {
          const proxima = recorrencia.ativa ? calcularProximaOcorrencia(recorrencia, hoje) : null
          return (
            <tr key={recorrencia.id} className={recorrencia.ativa ? undefined : 'linha-pausada'}>
              <td>
                {recorrencia.descricao}
                {!recorrencia.ativa && <span className="ressalva"> · pausada</span>}
                {recorrencia.cartaoId != null && (
                  <span className="rotulo-de-compra">
                    {nomePorCartao.get(recorrencia.cartaoId) ?? 'Cartão'}
                  </span>
                )}
              </td>
              <td>{recorrencia.categoria}</td>
              <td className={`numero ${recorrencia.tipo}`}>
                {recorrencia.tipo === 'receita' ? '+ ' : ''}
                {formatarCentavosComoReal(recorrencia.valorCentavos)}
              </td>
              <td>{recorrencia.diaDoMes}</td>
              <td>{descreverPeriodo(recorrencia)}</td>
              <td>{proxima ? formatarDataIsoComoBrasileira(proxima) : '—'}</td>
              <td className="acoes-linha">
                <button className="secundario" onClick={() => aoEditar(recorrencia)}>
                  Editar
                </button>
                <button
                  className="secundario"
                  onClick={() => aoDefinirAtiva(recorrencia.id, !recorrencia.ativa)}
                >
                  {recorrencia.ativa ? 'Pausar' : 'Retomar'}
                </button>
                <BotaoExcluirComConfirmacao aoConfirmar={() => aoExcluir(recorrencia.id)} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
