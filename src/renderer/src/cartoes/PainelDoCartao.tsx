import { obterDataIsoDeHoje, formatarDataIsoComoBrasileira } from '../../../shared/datas/dataIso'
import { formatarMesPorExtenso, obterMesDaData } from '../../../shared/datas/mes'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import {
  agruparComprasPorGrupo,
  calcularComprometidoNoCartao,
  montarFaturas
} from '../../../shared/cartoes/faturas'
import type { Cartao, VinculoDeCompra } from '../../../shared/cartoes/tipos'
import type { Lancamento } from '../../../shared/lancamentos/tipos'
import { BotaoExcluirComConfirmacao } from '../compartilhado/BotaoExcluirComConfirmacao'

interface Props {
  cartao: Cartao
  lancamentos: Lancamento[]
  vinculos: VinculoDeCompra[]
  aoEditar: (cartao: Cartao) => void
  aoExcluirCartao: (id: number) => Promise<void>
  aoExcluirCompra: (grupoId: number) => Promise<void>
}

export function PainelDoCartao({
  cartao,
  lancamentos,
  vinculos,
  aoEditar,
  aoExcluirCartao,
  aoExcluirCompra
}: Props): React.JSX.Element {
  const hoje = obterDataIsoDeHoje()
  const mesAtual = obterMesDaData(hoje)
  const faturasAPartirDoMesAtual = montarFaturas(lancamentos, vinculos, cartao.id).filter(
    (fatura) => fatura.mes >= mesAtual
  )
  const compras = agruparComprasPorGrupo(
    lancamentos,
    vinculos.filter((vinculo) => vinculo.cartaoId === cartao.id)
  )
  const comprometido = calcularComprometidoNoCartao(lancamentos, vinculos, cartao.id, hoje)

  return (
    <section className="cartao-de-grafico painel-do-cartao">
      <header>
        <div>
          <h2>{cartao.nome}</h2>
          <span className="subtitulo-do-grafico">
            Fecha dia {cartao.diaDeFechamento} · vence dia {cartao.diaDeVencimento}
          </span>
        </div>
        <div className="acoes-de-dados">
          <button className="secundario" onClick={() => aoEditar(cartao)}>
            Editar
          </button>
          <BotaoExcluirComConfirmacao aoConfirmar={() => aoExcluirCartao(cartao.id)} />
        </div>
      </header>

      <div className="resumo-do-mes resumo-do-cartao">
        <div>
          <span>Comprometido nas próximas faturas</span>
          <strong className="despesa">{formatarCentavosComoReal(comprometido)}</strong>
        </div>
        {cartao.limiteCentavos !== null && (
          <>
            <div>
              <span>Limite</span>
              <strong>{formatarCentavosComoReal(cartao.limiteCentavos)}</strong>
            </div>
            <div>
              <span>Disponível</span>
              <strong className={cartao.limiteCentavos - comprometido < 0 ? 'despesa' : 'receita'}>
                {formatarCentavosComoReal(cartao.limiteCentavos - comprometido)}
              </strong>
            </div>
          </>
        )}
      </div>

      <h3 className="titulo-da-secao">Faturas</h3>
      {faturasAPartirDoMesAtual.length === 0 ? (
        <p className="vazio-pequeno">Nenhuma fatura a vencer.</p>
      ) : (
        <table className="lista">
          <thead>
            <tr>
              <th>Vencimento em</th>
              <th className="numero">Itens</th>
              <th className="numero">Total da fatura</th>
            </tr>
          </thead>
          <tbody>
            {faturasAPartirDoMesAtual.map((fatura) => (
              <tr key={fatura.mes}>
                <td>{formatarMesPorExtenso(fatura.mes)}</td>
                <td className="numero">{fatura.quantidadeDeItens}</td>
                <td className="numero despesa">{formatarCentavosComoReal(fatura.totalCentavos)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 className="titulo-da-secao">Compras</h3>
      {compras.length === 0 ? (
        <p className="vazio-pequeno">Nenhuma compra neste cartão.</p>
      ) : (
        <table className="lista">
          <thead>
            <tr>
              <th>Compra</th>
              <th>Feita em</th>
              <th className="numero">Parcelas</th>
              <th>Vencimentos</th>
              <th className="numero">Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {compras.map((compra) => (
              <tr key={compra.grupoId}>
                <td>{compra.descricao}</td>
                <td>{formatarDataIsoComoBrasileira(compra.dataDaCompra)}</td>
                <td className="numero">{compra.parcelasTotal}×</td>
                <td>
                  {formatarDataIsoComoBrasileira(compra.primeiroVencimento)}
                  {compra.parcelasTotal > 1 &&
                    ` a ${formatarDataIsoComoBrasileira(compra.ultimoVencimento)}`}
                </td>
                <td className="numero">{formatarCentavosComoReal(compra.totalCentavos)}</td>
                <td className="acoes-linha">
                  <BotaoExcluirComConfirmacao aoConfirmar={() => aoExcluirCompra(compra.grupoId)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
