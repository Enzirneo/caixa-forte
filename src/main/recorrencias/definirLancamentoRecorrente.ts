import type { Database } from 'better-sqlite3'
import { formatarMesPorExtenso } from '../../shared/datas/mes'
import { calcularMesDeInicioAPartirDoLancamento } from '../../shared/recorrencias/regras'
import type { DefinicaoDeRecorrencia } from '../../shared/recorrencias/tipos'
import { listarVinculos } from '../cartoes/repositorioCartoes'
import {
  buscarLancamentoPorId,
  definirRecorrenciaDoLancamento
} from '../lancamentos/repositorioLancamentos'
import {
  definirFimDaRecorrencia,
  definirRecorrenciaAtiva,
  inserirRecorrencia,
  listarRecorrencias
} from './repositorioRecorrencias'

const POSICAO_DO_DIA_NA_DATA = 8

function lancarSeTerminoAntesDoInicio(mesDeFim: string | null, mesDeInicio: string): void {
  if (mesDeFim !== null && mesDeFim < mesDeInicio) {
    throw new Error(`O término não pode ser antes de ${formatarMesPorExtenso(mesDeInicio)}.`)
  }
}

function criarRecorrenciaDoLancamento(
  banco: Database,
  lancamentoId: number,
  mesDeFim: string | null,
  hojeIso: string
): void {
  const lancamento = buscarLancamentoPorId(banco, lancamentoId)
  if (lancamento.tipo === 'reembolso') {
    throw new Error('Um reembolso não pode ser recorrente.')
  }
  if (listarVinculos(banco).some((vinculo) => vinculo.lancamentoId === lancamentoId)) {
    throw new Error('Uma compra no cartão não vira recorrente por aqui: cadastre em Recorrentes.')
  }

  const mesDeInicio = calcularMesDeInicioAPartirDoLancamento(lancamento.data, hojeIso)
  lancarSeTerminoAntesDoInicio(mesDeFim, mesDeInicio)

  const recorrencia = inserirRecorrencia(banco, {
    descricao: lancamento.descricao,
    valorCentavos: lancamento.valorCentavos,
    tipo: lancamento.tipo,
    categoria: lancamento.categoria,
    diaDoMes: Number(lancamento.data.slice(POSICAO_DO_DIA_NA_DATA)),
    mesDeInicio,
    mesDeFim
  })
  definirRecorrenciaDoLancamento(banco, lancamentoId, recorrencia.id)
}

function atualizarRecorrenciaDoLancamento(
  banco: Database,
  recorrenciaId: number,
  definicao: DefinicaoDeRecorrencia
): void {
  if (definicao.recorrente) {
    const recorrencia = listarRecorrencias(banco).find(({ id }) => id === recorrenciaId)
    if (recorrencia) lancarSeTerminoAntesDoInicio(definicao.mesDeFim, recorrencia.mesDeInicio)
    definirFimDaRecorrencia(banco, recorrenciaId, definicao.mesDeFim)
  }
  definirRecorrenciaAtiva(banco, recorrenciaId, definicao.recorrente)
}

// Marcar: se o lançamento ainda não tem recorrência, cria uma que continua a partir dele até o mês
// escolhido (ou até a pessoa parar); se já tem, retoma e atualiza o término. Desmarcar: pausa a
// recorrência, sem apagar nada do que já foi lançado.
export function definirLancamentoRecorrente(
  banco: Database,
  lancamentoId: number,
  definicao: DefinicaoDeRecorrencia,
  hojeIso: string
): void {
  banco.transaction(() => {
    const { recorrenciaId } = buscarLancamentoPorId(banco, lancamentoId)

    if (recorrenciaId != null) {
      atualizarRecorrenciaDoLancamento(banco, recorrenciaId, definicao)
    } else if (definicao.recorrente) {
      criarRecorrenciaDoLancamento(banco, lancamentoId, definicao.mesDeFim, hojeIso)
    }
  })()
}
