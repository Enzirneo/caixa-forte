import { obterDataIsoDeHoje, formatarDataIsoComoBrasileira } from '../../../shared/datas/dataIso'
import { formatarMesPorExtenso, obterMesDaData } from '../../../shared/datas/mes'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import {
  agruparComprasPorGrupo,
  calcularComprometidoNoCartao,
  juntarFaturasEPrevisoes,
  montarFaturas
} from '../../../shared/cartoes/faturas'
import {
  calcularFaturaAberta,
  descreverRegraDoCiclo,
  indexarAjustesDoCartao
} from '../../../shared/cartoes/cicloDaFatura'
import type { AjusteDeFechamento, Cartao, VinculoDeCompra } from '../../../shared/cartoes/tipos'
import type { Lancamento } from '../../../shared/lancamentos/tipos'
import { BotaoExcluirComConfirmacao } from '../compartilhado/BotaoExcluirComConfirmacao'
import {
  calcularPrevistoDasRecorrencias,
  projetarFaturasDasRecorrencias
} from '../../../shared/cartoes/previsaoDeRecorrencias'
import type { Recorrencia } from '../../../shared/recorrencias/tipos'
import { AjustesDeFechamento } from './AjustesDeFechamento'
import { RecorrenciasDoCartao } from './RecorrenciasDoCartao'

interface Props {
  cartao: Cartao
  lancamentos: Lancamento[]
  vinculos: VinculoDeCompra[]
  ajustes: AjusteDeFechamento[]
  recorrencias: Recorrencia[]
  aoEditar: (cartao: Cartao) => void
  aoExcluirCartao: (id: number) => Promise<void>
  aoExcluirCompra: (grupoId: number) => Promise<void>
  aoSalvarAjuste: (ajuste: AjusteDeFechamento) => Promise<void>
  aoRemoverAjuste: (cartaoId: number, mesDoVencimento: string) => Promise<void>
}

export function PainelDoCartao({
  cartao,
  lancamentos,
  vinculos,
  ajustes,
  recorrencias,
  aoEditar,
  aoExcluirCartao,
  aoExcluirCompra,
  aoSalvarAjuste,
  aoRemoverAjuste
}: Props): React.JSX.Element {
  const hoje = obterDataIsoDeHoje()
  const mesAtual = obterMesDaData(hoje)
  const faturasAPartirDoMesAtual = juntarFaturasEPrevisoes(
    montarFaturas(lancamentos, vinculos, cartao.id),
    projetarFaturasDasRecorrencias(recorrencias, cartao, ajustes, hoje)
  ).filter((fatura) => fatura.mes >= mesAtual)
  const compras = agruparComprasPorGrupo(
    lancamentos,
    vinculos.filter((vinculo) => vinculo.cartaoId === cartao.id)
  )
  const comprometido = calcularComprometidoNoCartao(lancamentos, vinculos, cartao.id, hoje)
  const previstoDasRecorrencias = calcularPrevistoDasRecorrencias(recorrencias, cartao.id, hoje)
  const disponivel =
    cartao.limiteCentavos === null
      ? null
      : cartao.limiteCentavos - comprometido - previstoDasRecorrencias
  const faturaAberta = calcularFaturaAberta(
    hoje,
    cartao,
    indexarAjustesDoCartao(ajustes, cartao.id)
  )

  return (
    <section className="cartao-de-grafico painel-do-cartao">
      <header>
        <div>
          <h2>{cartao.nome}</h2>
          <span className="subtitulo-do-grafico">
            {descreverRegraDoCiclo(cartao)} · fatura aberta vence em{' '}
            {formatarDataIsoComoBrasileira(faturaAberta.vencimento)}, melhor data de compra{' '}
            {formatarDataIsoComoBrasileira(faturaAberta.melhorDataDeCompra)}
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
        {previstoDasRecorrencias > 0 && (
          <div>
            <span>Recorrências a cobrar</span>
            <strong className="despesa">{formatarCentavosComoReal(previstoDasRecorrencias)}</strong>
          </div>
        )}
        {cartao.limiteCentavos !== null && disponivel !== null && (
          <>
            <div>
              <span>Limite</span>
              <strong>{formatarCentavosComoReal(cartao.limiteCentavos)}</strong>
            </div>
            <div>
              <span>Disponível</span>
              <strong className={disponivel < 0 ? 'despesa' : 'receita'}>
                {formatarCentavosComoReal(disponivel)}
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
              <th className="numero">Já lançado</th>
              <th className="numero">Recorrências previstas</th>
            </tr>
          </thead>
          <tbody>
            {faturasAPartirDoMesAtual.map((fatura) => (
              <tr key={fatura.mes}>
                <td>{formatarMesPorExtenso(fatura.mes)}</td>
                <td className="numero">{fatura.quantidadeDeItens}</td>
                <td className="numero despesa">{formatarCentavosComoReal(fatura.totalCentavos)}</td>
                <td className="numero">
                  {fatura.previstoCentavos > 0
                    ? formatarCentavosComoReal(fatura.previstoCentavos)
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <RecorrenciasDoCartao cartao={cartao} recorrencias={recorrencias} ajustes={ajustes} />

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

      <AjustesDeFechamento
        cartao={cartao}
        ajustes={ajustes}
        aoSalvar={aoSalvarAjuste}
        aoRemover={aoRemoverAjuste}
      />
    </section>
  )
}
