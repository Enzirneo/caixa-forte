import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { CANAIS_ARQUIVOS, type ApiArquivos } from '../shared/arquivos/tipos'
import { CANAIS_BACKUP } from '../shared/backup/canais'
import type { ApiBackup } from '../shared/backup/tipos'
import { CANAIS_FECHAMENTOS } from '../shared/fechamentos/canais'
import type { ApiFechamentos } from '../shared/fechamentos/tipos'
import { CANAIS_INVESTIMENTOS } from '../shared/investimentos/canais'
import type { ApiInvestimentos } from '../shared/investimentos/tipos'
import { CANAIS_LANCAMENTOS } from '../shared/lancamentos/canais'
import type { ApiLancamentos } from '../shared/lancamentos/tipos'

const lancamentos: ApiLancamentos = {
  listar: () => ipcRenderer.invoke(CANAIS_LANCAMENTOS.listar),
  criar: (novoLancamento) => ipcRenderer.invoke(CANAIS_LANCAMENTOS.criar, novoLancamento),
  criarVarios: (novosLancamentos) =>
    ipcRenderer.invoke(CANAIS_LANCAMENTOS.criarVarios, novosLancamentos),
  atualizar: (lancamento) => ipcRenderer.invoke(CANAIS_LANCAMENTOS.atualizar, lancamento),
  excluir: (id) => ipcRenderer.invoke(CANAIS_LANCAMENTOS.excluir, id)
}

const fechamentos: ApiFechamentos = {
  listar: () => ipcRenderer.invoke(CANAIS_FECHAMENTOS.listar),
  fecharMesesEncerrados: () => ipcRenderer.invoke(CANAIS_FECHAMENTOS.fecharMesesEncerrados),
  refazer: (mes) => ipcRenderer.invoke(CANAIS_FECHAMENTOS.refazer, mes)
}

const investimentos: ApiInvestimentos = {
  listarDestinos: () => ipcRenderer.invoke(CANAIS_INVESTIMENTOS.listarDestinos),
  criarDestino: (novoDestino) => ipcRenderer.invoke(CANAIS_INVESTIMENTOS.criarDestino, novoDestino),
  listarMovimentacoes: () => ipcRenderer.invoke(CANAIS_INVESTIMENTOS.listarMovimentacoes),
  criarMovimentacao: (novaMovimentacao) =>
    ipcRenderer.invoke(CANAIS_INVESTIMENTOS.criarMovimentacao, novaMovimentacao),
  excluirMovimentacao: (id) => ipcRenderer.invoke(CANAIS_INVESTIMENTOS.excluirMovimentacao, id)
}

const backup: ApiBackup = {
  informacoes: () => ipcRenderer.invoke(CANAIS_BACKUP.informacoes),
  criar: () => ipcRenderer.invoke(CANAIS_BACKUP.criar),
  restaurar: () => ipcRenderer.invoke(CANAIS_BACKUP.restaurar),
  abrirPasta: () => ipcRenderer.invoke(CANAIS_BACKUP.abrirPasta)
}

const arquivos: ApiArquivos = {
  salvarTexto: (nomeSugerido, conteudo) =>
    ipcRenderer.invoke(CANAIS_ARQUIVOS.salvarTexto, nomeSugerido, conteudo)
}

const api = { lancamentos, fechamentos, investimentos, backup, arquivos }

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
