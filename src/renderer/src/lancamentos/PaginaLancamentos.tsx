import { useState } from 'react'
import { listarCategoriasEmUso } from '../../../shared/categorias/nomeDaCategoria'
import type { AjusteDeFechamento, Cartao, NovaCompraNoCartao } from '../../../shared/cartoes/tipos'
import {
  converterTimestampDoBancoEmDataIsoLocal,
  formatarDataIsoComoBrasileira,
  obterDataIsoDeHoje
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
import { calcularMesDeInicioAPartirDoLancamento } from '../../../shared/recorrencias/regras'
import type {
  DefinicaoDeRecorrencia,
  NovaRecorrencia,
  Recorrencia
} from '../../../shared/recorrencias/tipos'
import { FiltrosDeLancamentos } from './FiltrosDeLancamentos'
import { FormularioLancamento } from './FormularioLancamento'
import { ListaLancamentos } from './ListaLancamentos'
import { ResumoDoMes } from './ResumoDoMes'
import { SeletorDeMes } from './SeletorDeMes'

const POSICAO_DO_DIA_NA_DATA = 8

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
  aoCriar: (novoLancamento: NovoLancamento) => Promise<Lancamento>
  aoAtualizar: (lancamento: LancamentoEditado) => Promise<void>
  aoExcluir: (id: number) => Promise<void>
  aoRegistrarCompraNoCartao: (compra: NovaCompraNoCartao) => Promise<void>
  aoDefinirRecorrente: (lancamentoId: number, definicao: DefinicaoDeRecorrencia) => Promise<void>
  aoCriarRecorrencia: (novaRecorrencia: NovaRecorrencia) => Promise<void>
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
  aoDefinirRecorrente,
  aoCriarRecorrencia
}: Props): React.JSX.Element {
  const [lancamentoEmEdicao, setLancamentoEmEdicao] = useState<Lancamento | null>(null)
  const [filtro, setFiltro] = useState<FiltroDeLancamentos>(FILTRO_PADRAO_DE_LANCAMENTOS)

  const categoriasSugeridas = listarCategoriasEmUso(lancamentos)
  const lancamentosDoMes = filtrarPorMes(lancamentos, mesSelecionado)
  const lancamentosExibidos = aplicarFiltroDeLancamentos(lancamentosDoMes, filtro)
  const fechamentoDoMes = fechamentos.find((fechamento) => fechamento.mes === mesSelecionado)

  // Um lançamento novo pode se repetir; um já existente, só se não for reembolso nem parcela de cartão.
  const podeSerRecorrente =
    lancamentoEmEdicao === null ||
    (lancamentoEmEdicao.tipo !== 'reembolso' && !rotulosDeCompra.has(lancamentoEmEdicao.id))
  const recorrenciaDoLancamento = recorrencias.find(
    (recorrencia) => recorrencia.id === lancamentoEmEdicao?.recorrenciaId
  )
  const recorrenteInicial = recorrenciaDoLancamento?.ativa ?? false

  const salvar = async (
    novoLancamento: NovoLancamento,
    definicaoDeRecorrencia?: DefinicaoDeRecorrencia
  ): Promise<void> => {
    if (lancamentoEmEdicao) {
      await aoAtualizar({ ...novoLancamento, id: lancamentoEmEdicao.id })
      if (definicaoDeRecorrencia) {
        await aoDefinirRecorrente(lancamentoEmEdicao.id, definicaoDeRecorrencia)
      }
    } else {
      const criado = await aoCriar(novoLancamento)
      if (definicaoDeRecorrencia) await aoDefinirRecorrente(criado.id, definicaoDeRecorrencia)
    }
    setLancamentoEmEdicao(null)
    aoMudarMes(obterMesDaData(novoLancamento.data))
  }

  // Compra recorrente no cartão: a primeira já é lançada agora e a regra segue a partir do mês seguinte.
  const registrarCompraNoCartao = async (
    compra: NovaCompraNoCartao,
    definicaoDeRecorrencia?: DefinicaoDeRecorrencia
  ): Promise<void> => {
    await aoRegistrarCompraNoCartao(compra)
    if (!definicaoDeRecorrencia?.recorrente) return

    await aoCriarRecorrencia({
      descricao: compra.descricao.trim(),
      valorCentavos: compra.valorTotalCentavos,
      tipo: 'despesa',
      categoria: compra.categoria,
      diaDoMes: Number(compra.dataDaCompra.slice(POSICAO_DO_DIA_NA_DATA)),
      mesDeInicio: calcularMesDeInicioAPartirDoLancamento(
        compra.dataDaCompra,
        obterDataIsoDeHoje()
      ),
      mesDeFim: definicaoDeRecorrencia.mesDeFim,
      cartaoId: compra.cartaoId
    })
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
          mesDeFimInicial={recorrenciaDoLancamento?.mesDeFim ?? ''}
          mesMinimoDeTermino={recorrenciaDoLancamento?.mesDeInicio ?? null}
          categoriasSugeridas={categoriasSugeridas}
          cartoes={cartoes}
          ajustesDeFechamento={ajustesDeFechamento}
          aoSalvar={salvar}
          aoRegistrarNoCartao={registrarCompraNoCartao}
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
