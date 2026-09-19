import { useState } from 'react'
import {
  converterTimestampDoBancoEmDataIsoLocal,
  formatarDataIsoComoBrasileira
} from '../../../shared/datas/dataIso'
import { obterMesDaData } from '../../../shared/datas/mes'
import type { FechamentoMes } from '../../../shared/fechamentos/tipos'
import { calcularGuardadoNoMes } from '../../../shared/investimentos/calculos'
import type { Movimentacao } from '../../../shared/investimentos/tipos'
import { calcularResumo, filtrarPorMes } from '../../../shared/lancamentos/resumo'
import type {
  Lancamento,
  LancamentoEditado,
  NovoLancamento
} from '../../../shared/lancamentos/tipos'
import { FormularioLancamento } from './FormularioLancamento'
import { ListaLancamentos } from './ListaLancamentos'
import { ResumoDoMes } from './ResumoDoMes'
import { SeletorDeMes } from './SeletorDeMes'

interface Props {
  lancamentos: Lancamento[]
  movimentacoes: Movimentacao[]
  fechamentos: FechamentoMes[]
  mesSelecionado: string
  aoMudarMes: (mes: string) => void
  aoCriar: (novoLancamento: NovoLancamento) => Promise<void>
  aoAtualizar: (lancamento: LancamentoEditado) => Promise<void>
  aoExcluir: (id: number) => Promise<void>
}

export function PaginaLancamentos({
  lancamentos,
  movimentacoes,
  fechamentos,
  mesSelecionado,
  aoMudarMes,
  aoCriar,
  aoAtualizar,
  aoExcluir
}: Props): React.JSX.Element {
  const [lancamentoEmEdicao, setLancamentoEmEdicao] = useState<Lancamento | null>(null)

  const lancamentosDoMes = filtrarPorMes(lancamentos, mesSelecionado)
  const fechamentoDoMes = fechamentos.find((fechamento) => fechamento.mes === mesSelecionado)

  const salvar = async (novoLancamento: NovoLancamento): Promise<void> => {
    if (lancamentoEmEdicao) await aoAtualizar({ ...novoLancamento, id: lancamentoEmEdicao.id })
    else await aoCriar(novoLancamento)
    setLancamentoEmEdicao(null)
    aoMudarMes(obterMesDaData(novoLancamento.data))
  }

  return (
    <>
      <FormularioLancamento
        key={lancamentoEmEdicao?.id ?? 'novo'}
        lancamentoEmEdicao={lancamentoEmEdicao}
        aoSalvar={salvar}
        aoCancelarEdicao={() => setLancamentoEmEdicao(null)}
      />
      <SeletorDeMes mes={mesSelecionado} aoMudar={aoMudarMes} />
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
      <ListaLancamentos
        lancamentos={lancamentosDoMes}
        fechamentos={fechamentos}
        aoEditar={setLancamentoEmEdicao}
        aoExcluir={aoExcluir}
      />
    </>
  )
}
