import { resumirComprasParceladas } from '../../../shared/cartoes/faturas'
import type { Cartao, VinculoDeCompra } from '../../../shared/cartoes/tipos'
import { formatarDataIsoComoBrasileira, obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import type { Lancamento } from '../../../shared/lancamentos/tipos'

interface Props {
  lancamentos: Lancamento[]
  vinculos: VinculoDeCompra[]
  cartoes: Cartao[]
}

// As parcelas também são cobranças que se repetem todo mês, só que com fim marcado.
export function ListaDeComprasParceladas({
  lancamentos,
  vinculos,
  cartoes
}: Props): React.JSX.Element | null {
  const compras = resumirComprasParceladas(lancamentos, vinculos, cartoes, obterDataIsoDeHoje())
  if (compras.length === 0) return null

  return (
    <>
      <h3 className="titulo-da-secao">Compras parceladas no cartão</h3>
      <p className="vazio-pequeno">
        Elas são lançadas na aba Lançamentos, marcando que a despesa é de um cartão, e o app
        acompanha as parcelas até acabarem.
      </p>
      <table className="lista">
        <thead>
          <tr>
            <th>Compra</th>
            <th>Cartão</th>
            <th>Parcelas</th>
            <th className="numero">Valor da parcela</th>
            <th>Próxima</th>
            <th className="numero">Falta pagar</th>
          </tr>
        </thead>
        <tbody>
          {compras.map((compra) => (
            <tr key={compra.grupoId}>
              <td>{compra.descricao}</td>
              <td>{compra.cartaoNome}</td>
              <td>
                {compra.parcelasPagas} de {compra.parcelasTotal} pagas
              </td>
              <td className="numero">{formatarCentavosComoReal(compra.valorDaParcelaCentavos)}</td>
              <td>
                {compra.proximoVencimento
                  ? formatarDataIsoComoBrasileira(compra.proximoVencimento)
                  : '—'}
              </td>
              <td className="numero despesa">
                {formatarCentavosComoReal(compra.restanteCentavos)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
