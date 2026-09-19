import type { Database } from 'better-sqlite3'
import { ipcMain } from 'electron'
import { obterDataIsoDeHoje } from '../../shared/datas/dataIso'
import { CANAIS_RECORRENCIAS } from '../../shared/recorrencias/canais'
import { validarNovaRecorrencia } from '../../shared/recorrencias/regras'
import type {
  DefinicaoDeRecorrencia,
  NovaRecorrencia,
  RecorrenciaEditada
} from '../../shared/recorrencias/tipos'
import { definirLancamentoRecorrente } from './definirLancamentoRecorrente'
import { gerarLancamentosRecorrentes } from './gerarLancamentosRecorrentes'
import {
  atualizarRecorrencia,
  definirRecorrenciaAtiva,
  excluirRecorrencia,
  inserirRecorrencia,
  listarRecorrencias
} from './repositorioRecorrencias'

function lancarErroSeInvalida(recorrencia: NovaRecorrencia): void {
  const erros = validarNovaRecorrencia(recorrencia)
  if (erros.length > 0) throw new Error(erros.join(' '))
}

export function registrarIpcRecorrencias(banco: Database): void {
  ipcMain.handle(CANAIS_RECORRENCIAS.listar, () => listarRecorrencias(banco))

  ipcMain.handle(CANAIS_RECORRENCIAS.criar, (_evento, nova: NovaRecorrencia) => {
    lancarErroSeInvalida(nova)
    const recorrencia = inserirRecorrencia(banco, nova)
    gerarLancamentosRecorrentes(banco, obterDataIsoDeHoje())
    return recorrencia
  })

  ipcMain.handle(CANAIS_RECORRENCIAS.atualizar, (_evento, recorrencia: RecorrenciaEditada) => {
    lancarErroSeInvalida(recorrencia)
    atualizarRecorrencia(banco, recorrencia)
    gerarLancamentosRecorrentes(banco, obterDataIsoDeHoje())
  })

  ipcMain.handle(CANAIS_RECORRENCIAS.definirAtiva, (_evento, id: number, ativa: boolean) => {
    definirRecorrenciaAtiva(banco, id, ativa)
    if (ativa) gerarLancamentosRecorrentes(banco, obterDataIsoDeHoje())
  })

  ipcMain.handle(CANAIS_RECORRENCIAS.excluir, (_evento, id: number) =>
    excluirRecorrencia(banco, id)
  )

  ipcMain.handle(
    CANAIS_RECORRENCIAS.definirDoLancamento,
    (_evento, lancamentoId: number, definicao: DefinicaoDeRecorrencia) => {
      definirLancamentoRecorrente(banco, lancamentoId, definicao, obterDataIsoDeHoje())
      gerarLancamentosRecorrentes(banco, obterDataIsoDeHoje())
    }
  )

  ipcMain.handle(CANAIS_RECORRENCIAS.gerarPendentes, () =>
    gerarLancamentosRecorrentes(banco, obterDataIsoDeHoje())
  )
}
