import { useState } from 'react'
import { obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { obterMesDaData } from '../../../shared/datas/mes'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import { calcularSaldoEmCentavos } from '../../../shared/lancamentos/calcularSaldo'
import { calcularResumo, filtrarPorMes, resumirPorMes } from '../../../shared/lancamentos/resumo'
import type { Lancamento, NovoLancamento } from '../../../shared/lancamentos/tipos'
import { FormularioLancamento } from './FormularioLancamento'
import { HistoricoMensal } from './HistoricoMensal'
import { ListaLancamentos } from './ListaLancamentos'
import { ResumoDoMes } from './ResumoDoMes'
import { SeletorDeMes } from './SeletorDeMes'
import { useLancamentos } from './useLancamentos'

type Aba = 'lancamentos' | 'historico'

export function PaginaLancamentos(): React.JSX.Element {
  const { lancamentos, criar, atualizar, excluir } = useLancamentos()
  const [aba, setAba] = useState<Aba>('lancamentos')
  const [mesSelecionado, setMesSelecionado] = useState(obterMesDaData(obterDataIsoDeHoje()))
  const [lancamentoEmEdicao, setLancamentoEmEdicao] = useState<Lancamento | null>(null)

  const lancamentosDoMes = filtrarPorMes(lancamentos, mesSelecionado)
  const saldoGeralEmCentavos = calcularSaldoEmCentavos(lancamentos)

  const salvar = async (novoLancamento: NovoLancamento): Promise<void> => {
    if (lancamentoEmEdicao) await atualizar({ ...novoLancamento, id: lancamentoEmEdicao.id })
    else await criar(novoLancamento)
    setLancamentoEmEdicao(null)
    setMesSelecionado(obterMesDaData(novoLancamento.data))
  }

  const abrirMesNosLancamentos = (mes: string): void => {
    setMesSelecionado(mes)
    setAba('lancamentos')
  }

  return (
    <main className="pagina">
      <header className="cabecalho">
        <h1>Caixa Forte</h1>
        <div className="saldo">
          <span>Saldo geral</span>
          <strong className={saldoGeralEmCentavos < 0 ? 'despesa' : 'receita'}>
            {formatarCentavosComoReal(saldoGeralEmCentavos)}
          </strong>
        </div>
      </header>

      <nav className="abas">
        <button
          className={aba === 'lancamentos' ? 'aba ativa' : 'aba'}
          onClick={() => setAba('lancamentos')}
        >
          Lançamentos
        </button>
        <button
          className={aba === 'historico' ? 'aba ativa' : 'aba'}
          onClick={() => setAba('historico')}
        >
          Histórico
        </button>
      </nav>

      {aba === 'historico' ? (
        <HistoricoMensal
          resumos={resumirPorMes(lancamentos)}
          aoSelecionarMes={abrirMesNosLancamentos}
        />
      ) : (
        <>
          <FormularioLancamento
            key={lancamentoEmEdicao?.id ?? 'novo'}
            lancamentoEmEdicao={lancamentoEmEdicao}
            aoSalvar={salvar}
            aoCancelarEdicao={() => setLancamentoEmEdicao(null)}
          />
          <SeletorDeMes mes={mesSelecionado} aoMudar={setMesSelecionado} />
          <ResumoDoMes resumo={calcularResumo(lancamentosDoMes)} />
          <ListaLancamentos
            lancamentos={lancamentosDoMes}
            aoEditar={setLancamentoEmEdicao}
            aoExcluir={excluir}
          />
        </>
      )}
    </main>
  )
}
