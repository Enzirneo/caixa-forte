import type { Database } from 'better-sqlite3'
import { calcularMesDeInicioAPartirDoLancamento } from '../../shared/recorrencias/regras'
import { listarVinculos } from '../cartoes/repositorioCartoes'
import {
  buscarLancamentoPorId,
  definirRecorrenciaDoLancamento
} from '../lancamentos/repositorioLancamentos'
import { definirRecorrenciaAtiva, inserirRecorrencia } from './repositorioRecorrencias'

const POSICAO_DO_DIA_NA_DATA = 8

function criarRecorrenciaDoLancamento(
  banco: Database,
  lancamentoId: number,
  hojeIso: string
): void {
  const lancamento = buscarLancamentoPorId(banco, lancamentoId)
  if (lancamento.tipo === 'reembolso') {
    throw new Error('Um reembolso não pode ser recorrente.')
  }
  if (listarVinculos(banco).some((vinculo) => vinculo.lancamentoId === lancamentoId)) {
    throw new Error('Uma compra no cartão não vira recorrente por aqui: cadastre em Recorrentes.')
  }

  const recorrencia = inserirRecorrencia(banco, {
    descricao: lancamento.descricao,
    valorCentavos: lancamento.valorCentavos,
    tipo: lancamento.tipo,
    categoria: lancamento.categoria,
    diaDoMes: Number(lancamento.data.slice(POSICAO_DO_DIA_NA_DATA)),
    mesDeInicio: calcularMesDeInicioAPartirDoLancamento(lancamento.data, hojeIso),
    mesDeFim: null
  })
  definirRecorrenciaDoLancamento(banco, lancamentoId, recorrencia.id)
}

// Marcar: se o lançamento ainda não tem recorrência, cria uma que continua a partir dele; se já
// teve, só a retoma. Desmarcar: pausa a recorrência (não apaga nada do que já foi lançado).
export function definirLancamentoRecorrente(
  banco: Database,
  lancamentoId: number,
  recorrente: boolean,
  hojeIso: string
): void {
  banco.transaction(() => {
    const { recorrenciaId } = buscarLancamentoPorId(banco, lancamentoId)

    if (recorrenciaId != null) {
      definirRecorrenciaAtiva(banco, recorrenciaId, recorrente)
    } else if (recorrente) {
      criarRecorrenciaDoLancamento(banco, lancamentoId, hojeIso)
    }
  })()
}
