import {
  calcularMesDoVencimentoDaFatura,
  indexarAjustesDoCartao
} from '../../../shared/cartoes/cicloDaFatura'
import type { AjusteDeFechamento, Cartao } from '../../../shared/cartoes/tipos'
import { formatarDataIsoComoBrasileira, obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { formatarMesPorExtenso } from '../../../shared/datas/mes'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import { calcularProximaOcorrencia } from '../../../shared/recorrencias/regras'
import type { Recorrencia } from '../../../shared/recorrencias/tipos'

interface Props {
  cartao: Cartao
  recorrencias: Recorrencia[]
  ajustes: AjusteDeFechamento[]
}

// Cobranças que ainda vão acontecer: as que já aconteceram aparecem em Compras e nas faturas.
export function RecorrenciasDoCartao({
  cartao,
  recorrencias,
  ajustes
}: Props): React.JSX.Element | null {
  if (recorrencias.length === 0) return null

  const hoje = obterDataIsoDeHoje()
  const ajustesDoCartao = indexarAjustesDoCartao(ajustes, cartao.id)

  return (
    <>
      <h3 className="titulo-da-secao">Cobranças recorrentes</h3>
      <table className="lista">
        <thead>
          <tr>
            <th>Cobrança</th>
            <th>Todo dia</th>
            <th>Próxima</th>
            <th>Cai na fatura de</th>
            <th className="numero">Valor</th>
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
                </td>
                <td>{recorrencia.diaDoMes}</td>
                <td>{proxima ? formatarDataIsoComoBrasileira(proxima) : '—'}</td>
                <td>
                  {proxima
                    ? formatarMesPorExtenso(
                        calcularMesDoVencimentoDaFatura(proxima, cartao, ajustesDoCartao)
                      )
                    : '—'}
                </td>
                <td className="numero despesa">
                  {formatarCentavosComoReal(recorrencia.valorCentavos)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
