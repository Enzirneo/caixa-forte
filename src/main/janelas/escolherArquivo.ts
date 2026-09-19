import { BrowserWindow, dialog } from 'electron'

interface FiltroDeArquivo {
  name: string
  extensions: string[]
}

export async function escolherOndeSalvar(
  nomeSugerido: string,
  filtros: FiltroDeArquivo[]
): Promise<string | null> {
  const opcoes = { defaultPath: nomeSugerido, filters: filtros }
  const janela = BrowserWindow.getFocusedWindow()
  const escolha = janela
    ? await dialog.showSaveDialog(janela, opcoes)
    : await dialog.showSaveDialog(opcoes)
  return escolha.canceled || !escolha.filePath ? null : escolha.filePath
}

export async function escolherPasta(): Promise<string | null> {
  const opcoes = { properties: ['openDirectory' as const, 'createDirectory' as const] }
  const janela = BrowserWindow.getFocusedWindow()
  const escolha = janela
    ? await dialog.showOpenDialog(janela, opcoes)
    : await dialog.showOpenDialog(opcoes)
  return escolha.canceled || escolha.filePaths.length === 0 ? null : escolha.filePaths[0]
}

export async function escolherArquivoParaAbrir(filtros: FiltroDeArquivo[]): Promise<string | null> {
  const opcoes = { properties: ['openFile' as const], filters: filtros }
  const janela = BrowserWindow.getFocusedWindow()
  const escolha = janela
    ? await dialog.showOpenDialog(janela, opcoes)
    : await dialog.showOpenDialog(opcoes)
  return escolha.canceled || escolha.filePaths.length === 0 ? null : escolha.filePaths[0]
}
