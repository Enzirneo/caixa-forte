import type { Database } from 'better-sqlite3'
import { app, ipcMain, shell } from 'electron'
import { CANAIS_BACKUP } from '../../shared/backup/canais'
import type { InformacoesDeBackup, ResultadoDaRestauracao } from '../../shared/backup/tipos'
import { obterDataIsoDeHoje } from '../../shared/datas/dataIso'
import { obterCaminhoDoBanco, obterPastaDeBackups } from '../banco/caminhos'
import { listaDeMigracoes } from '../banco/migracoes/listaDeMigracoes'
import { lerConfiguracao, salvarConfiguracao } from '../configuracao/configuracaoDoApp'
import {
  escolherArquivoParaAbrir,
  escolherOndeSalvar,
  escolherPasta
} from '../janelas/escolherArquivo'
import {
  PREFIXO_DO_BACKUP_AUTOMATICO,
  extrairInstanteDoNome,
  garantirPasta,
  listarBackupsDoMaisNovoAoMaisAntigo
} from './arquivosDeBackup'
import { criarBackupAutomaticoAgora, criarBackupAutomaticoSeNecessario } from './backupAutomatico'
import { criarBackupEm, restaurarBancoAPartirDoBackup } from './backupManual'

const FILTRO_DE_BANCO = [{ name: 'Banco do Caixa Forte', extensions: ['db'] }]
const ESPERA_ANTES_DE_REINICIAR_EM_MILISSEGUNDOS = 500
const VERSAO_MAIS_RECENTE_DO_BANCO = Math.max(
  ...listaDeMigracoes.map((migracao) => migracao.versao)
)

function listarAutomaticosDe(pasta: string): { nome: string; criadoEm: string }[] {
  return listarBackupsDoMaisNovoAoMaisAntigo(pasta, PREFIXO_DO_BACKUP_AUTOMATICO).flatMap(
    (nome) => {
      const instante = extrairInstanteDoNome(nome, PREFIXO_DO_BACKUP_AUTOMATICO)
      return instante ? [{ nome, criadoEm: instante.toISOString() }] : []
    }
  )
}

function montarInformacoes(): InformacoesDeBackup {
  const pastaDeBackups = obterPastaDeBackups()
  const { pastaDeBackupExterna } = lerConfiguracao()
  const backupsExternos = pastaDeBackupExterna ? listarAutomaticosDe(pastaDeBackupExterna) : []

  return {
    pastaDeBackups,
    automaticos: listarAutomaticosDe(pastaDeBackups),
    pastaExterna: pastaDeBackupExterna,
    ultimoBackupExterno: backupsExternos[0]?.criadoEm ?? null
  }
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

function gravarNaPastaExterna<T>(gravar: () => T): T {
  try {
    return gravar()
  } catch (erro) {
    console.error('Falha ao gravar na pasta externa de backup:', erro)
    throw new Error(
      'Não consegui gravar nessa pasta. Ela existe e você tem permissão para escrever nela?'
    )
  }
}

// Escolher a pasta já faz a primeira cópia, e assim um erro (pasta sem permissão, por exemplo)
// aparece na hora, e não semanas depois.
async function escolherPastaExterna(banco: Database): Promise<InformacoesDeBackup> {
  const pasta = await escolherPasta()
  if (pasta === null) return montarInformacoes()

  gravarNaPastaExterna(() => criarBackupAutomaticoSeNecessario(banco, pasta))
  salvarConfiguracao({ pastaDeBackupExterna: pasta })
  return montarInformacoes()
}

function copiarParaPastaExterna(banco: Database): string {
  const { pastaDeBackupExterna } = lerConfiguracao()
  if (!pastaDeBackupExterna) throw new Error('Escolha primeiro a pasta para a cópia externa.')

  return gravarNaPastaExterna(() => criarBackupAutomaticoAgora(banco, pastaDeBackupExterna))
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
  ipcMain.handle(CANAIS_BACKUP.escolherPastaExterna, () => escolherPastaExterna(banco))
  ipcMain.handle(CANAIS_BACKUP.removerPastaExterna, () => {
    salvarConfiguracao({ pastaDeBackupExterna: null })
    return montarInformacoes()
  })
  ipcMain.handle(CANAIS_BACKUP.copiarParaPastaExterna, () => copiarParaPastaExterna(banco))
}
