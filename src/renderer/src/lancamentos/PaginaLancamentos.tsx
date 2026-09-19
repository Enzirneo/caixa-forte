import { useState } from 'react'
import { listarCategoriasEmUso } from '../../../shared/categorias/nomeDaCategoria'
import type { AjusteDeFechamento, Cartao, NovaCompraNoCartao } from '../../../shared/cartoes/tipos'
import {
  converterTimestampDoBancoEmDataIsoLocal,
  formatarDataIsoComoBrasileira
} from '../../../shared/datas/dataIso'
import { obterMesDaData } from '../../../shared/datas/mes'
import type { FechamentoMes } from '../../../shared/fechamentos/tipos'
import { calcularGuardadoNoMes } from '../../../shared/investimentos/calculos'
import type { Movimentacao } from '../../../shared/investimentos/tipos'
import {
  FILTRO_PADRAO_DE_LANCAMENTOS,
  aplicarFiltroDeLancamentos,
  filtroEstaAtivo,
  type FiltroDeLancamentos
} from '../../../shared/lancamentos/filtrarLancamentos'
import { montarRotulosDeReembolso } from '../../../shared/lancamentos/reembolsos'
import { calcularResumo, filtrarPorMes } from '../../../shared/lancamentos/resumo'
import type {
  Lancamento,
  LancamentoEditado,
  NovoLancamento
} from '../../../shared/lancamentos/tipos'
import type { Recorrencia } from '../../../shared/recorrencias/tipos'
import { FiltrosDeLancamentos } from './FiltrosDeLancamentos'
import { FormularioLancamento } from './FormularioLancamento'
import { ListaLancamentos } from './ListaLancamentos'
import { ResumoDoMes } from './ResumoDoMes'
import { SeletorDeMes } from './SeletorDeMes'

interface Props {
  lancamentos: Lancamento[]
  movimentacoes: Movimentacao[]
  fechamentos: FechamentoMes[]
  rotulosDeCompra: Map<number, string>
  cartoes: Cartao[]
  ajustesDeFechamento: AjusteDeFechamento[]
  recorrencias: Recorrencia[]
  mesSelecionado: string
  aoMudarMes: (mes: string) => void
  aoCriar: (novoLancamento: NovoLancamento) => Promise<void>
  aoAtualizar: (lancamento: LancamentoEditado) => Promise<void>
  aoExcluir: (id: number) => Promise<void>
  aoRegistrarCompraNoCartao: (compra: NovaCompraNoCartao) => Promise<void>
  aoDefinirRecorrente: (lancamentoId: number, recorrente: boolean) => Promise<void>
}

export function PaginaLancamentos({
  lancamentos,
  movimentacoes,
  fechamentos,
  rotulosDeCompra,
  cartoes,
  ajustesDeFechamento,
  recorrencias,
  mesSelecionado,
  aoMudarMes,
  aoCriar,
  aoAtualizar,
  aoExcluir,
  aoRegistrarCompraNoCartao,
  aoDefinirRecorrente
}: Props): React.JSX.Element {
  const [lancamentoEmEdicao, setLancamentoEmEdicao] = useState<Lancamento | null>(null)
  const [filtro, setFiltro] = useState<FiltroDeLancamentos>(FILTRO_PADRAO_DE_LANCAMENTOS)

  const categoriasSugeridas = listarCategoriasEmUso(lancamentos)
  const lancamentosDoMes = filtrarPorMes(lancamentos, mesSelecionado)
  const lancamentosExibidos = aplicarFiltroDeLancamentos(lancamentosDoMes, filtro)
  const fechamentoDoMes = fechamentos.find((fechamento) => fechamento.mes === mesSelecionado)

  // Reembolso e parcela de cartão não se repetem como um lançamento comum.
  const podeSerRecorrente =
    lancamentoEmEdicao !== null &&
    lancamentoEmEdicao.tipo !== 'reembolso' &&
    !rotulosDeCompra.has(lancamentoEmEdicao.id)
  const recorrenteInicial =
    recorrencias.find((recorrencia) => recorrencia.id === lancamentoEmEdicao?.recorrenciaId)
      ?.ativa ?? false

  const salvar = async (novoLancamento: NovoLancamento, recorrente?: boolean): Promise<void> => {
    if (lancamentoEmEdicao) {
      await aoAtualizar({ ...novoLancamento, id: lancamentoEmEdicao.id })
      if (recorrente !== undefined) await aoDefinirRecorrente(lancamentoEmEdicao.id, recorrente)
    } else {
      await aoCriar(novoLancamento)
    }
    setLancamentoEmEdicao(null)
    aoMudarMes(obterMesDaData(novoLancamento.data))
  }

  return (
    <div className="pagina-de-lancamentos">
      <div className="area-fixa">
        <FormularioLancamento
          key={lancamentoEmEdicao?.id ?? 'novo'}
          lancamentoEmEdicao={lancamentoEmEdicao}
          todosOsLancamentos={lancamentos}
          podeSerRecorrente={podeSerRecorrente}
          recorrenteInicial={recorrenteInicial}
          categoriasSugeridas={categoriasSugeridas}
          cartoes={cartoes}
          ajustesDeFechamento={ajustesDeFechamento}
          aoSalvar={salvar}
          aoRegistrarNoCartao={aoRegistrarCompraNoCartao}
          aoCancelarEdicao={() => setLancamentoEmEdicao(null)}
        />
        <SeletorDeMes mes={mesSelecionado} aoMudar={aoMudarMes} />
      </div>

      <div className="area-rolavel">
        {fechamentoDoMes && (
          <p className="aviso-de-fechamento">
            Mês fechado em{' '}
            {formatarDataIsoComoBrasileira(
              converterTimestampDoBancoEmDataIsoLocal(fechamentoDoMes.fechadoEm)
            )}
            . Lançamentos feitos depois aparecem com a ressalva de que vieram após o fechamento.
          </p>
        )}
        <ResumoDoMes
          resumo={calcularResumo(lancamentosDoMes)}
          guardadoNoMesCentavos={calcularGuardadoNoMes(movimentacoes, mesSelecionado)}
        />
        <FiltrosDeLancamentos filtro={filtro} aoMudar={setFiltro} />
        <ListaLancamentos
          lancamentos={lancamentosExibidos}
          filtrando={filtroEstaAtivo(filtro)}
          ordenacao={filtro.ordenacao}
          aoOrdenar={(ordenacao) => setFiltro({ ...filtro, ordenacao })}
          fechamentos={fechamentos}
          rotulosDeCompra={rotulosDeCompra}
          rotulosDeReembolso={montarRotulosDeReembolso(lancamentos)}
          aoEditar={setLancamentoEmEdicao}
          aoExcluir={aoExcluir}
        />
      </div>
    </div>
  )
}
