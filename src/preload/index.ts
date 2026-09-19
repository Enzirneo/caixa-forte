import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { CANAIS_LANCAMENTOS } from '../shared/lancamentos/canais'
import type { ApiLancamentos } from '../shared/lancamentos/tipos'

const lancamentos: ApiLancamentos = {
  listar: () => ipcRenderer.invoke(CANAIS_LANCAMENTOS.listar),
  criar: (novoLancamento) => ipcRenderer.invoke(CANAIS_LANCAMENTOS.criar, novoLancamento),
  atualizar: (lancamento) => ipcRenderer.invoke(CANAIS_LANCAMENTOS.atualizar, lancamento),
  excluir: (id) => ipcRenderer.invoke(CANAIS_LANCAMENTOS.excluir, id)
}

const api = { lancamentos }

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
