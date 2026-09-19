import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { CANAIS_ARQUIVOS, type ApiArquivos } from '../shared/arquivos/tipos'
import { CANAIS_BACKUP } from '../shared/backup/canais'
import type { ApiBackup } from '../shared/backup/tipos'
import { CANAIS_FECHAMENTOS } from '../shared/fechamentos/canais'
import type { ApiFechamentos } from '../shared/fechamentos/tipos'
import { CANAIS_INVESTIMENTOS } from '../shared/investimentos/canais'
import type { ApiInvestimentos } from '../shared/investimentos/tipos'
import { CANAIS_RECORRENCIAS } from '../shared/recorrencias/canais'
import type { ApiRecorrencias } from '../shared/recorrencias/tipos'
import { CANAIS_CARTOES } from '../shared/cartoes/canais'
import type { ApiCartoes } from '../shared/cartoes/tipos'
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
  abrirPasta: () => ipcRenderer.invoke(CANAIS_BACKUP.abrirPasta),
  escolherPastaExterna: () => ipcRenderer.invoke(CANAIS_BACKUP.escolherPastaExterna),
  removerPastaExterna: () => ipcRenderer.invoke(CANAIS_BACKUP.removerPastaExterna),
  copiarParaPastaExterna: () => ipcRenderer.invoke(CANAIS_BACKUP.copiarParaPastaExterna)
}

const arquivos: ApiArquivos = {
  salvarTexto: (nomeSugerido, conteudo) =>
    ipcRenderer.invoke(CANAIS_ARQUIVOS.salvarTexto, nomeSugerido, conteudo)
}

const recorrencias: ApiRecorrencias = {
  listar: () => ipcRenderer.invoke(CANAIS_RECORRENCIAS.listar),
  criar: (nova) => ipcRenderer.invoke(CANAIS_RECORRENCIAS.criar, nova),
  atualizar: (recorrencia) => ipcRenderer.invoke(CANAIS_RECORRENCIAS.atualizar, recorrencia),
  definirAtiva: (id, ativa) => ipcRenderer.invoke(CANAIS_RECORRENCIAS.definirAtiva, id, ativa),
  excluir: (id) => ipcRenderer.invoke(CANAIS_RECORRENCIAS.excluir, id),
  gerarPendentes: () => ipcRenderer.invoke(CANAIS_RECORRENCIAS.gerarPendentes),
  definirDoLancamento: (lancamentoId, definicao) =>
    ipcRenderer.invoke(CANAIS_RECORRENCIAS.definirDoLancamento, lancamentoId, definicao)
}

const cartoes: ApiCartoes = {
  listarCartoes: () => ipcRenderer.invoke(CANAIS_CARTOES.listarCartoes),
  criarCartao: (novo) => ipcRenderer.invoke(CANAIS_CARTOES.criarCartao, novo),
  atualizarCartao: (cartao) => ipcRenderer.invoke(CANAIS_CARTOES.atualizarCartao, cartao),
  excluirCartao: (id) => ipcRenderer.invoke(CANAIS_CARTOES.excluirCartao, id),
  listarVinculos: () => ipcRenderer.invoke(CANAIS_CARTOES.listarVinculos),
  registrarCompra: (compra) => ipcRenderer.invoke(CANAIS_CARTOES.registrarCompra, compra),
  excluirCompra: (grupoId) => ipcRenderer.invoke(CANAIS_CARTOES.excluirCompra, grupoId),
  listarAjustes: () => ipcRenderer.invoke(CANAIS_CARTOES.listarAjustes),
  salvarAjuste: (ajuste) => ipcRenderer.invoke(CANAIS_CARTOES.salvarAjuste, ajuste),
  removerAjuste: (cartaoId, mes) => ipcRenderer.invoke(CANAIS_CARTOES.removerAjuste, cartaoId, mes)
}

const api = { lancamentos, fechamentos, investimentos, backup, arquivos, recorrencias, cartoes }

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
