import type { Database } from 'better-sqlite3'
import { ipcMain } from 'electron'
import { CANAIS_CARTOES } from '../../shared/cartoes/canais'
import { validarNovaCompra, validarNovoCartao } from '../../shared/cartoes/regras'
import { ehDataIsoValida } from '../../shared/datas/dataIso'
import type {
  AjusteDeFechamento,
  Cartao,
  NovaCompraNoCartao,
  NovoCartao
} from '../../shared/cartoes/tipos'
import {
  atualizarCartao,
  excluirCartao,
  excluirCompraNoCartao,
  inserirCartao,
  listarAjustes,
  listarCartoes,
  listarVinculos,
  registrarCompraNoCartao,
  removerAjuste,
  salvarAjuste
} from './repositorioCartoes'

function lancarSeHouverErros(erros: string[]): void {
  if (erros.length > 0) throw new Error(erros.join(' '))
}

function validarAjuste(ajuste: AjusteDeFechamento): string[] {
  return ehDataIsoValida(ajuste.melhorDataDeCompra)
    ? []
    : ['Informe uma melhor data de compra válida.']
}

export function registrarIpcCartoes(banco: Database): void {
  ipcMain.handle(CANAIS_CARTOES.listarCartoes, () => listarCartoes(banco))

  ipcMain.handle(CANAIS_CARTOES.criarCartao, (_evento, novo: NovoCartao) => {
    lancarSeHouverErros(validarNovoCartao(novo))
    return inserirCartao(banco, novo)
  })

  ipcMain.handle(CANAIS_CARTOES.atualizarCartao, (_evento, cartao: Cartao) => {
    lancarSeHouverErros(validarNovoCartao(cartao))
    atualizarCartao(banco, cartao)
  })

  ipcMain.handle(CANAIS_CARTOES.excluirCartao, (_evento, id: number) => excluirCartao(banco, id))

  ipcMain.handle(CANAIS_CARTOES.listarVinculos, () => listarVinculos(banco))

  ipcMain.handle(CANAIS_CARTOES.registrarCompra, (_evento, compra: NovaCompraNoCartao) => {
    lancarSeHouverErros(validarNovaCompra(compra))
    return registrarCompraNoCartao(banco, compra)
  })

  ipcMain.handle(CANAIS_CARTOES.listarAjustes, () => listarAjustes(banco))

  ipcMain.handle(CANAIS_CARTOES.salvarAjuste, (_evento, ajuste: AjusteDeFechamento) => {
    lancarSeHouverErros(validarAjuste(ajuste))
    salvarAjuste(banco, ajuste)
  })

  ipcMain.handle(
    CANAIS_CARTOES.removerAjuste,
    (_evento, cartaoId: number, mesDoVencimento: string) =>
      removerAjuste(banco, cartaoId, mesDoVencimento)
  )

  ipcMain.handle(CANAIS_CARTOES.excluirCompra, (_evento, grupoId: number) =>
    excluirCompraNoCartao(banco, grupoId)
  )
}
