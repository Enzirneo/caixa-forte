import type { Database } from 'better-sqlite3'
import { app, ipcMain, shell } from 'electron'
import { obterDataIsoDeHoje } from '../../shared/datas/dataIso'
import { CANAIS_BACKUP } from '../../shared/backup/canais'
import type { InformacoesDeBackup, ResultadoDaRestauracao } from '../../shared/backup/tipos'
import { obterCaminhoDoBanco, obterPastaDeBackups } from '../banco/caminhos'
import { listaDeMigracoes } from '../banco/migracoes/listaDeMigracoes'
import { escolherArquivoParaAbrir, escolherOndeSalvar } from '../janelas/escolherArquivo'
import {
  PREFIXO_DO_BACKUP_AUTOMATICO,
  extrairInstanteDoNome,
  garantirPasta,
  listarBackupsDoMaisNovoAoMaisAntigo
} from './arquivosDeBackup'
import { criarBackupEm, restaurarBancoAPartirDoBackup } from './backupManual'

const FILTRO_DE_BANCO = [{ name: 'Banco do Caixa Forte', extensions: ['db'] }]
const ESPERA_ANTES_DE_REINICIAR_EM_MILISSEGUNDOS = 500
const VERSAO_MAIS_RECENTE_DO_BANCO = Math.max(
  ...listaDeMigracoes.map((migracao) => migracao.versao)
)

function montarInformacoes(): InformacoesDeBackup {
  const pastaDeBackups = obterPastaDeBackups()
  const nomes = listarBackupsDoMaisNovoAoMaisAntigo(pastaDeBackups, PREFIXO_DO_BACKUP_AUTOMATICO)
  const automaticos = nomes.flatMap((nome) => {
    const instante = extrairInstanteDoNome(nome, PREFIXO_DO_BACKUP_AUTOMATICO)
    return instante ? [{ nome, criadoEm: instante.toISOString() }] : []
  })
  return { pastaDeBackups, automaticos }
}

async function criarBackupEscolhendoOndeSalvar(banco: Database): Promise<string | null> {
  const nomeSugerido = `caixa-forte-backup-${obterDataIsoDeHoje()}.db`
  const caminho = await escolherOndeSalvar(nomeSugerido, FILTRO_DE_BANCO)
  if (caminho === null) return null

  criarBackupEm(banco, caminho)
  return caminho
}

async function restaurarEscolhendoArquivo(banco: Database): Promise<ResultadoDaRestauracao> {
  const caminhoDoBackup = await escolherArquivoParaAbrir(FILTRO_DE_BANCO)
  if (caminhoDoBackup === null) return 'cancelado'

  const resultado = restaurarBancoAPartirDoBackup(
    banco,
    caminhoDoBackup,
    obterCaminhoDoBanco(),
    obterPastaDeBackups(),
    VERSAO_MAIS_RECENTE_DO_BANCO
  )
  if (!resultado.valido) throw new Error(resultado.motivo)

  setTimeout(() => {
    app.relaunch()
    app.exit(0)
  }, ESPERA_ANTES_DE_REINICIAR_EM_MILISSEGUNDOS)
  return 'reiniciando'
}

export function registrarIpcBackup(banco: Database): void {
  ipcMain.handle(CANAIS_BACKUP.informacoes, () => montarInformacoes())
  ipcMain.handle(CANAIS_BACKUP.criar, () => criarBackupEscolhendoOndeSalvar(banco))
  ipcMain.handle(CANAIS_BACKUP.restaurar, () => restaurarEscolhendoArquivo(banco))
  ipcMain.handle(CANAIS_BACKUP.abrirPasta, async () => {
    const pasta = obterPastaDeBackups()
    garantirPasta(pasta)
    await shell.openPath(pasta)
  })
}
