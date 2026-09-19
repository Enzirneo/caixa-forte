import { DatabaseBackup, FileUp, History, PiggyBank, ReceiptText, Vault } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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

interface OpcaoDeNavegacao {
  id: Aba
  rotulo: string
  icone: LucideIcon
}

const TAMANHO_DO_ICONE_DE_NAVEGACAO = 18

const OPCOES_DE_NAVEGACAO: OpcaoDeNavegacao[] = [
  { id: 'lancamentos', rotulo: 'Lançamentos', icone: ReceiptText },
  { id: 'historico', rotulo: 'Histórico', icone: History },
  { id: 'investimentos', rotulo: 'Investimentos', icone: PiggyBank },
  { id: 'importar', rotulo: 'Importar', icone: FileUp },
  { id: 'dados', rotulo: 'Dados', icone: DatabaseBackup }
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
  const tituloDaPagina = OPCOES_DE_NAVEGACAO.find((opcao) => opcao.id === aba)?.rotulo

  const abrirMesNosLancamentos = (mes: string): void => {
    setMesSelecionado(mes)
    setAba('lancamentos')
  }

  return (
    <div className="aplicativo">
      <aside className="barra-lateral">
        <div className="marca">
          <div className="marca-icone">
            <Vault size={20} />
          </div>
          <span>Caixa Forte</span>
        </div>

        <nav className="navegacao">
          {OPCOES_DE_NAVEGACAO.map(({ id, rotulo, icone: Icone }) => (
            <button
              key={id}
              className={aba === id ? 'item-de-navegacao ativo' : 'item-de-navegacao'}
              onClick={() => setAba(id)}
              title={rotulo}
            >
              <Icone size={TAMANHO_DO_ICONE_DE_NAVEGACAO} />
              <span>{rotulo}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="conteudo">
        <header className="topo">
          <h1>{tituloDaPagina}</h1>
          <div className="saldo">
            <span>Saldo da conta corrente</span>
            <strong className={saldoDaContaCorrente < 0 ? 'despesa' : 'receita'}>
              {formatarCentavosComoReal(saldoDaContaCorrente)}
            </strong>
          </div>
        </header>

        <main className="pagina">
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
      </div>
    </div>
  )
}

export default App
