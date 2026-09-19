import { useState } from 'react'
import { obterDataIsoDeHoje } from '../../shared/datas/dataIso'
import { obterMesDaData } from '../../shared/datas/mes'
import { formatarCentavosComoReal } from '../../shared/dinheiro/formatarCentavos'
import { calcularSaldoDaContaCorrente } from '../../shared/investimentos/calculos'
import { resumirPorMes } from '../../shared/lancamentos/resumo'
import { PaginaDados } from './dados/PaginaDados'
import { PaginaImportacao } from './importacao/PaginaImportacao'
import { PaginaInvestimentos } from './investimentos/PaginaInvestimentos'
import { useInvestimentos } from './investimentos/useInvestimentos'
import { HistoricoMensal } from './lancamentos/HistoricoMensal'
import { PaginaLancamentos } from './lancamentos/PaginaLancamentos'
import { useFechamentos } from './lancamentos/useFechamentos'
import { useLancamentos } from './lancamentos/useLancamentos'

type Aba = 'lancamentos' | 'historico' | 'investimentos' | 'importar' | 'dados'

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'lancamentos', rotulo: 'Lançamentos' },
  { id: 'historico', rotulo: 'Histórico' },
  { id: 'investimentos', rotulo: 'Investimentos' },
  { id: 'importar', rotulo: 'Importar' },
  { id: 'dados', rotulo: 'Dados' }
]

function App(): React.JSX.Element {
  const { lancamentos, criar, criarVarios, atualizar, excluir } = useLancamentos()
  const { fechamentos, refazerFechamento } = useFechamentos()
  const investimentos = useInvestimentos()
  const [aba, setAba] = useState<Aba>('lancamentos')
  const [mesSelecionado, setMesSelecionado] = useState(obterMesDaData(obterDataIsoDeHoje()))

  const saldoDaContaCorrente = calcularSaldoDaContaCorrente(
    lancamentos,
    investimentos.movimentacoes
  )

  const abrirMesNosLancamentos = (mes: string): void => {
    setMesSelecionado(mes)
    setAba('lancamentos')
  }

  return (
    <main className="pagina">
      <header className="cabecalho">
        <h1>Caixa Forte</h1>
        <div className="saldo">
          <span>Saldo da conta corrente</span>
          <strong className={saldoDaContaCorrente < 0 ? 'despesa' : 'receita'}>
            {formatarCentavosComoReal(saldoDaContaCorrente)}
          </strong>
        </div>
      </header>

      <nav className="abas">
        {ABAS.map((opcao) => (
          <button
            key={opcao.id}
            className={aba === opcao.id ? 'aba ativa' : 'aba'}
            onClick={() => setAba(opcao.id)}
          >
            {opcao.rotulo}
          </button>
        ))}
      </nav>

      {aba === 'lancamentos' && (
        <PaginaLancamentos
          lancamentos={lancamentos}
          movimentacoes={investimentos.movimentacoes}
          fechamentos={fechamentos}
          mesSelecionado={mesSelecionado}
          aoMudarMes={setMesSelecionado}
          aoCriar={criar}
          aoAtualizar={atualizar}
          aoExcluir={excluir}
        />
      )}
      {aba === 'historico' && (
        <HistoricoMensal
          resumos={resumirPorMes(lancamentos)}
          lancamentos={lancamentos}
          movimentacoes={investimentos.movimentacoes}
          fechamentos={fechamentos}
          aoSelecionarMes={abrirMesNosLancamentos}
          aoRefazerFechamento={refazerFechamento}
        />
      )}
      {aba === 'dados' && <PaginaDados lancamentos={lancamentos} />}
      {aba === 'importar' && (
        <PaginaImportacao lancamentosExistentes={lancamentos} aoImportar={criarVarios} />
      )}
      {aba === 'investimentos' && (
        <PaginaInvestimentos
          destinos={investimentos.destinos}
          movimentacoes={investimentos.movimentacoes}
          aoCriarDestino={investimentos.criarDestino}
          aoCriarMovimentacao={investimentos.criarMovimentacao}
          aoExcluirMovimentacao={investimentos.excluirMovimentacao}
        />
      )}
    </main>
  )
}

export default App
