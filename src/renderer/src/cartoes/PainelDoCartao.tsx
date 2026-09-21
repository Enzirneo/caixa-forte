import {
  calcularDiferencaEmDias,
  formatarDataIsoComoBrasileira,
  obterDataIsoDeHoje
} from '../../../shared/datas/dataIso'
import { formatarMesPorExtenso, somarMeses } from '../../../shared/datas/mes'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import {
  agruparComprasPorGrupo,
  calcularComprometidoNoCartao,
  montarFaturas,
  montarQuadroDeFaturas,
  type SituacaoDaFatura
} from '../../../shared/cartoes/faturas'
import {
  calcularDataDoVencimento,
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

const ROTULO_DA_SITUACAO: Record<SituacaoDaFatura, string> = {
  aberta: 'aberta',
  fechada: 'fechada, aguarda o vencimento',
  futura: ''
}

function descreverPrazo(dias: number): string {
  if (dias <= 0) return 'hoje'
  return dias === 1 ? 'amanhã' : `daqui a ${dias} dias`
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
  const ajustesDoCartao = indexarAjustesDoCartao(ajustes, cartao.id)
  const faturaAberta = calcularFaturaAberta(hoje, cartao, ajustesDoCartao)
  const quadroDeFaturas = montarQuadroDeFaturas({
    faturas: montarFaturas(lancamentos, vinculos, cartao.id),
    previsoes: projetarFaturasDasRecorrencias(recorrencias, cartao, ajustes, hoje),
    mesDaFaturaAberta: faturaAberta.mesDoVencimento,
    calcularVencimento: (mes) => calcularDataDoVencimento(mes, cartao),
    hojeIso: hoje
  })
  const totalDaFaturaAberta =
    quadroDeFaturas.find((linha) => linha.situacao === 'aberta')?.totalCentavos ?? 0
  const mesDaProximaFatura = somarMeses(faturaAberta.mesDoVencimento, 1)
  const proximaFatura = quadroDeFaturas.find((linha) => linha.mes === mesDaProximaFatura)
  const compras = agruparComprasPorGrupo(
    lancamentos,
    vinculos.filter((vinculo) => vinculo.cartaoId === cartao.id)
  )
  const comprasAVencer = calcularComprometidoNoCartao(lancamentos, vinculos, cartao.id, hoje)
  const previstoDasRecorrencias = calcularPrevistoDasRecorrencias(recorrencias, cartao.id, hoje)
  // Tudo o que já é certo e ainda não foi pago: compras lançadas a vencer e a próxima cobrança
  // de cada recorrência.
  const comprometido = comprasAVencer + previstoDasRecorrencias
  const disponivel = cartao.limiteCentavos === null ? null : cartao.limiteCentavos - comprometido

  return (
    <section className="cartao-de-grafico painel-do-cartao">
      <header>
        <div>
          <h2>{cartao.nome}</h2>
          <span className="subtitulo-do-grafico">
            Fatura aberta: {formatarMesPorExtenso(faturaAberta.mesDoVencimento)} · vence em{' '}
            {formatarDataIsoComoBrasileira(faturaAberta.vencimento)} · a próxima abre em{' '}
            {formatarDataIsoComoBrasileira(faturaAberta.melhorDataDeCompra)} (
            {descreverPrazo(calcularDiferencaEmDias(hoje, faturaAberta.melhorDataDeCompra))})
          </span>
          <span className="subtitulo-do-grafico">{descreverRegraDoCiclo(cartao)}</span>
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
          <span>Fatura aberta · {formatarMesPorExtenso(faturaAberta.mesDoVencimento)}</span>
          <strong className="despesa">{formatarCentavosComoReal(totalDaFaturaAberta)}</strong>
          <small className="detalhe-do-card">
            vence em {formatarDataIsoComoBrasileira(faturaAberta.vencimento)}
          </small>
        </div>
        <div>
          <span>Próxima fatura · {formatarMesPorExtenso(mesDaProximaFatura)}</span>
          <strong className="despesa">
            {formatarCentavosComoReal(proximaFatura?.totalCentavos ?? 0)}
          </strong>
          <small className="detalhe-do-card">
            abre em {formatarDataIsoComoBrasileira(faturaAberta.melhorDataDeCompra)} · vence em{' '}
            {formatarDataIsoComoBrasileira(calcularDataDoVencimento(mesDaProximaFatura, cartao))}
          </small>
        </div>
        <div>
          <span>Comprometido</span>
          <strong className="despesa">{formatarCentavosComoReal(comprometido)}</strong>
          <small className="detalhe-do-card">
            {formatarCentavosComoReal(comprasAVencer)} em compras ·{' '}
            {formatarCentavosComoReal(previstoDasRecorrencias)} em recorrências
          </small>
        </div>
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
      <table className="lista">
        <thead>
          <tr>
            <th>Fatura</th>
            <th>Vence em</th>
            <th className="numero">Compras lançadas</th>
            <th className="numero">Recorrências previstas</th>
            <th className="numero">Total</th>
          </tr>
        </thead>
        <tbody>
          {quadroDeFaturas.map((linha) => (
            <tr key={linha.mes}>
              <td>
                {formatarMesPorExtenso(linha.mes)}
                {ROTULO_DA_SITUACAO[linha.situacao] && (
                  <span className="rotulo-de-compra">{ROTULO_DA_SITUACAO[linha.situacao]}</span>
                )}
              </td>
              <td>{formatarDataIsoComoBrasileira(linha.vencimento)}</td>
              <td className="numero">
                {linha.lancadoCentavos > 0 ? formatarCentavosComoReal(linha.lancadoCentavos) : '—'}
              </td>
              <td className="numero">
                {linha.previstoCentavos > 0
                  ? formatarCentavosComoReal(linha.previstoCentavos)
                  : '—'}
              </td>
              <td className="numero despesa">{formatarCentavosComoReal(linha.totalCentavos)}</td>
            </tr>
          ))}
        </tbody>
      </table>

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
