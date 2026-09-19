import { writeFileSync } from 'fs'
import { extname } from 'path'
import { ipcMain } from 'electron'
import { CANAIS_ARQUIVOS } from '../../shared/arquivos/tipos'
import { escolherOndeSalvar } from '../janelas/escolherArquivo'

const NOME_DO_FILTRO_PADRAO = 'Arquivo de texto'

export function registrarIpcArquivos(): void {
  ipcMain.handle(
    CANAIS_ARQUIVOS.salvarTexto,
    async (_evento, nomeSugerido: string, conteudo: string): Promise<string | null> => {
      const extensao = extname(nomeSugerido).replace('.', '')
      const filtros = extensao ? [{ name: NOME_DO_FILTRO_PADRAO, extensions: [extensao] }] : []

      const caminho = await escolherOndeSalvar(nomeSugerido, filtros)
      if (caminho === null) return null

      writeFileSync(caminho, conteudo, 'utf-8')
      return caminho
    }
  )
}
