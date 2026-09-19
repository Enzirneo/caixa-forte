import {
  CreditCard,
  DatabaseBackup,
  FileUp,
  History,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Repeat
} from 'lucide-react'
import { useState } from 'react'
import { obterDataIsoDeHoje } from '../../shared/datas/dataIso'
import { obterMesDaData } from '../../shared/datas/mes'
import { formatarCentavosComoReal } from '../../shared/dinheiro/formatarCentavos'
import { calcularSaldoDaContaCorrente } from '../../shared/investimentos/calculos'
import { resumirPorMes } from '../../shared/lancamentos/resumo'
import {
  lerDoArmazenamentoLocal,
  salvarNoArmazenamentoLocal
} from './compartilhado/armazenamentoLocal'
import { montarRotulosDeCompra } from '../../shared/cartoes/faturas'
import { PaginaCartoes } from './cartoes/PaginaCartoes'
import { useCartoes } from './cartoes/useCartoes'
import { PaginaDados } from './dados/PaginaDados'
import { PaginaImportacao } from './importacao/PaginaImportacao'
import { PaginaInvestimentos } from './investimentos/PaginaInvestimentos'
import { useInvestimentos } from './investimentos/useInvestimentos'
import { HistoricoMensal } from './lancamentos/HistoricoMensal'
import { PaginaLancamentos } from './lancamentos/PaginaLancamentos'
import { useFechamentos } from './lancamentos/useFechamentos'
import { useLancamentos } from './lancamentos/useLancamentos'
import { BarraLateral, type OpcaoDeNavegacao } from './navegacao/BarraLateral'
import { PaginaPainel } from './painel/PaginaPainel'
import { PaginaRecorrencias } from './recorrencias/PaginaRecorrencias'
import { useRecorrencias } from './recorrencias/useRecorrencias'
import { useTema } from './tema/useTema'

type Aba =
  | 'painel'
  | 'lancamentos'
  | 'recorrentes'
  | 'cartoes'
  | 'historico'
  | 'investimentos'
  | 'importar'
  | 'dados'

const CHAVE_DA_BARRA_RECOLHIDA = 'caixa-forte:barra-recolhida'
const VALOR_DA_BARRA_RECOLHIDA = 'sim'

const OPCOES_DE_NAVEGACAO: OpcaoDeNavegacao<Aba>[] = [
  { id: 'painel', rotulo: 'Painel', icone: LayoutDashboard },
  { id: 'lancamentos', rotulo: 'Lançamentos', icone: ReceiptText },
  { id: 'recorrentes', rotulo: 'Recorrentes', icone: Repeat },
  { id: 'cartoes', rotulo: 'Cartões', icone: CreditCard },
  { id: 'historico', rotulo: 'Histórico', icone: History },
  { id: 'investimentos', rotulo: 'Investimentos', icone: PiggyBank },
  { id: 'importar', rotulo: 'Importar', icone: FileUp },
  { id: 'dados', rotulo: 'Dados', icone: DatabaseBackup }
]

function App(): React.JSX.Element {
  const { lancamentos, recarregar, criar, criarVarios, atualizar, excluir } = useLancamentos()
  const recorrencias = useRecorrencias(recarregar)
  const cartoes = useCartoes(recarregar)
  const { fechamentos, refazerFechamento } = useFechamentos()
  const investimentos = useInvestimentos()
  const tema = useTema()
  const [aba, setAba] = useState<Aba>('painel')
  const [mesSelecionado, setMesSelecionado] = useState(obterMesDaData(obterDataIsoDeHoje()))
  const [barraRecolhida, setBarraRecolhida] = useState(
    () => lerDoArmazenamentoLocal(CHAVE_DA_BARRA_RECOLHIDA) === VALOR_DA_BARRA_RECOLHIDA
  )

  const saldoDaContaCorrente = calcularSaldoDaContaCorrente(
    lancamentos,
    investimentos.movimentacoes,
    obterDataIsoDeHoje()
  )
  const rotulosDeCompra = montarRotulosDeCompra(cartoes.vinculos, cartoes.cartoes)
  const tituloDaPagina = OPCOES_DE_NAVEGACAO.find((opcao) => opcao.id === aba)?.rotulo

  const alternarBarra = (): void => {
    salvarNoArmazenamentoLocal(
      CHAVE_DA_BARRA_RECOLHIDA,
      barraRecolhida ? '' : VALOR_DA_BARRA_RECOLHIDA
    )
    setBarraRecolhida(!barraRecolhida)
  }

  const abrirMesNosLancamentos = (mes: string): void => {
    setMesSelecionado(mes)
    setAba('lancamentos')
  }

  return (
    <div className={barraRecolhida ? 'aplicativo recolhido' : 'aplicativo'}>
      <BarraLateral
        opcoes={OPCOES_DE_NAVEGACAO}
        opcaoAtiva={aba}
        aoEscolher={setAba}
        recolhida={barraRecolhida}
        aoAlternarRecolhimento={alternarBarra}
        preferenciaDeTema={tema.preferencia}
        aoEscolherTema={tema.escolher}
      />

      <div className="conteudo">
        <header className="topo">
          <h1>{tituloDaPagina}</h1>
          <div className="saldo">
            <span>Saldo da conta corrente</span>
            <strong>{formatarCentavosComoReal(saldoDaContaCorrente)}</strong>
          </div>
        </header>

        <main className="pagina">
          {aba === 'painel' && (
            <PaginaPainel
              lancamentos={lancamentos}
              destinos={investimentos.destinos}
              movimentacoes={investimentos.movimentacoes}
              mesSelecionado={mesSelecionado}
              aoMudarMes={setMesSelecionado}
            />
          )}
          {aba === 'lancamentos' && (
            <PaginaLancamentos
              lancamentos={lancamentos}
              movimentacoes={investimentos.movimentacoes}
              fechamentos={fechamentos}
              rotulosDeCompra={rotulosDeCompra}
              mesSelecionado={mesSelecionado}
              aoMudarMes={setMesSelecionado}
              aoCriar={criar}
              aoAtualizar={atualizar}
              aoExcluir={excluir}
            />
          )}
          {aba === 'recorrentes' && (
            <PaginaRecorrencias
              lancamentos={lancamentos}
              recorrencias={recorrencias.recorrencias}
              aoCriar={recorrencias.criar}
              aoAtualizar={recorrencias.atualizar}
              aoDefinirAtiva={recorrencias.definirAtiva}
              aoExcluir={recorrencias.excluir}
            />
          )}
          {aba === 'cartoes' && (
            <PaginaCartoes
              lancamentos={lancamentos}
              cartoes={cartoes.cartoes}
              vinculos={cartoes.vinculos}
              aoCriarCartao={cartoes.criarCartao}
              aoAtualizarCartao={cartoes.atualizarCartao}
              aoExcluirCartao={cartoes.excluirCartao}
              aoRegistrarCompra={cartoes.registrarCompra}
              aoExcluirCompra={cartoes.excluirCompra}
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
