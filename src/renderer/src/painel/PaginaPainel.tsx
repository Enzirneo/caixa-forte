import { obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { formatarMesPorExtenso, somarMeses } from '../../../shared/datas/mes'
import {
  agruparDespesasPorCategoria,
  calcularPercentualQueSobrou,
  calcularVariacaoPercentual,
  montarSerieDoPatrimonio,
  montarSerieMensal
} from '../../../shared/dashboard/dadosDosGraficos'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import {
  calcularPatrimonio,
  calcularPosicaoDoDestino
} from '../../../shared/investimentos/rendimento'
import type { Destino, Movimentacao } from '../../../shared/investimentos/tipos'
import { calcularResumo, filtrarPorMes } from '../../../shared/lancamentos/resumo'
import type { Lancamento } from '../../../shared/lancamentos/tipos'
import { SeletorDeMes } from '../lancamentos/SeletorDeMes'
import { ROTULO_DO_TIPO_DE_DESTINO } from '../investimentos/rotulos'
import { CartaoDeIndicador } from './CartaoDeIndicador'
import { GraficoDeArea } from './GraficoDeArea'
import { GraficoDeBarrasMensais } from './GraficoDeBarrasMensais'
import { GraficoDeRosca } from './GraficoDeRosca'

const QUANTIDADE_DE_MESES_NOS_GRAFICOS = 6

interface Props {
  lancamentos: Lancamento[]
  destinos: Destino[]
  movimentacoes: Movimentacao[]
  mesSelecionado: string
  aoMudarMes: (mes: string) => void
}

export function PaginaPainel({
  lancamentos,
  destinos,
  movimentacoes,
  mesSelecionado,
  aoMudarMes
}: Props): React.JSX.Element {
  const hoje = obterDataIsoDeHoje()
  const resumoDoMes = calcularResumo(filtrarPorMes(lancamentos, mesSelecionado))
  const resumoDoMesAnterior = calcularResumo(
    filtrarPorMes(lancamentos, somarMeses(mesSelecionado, -1))
  )
  const percentualQueSobrou = calcularPercentualQueSobrou(
    resumoDoMes.receitasCentavos,
    resumoDoMes.despesasCentavos
  )
  const patrimonio = calcularPatrimonio(destinos, movimentacoes, hoje)

  const serieMensal = montarSerieMensal(
    lancamentos,
    mesSelecionado,
    QUANTIDADE_DE_MESES_NOS_GRAFICOS
  )
  const fatiasDeCategoria = agruparDespesasPorCategoria(lancamentos, mesSelecionado)
  const seriePatrimonio = montarSerieDoPatrimonio(
    destinos,
    movimentacoes,
    mesSelecionado,
    QUANTIDADE_DE_MESES_NOS_GRAFICOS,
    hoje
  )

  if (lancamentos.length === 0 && destinos.length === 0) {
    return (
      <p className="vazio">
        O painel aparece quando você lançar os primeiros gastos. Comece pela aba Lançamentos, ou
        importe uma lista pela aba Importar.
      </p>
    )
  }

  return (
    <>
      <SeletorDeMes mes={mesSelecionado} aoMudar={aoMudarMes} />

      <div className="painel-indicadores">
        <CartaoDeIndicador
          titulo="Receitas"
          valor={formatarCentavosComoReal(resumoDoMes.receitasCentavos)}
          corDoValor="receita"
          variacaoPercentual={calcularVariacaoPercentual(
            resumoDoMes.receitasCentavos,
            resumoDoMesAnterior.receitasCentavos
          )}
        />
        <CartaoDeIndicador
          titulo="Despesas"
          valor={formatarCentavosComoReal(resumoDoMes.despesasCentavos)}
          corDoValor="despesa"
          aumentoEhBom={false}
          variacaoPercentual={calcularVariacaoPercentual(
            resumoDoMes.despesasCentavos,
            resumoDoMesAnterior.despesasCentavos
          )}
        />
        <CartaoDeIndicador
          titulo="Sobrou da renda"
          valor={percentualQueSobrou === null ? '—' : `${percentualQueSobrou}%`}
          corDoValor={
            percentualQueSobrou !== null && percentualQueSobrou < 0 ? 'despesa' : 'receita'
          }
          detalhe={`${formatarCentavosComoReal(resumoDoMes.saldoCentavos)} no mês`}
        />
        <CartaoDeIndicador
          titulo="Guardado (estimado)"
          valor={formatarCentavosComoReal(patrimonio.saldoEstimadoCentavos)}
          detalhe={`Rendeu ${formatarCentavosComoReal(patrimonio.rendimentoEstimadoCentavos)}`}
        />
      </div>

      <div className="painel-graficos">
        <section className="cartao-de-grafico painel-largo">
          <header>
            <h2>Receitas e despesas</h2>
            <div className="legenda-em-linha">
              <span>
                <i className="legenda-cor legenda-receita" />
                Receitas
              </span>
              <span>
                <i className="legenda-cor legenda-despesa" />
                Despesas
              </span>
            </div>
          </header>
          <GraficoDeBarrasMensais pontos={serieMensal} />
        </section>

        <section className="cartao-de-grafico">
          <header>
            <h2>Despesas por categoria</h2>
            <span className="subtitulo-do-grafico">{formatarMesPorExtenso(mesSelecionado)}</span>
          </header>
          {fatiasDeCategoria.length > 0 ? (
            <GraficoDeRosca fatias={fatiasDeCategoria} />
          ) : (
            <p className="vazio">Sem despesas neste mês.</p>
          )}
        </section>
      </div>

      <div className="painel-graficos">
        <section className="cartao-de-grafico painel-largo">
          <header>
            <h2>Evolução do valor guardado</h2>
            <span className="subtitulo-do-grafico">Estimado ao fim de cada mês</span>
          </header>
          {destinos.length > 0 ? (
            <GraficoDeArea pontos={seriePatrimonio} />
          ) : (
            <p className="vazio">Cadastre um destino na aba Investimentos para acompanhar aqui.</p>
          )}
        </section>

        <section className="cartao-de-grafico">
          <header>
            <h2>Onde está o dinheiro guardado</h2>
          </header>
          {destinos.length > 0 ? (
            <ul className="lista-de-destinos-do-painel">
              {destinos.map((destino) => {
                const posicao = calcularPosicaoDoDestino(destino, movimentacoes, hoje)
                return (
                  <li key={destino.id}>
                    <div>
                      <strong>{destino.nome}</strong>
                      <span>{ROTULO_DO_TIPO_DE_DESTINO[destino.tipo]}</span>
                    </div>
                    <strong>{formatarCentavosComoReal(posicao.saldoEstimadoCentavos)}</strong>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="vazio">Nada guardado ainda.</p>
          )}
        </section>
      </div>
    </>
  )
}
