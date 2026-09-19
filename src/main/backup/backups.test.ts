import Database from 'better-sqlite3'
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { executarMigracoes, type Migracao } from '../banco/migracoes/executarMigracoes'
import {
  PREFIXO_DO_BACKUP_ANTES_DE_RESTAURAR,
  PREFIXO_DO_BACKUP_AUTOMATICO,
  extrairInstanteDoNome,
  montarInstanteParaNomeDeArquivo
} from './arquivosDeBackup'
import { criarBackupAutomaticoSeNecessario, precisaDeBackupAutomatico } from './backupAutomatico'
import {
  criarBackupEm,
  restaurarBancoAPartirDoBackup,
  validarArquivoDeBackup
} from './backupManual'

const VERSAO_SUPORTADA = 3
const migracoes: Migracao[] = [
  {
    versao: 1,
    descricao: 'tabelas',
    sql: 'CREATE TABLE lancamentos (id INTEGER PRIMARY KEY, descricao TEXT)'
  }
]

function nomeAutomatico(agora: Date): string {
  return `${PREFIXO_DO_BACKUP_AUTOMATICO}${montarInstanteParaNomeDeArquivo(agora)}.db`
}

describe('nomes de backup', () => {
  it('lê de volta o instante escrito no nome do arquivo', () => {
    const instante = new Date('2026-09-19T03:00:24.371Z')

    expect(extrairInstanteDoNome(nomeAutomatico(instante), PREFIXO_DO_BACKUP_AUTOMATICO)).toEqual(
      instante
    )
  })

  it('devolve nulo para nome que não segue o padrão', () => {
    expect(extrairInstanteDoNome('qualquer.db', PREFIXO_DO_BACKUP_AUTOMATICO)).toBeNull()
    expect(
      extrairInstanteDoNome(`${PREFIXO_DO_BACKUP_AUTOMATICO}lixo.db`, PREFIXO_DO_BACKUP_AUTOMATICO)
    ).toBeNull()
  })
})

describe('precisaDeBackupAutomatico', () => {
  const agora = new Date('2026-09-19T12:00:00.000Z')

  it('precisa quando ainda não existe nenhum', () => {
    expect(precisaDeBackupAutomatico([], agora)).toBe(true)
  })

  it('não precisa quando o último tem menos de 7 dias', () => {
    const seisDiasAtras = new Date('2026-09-13T12:00:01.000Z')

    expect(precisaDeBackupAutomatico([nomeAutomatico(seisDiasAtras)], agora)).toBe(false)
  })

  it('precisa quando o último tem 7 dias ou mais', () => {
    const seteDiasAtras = new Date('2026-09-12T12:00:00.000Z')

    expect(precisaDeBackupAutomatico([nomeAutomatico(seteDiasAtras)], agora)).toBe(true)
  })

  it('olha o mais recente, não o primeiro da lista', () => {
    const antigo = nomeAutomatico(new Date('2026-08-01T00:00:00.000Z'))
    const recente = nomeAutomatico(new Date('2026-09-18T00:00:00.000Z'))

    expect(precisaDeBackupAutomatico([antigo, recente], agora)).toBe(false)
  })
})

describe('backups em arquivo', () => {
  let pasta: string
  let banco: Database.Database

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'cf-bk-'))
    banco = new Database(join(pasta, 'principal.db'))
    executarMigracoes(banco, migracoes)
    banco.prepare("INSERT INTO lancamentos (descricao) VALUES ('atual')").run()
  })

  afterEach(() => {
    if (banco.open) banco.close()
    rmSync(pasta, { recursive: true, force: true })
  })

  describe('criarBackupAutomaticoSeNecessario', () => {
    const pastaDeBackups = (): string => join(pasta, 'backups')

    it('cria o primeiro backup e não cria outro dentro de 7 dias', () => {
      const agora = new Date('2026-09-19T12:00:00.000Z')

      const primeiro = criarBackupAutomaticoSeNecessario(banco, pastaDeBackups(), agora)
      const segundo = criarBackupAutomaticoSeNecessario(
        banco,
        pastaDeBackups(),
        new Date('2026-09-22T12:00:00.000Z')
      )

      expect(primeiro).not.toBeNull()
      expect(segundo).toBeNull()
      expect(readdirSync(pastaDeBackups())).toHaveLength(1)
    })

    it('a cópia contém os dados do banco', () => {
      const caminho = criarBackupAutomaticoSeNecessario(banco, pastaDeBackups()) as string

      const copia = new Database(caminho, { readonly: true })
      expect(copia.prepare('SELECT descricao FROM lancamentos').all()).toEqual([
        { descricao: 'atual' }
      ])
      copia.close()
    })

    it('guarda só os 8 mais recentes', () => {
      for (let semana = 0; semana < 10; semana++) {
        const agora = new Date(Date.UTC(2026, 0, 1 + semana * 7, 12))
        criarBackupAutomaticoSeNecessario(banco, pastaDeBackups(), agora)
      }

      const nomes = readdirSync(pastaDeBackups()).sort()
      expect(nomes).toHaveLength(8)
      expect(nomes[0]).toContain('2026-01-15')
    })
  })

  describe('validarArquivoDeBackup', () => {
    it('aceita um backup feito pelo próprio app', () => {
      const destino = join(pasta, 'meu-backup.db')
      criarBackupEm(banco, destino)

      expect(validarArquivoDeBackup(destino, VERSAO_SUPORTADA)).toEqual({ valido: true, versao: 1 })
    })

    it('recusa arquivo que não é um banco', () => {
      const texto = join(pasta, 'texto.db')
      writeFileSync(texto, 'isto não é um banco de dados sqlite, só um texto qualquer')

      expect(validarArquivoDeBackup(texto, VERSAO_SUPORTADA)).toMatchObject({ valido: false })
    })

    it('recusa arquivo que não existe', () => {
      expect(validarArquivoDeBackup(join(pasta, 'nao-existe.db'), VERSAO_SUPORTADA)).toMatchObject({
        valido: false
      })
    })

    it('recusa banco de outro programa', () => {
      const outro = join(pasta, 'outro.db')
      const bancoDeOutro = new Database(outro)
      bancoDeOutro.exec('CREATE TABLE coisas (id INTEGER)')
      bancoDeOutro.close()

      const resultado = validarArquivoDeBackup(outro, VERSAO_SUPORTADA)

      expect(resultado).toMatchObject({ valido: false })
    })

    it('recusa backup de uma versão mais nova do que o app entende', () => {
      const destino = join(pasta, 'futuro.db')
      criarBackupEm(banco, destino)
      const futuro = new Database(destino)
      futuro.prepare("INSERT INTO migracoes_aplicadas (versao, descricao) VALUES (99, 'x')").run()
      futuro.close()

      const resultado = validarArquivoDeBackup(destino, VERSAO_SUPORTADA)

      expect(resultado).toMatchObject({
        valido: false,
        motivo: expect.stringContaining('mais nova')
      })
    })
  })

  describe('restaurarBancoAPartirDoBackup', () => {
    function criarBackupComDado(descricao: string): string {
      const caminho = join(pasta, `${descricao}.db`)
      const outroBanco = new Database(caminho)
      executarMigracoes(outroBanco, migracoes)
      outroBanco.prepare('INSERT INTO lancamentos (descricao) VALUES (?)').run(descricao)
      outroBanco.close()
      return caminho
    }

    it('troca os dados atuais pelos do backup e guarda uma cópia dos atuais', () => {
      const caminhoDoBanco = join(pasta, 'principal.db')
      const pastaDeBackups = join(pasta, 'backups')
      const backup = criarBackupComDado('do-backup')

      const resultado = restaurarBancoAPartirDoBackup(
        banco,
        backup,
        caminhoDoBanco,
        pastaDeBackups,
        VERSAO_SUPORTADA
      )

      expect(resultado.valido).toBe(true)
      expect(banco.open).toBe(false)

      const restaurado = new Database(caminhoDoBanco, { readonly: true })
      expect(restaurado.prepare('SELECT descricao FROM lancamentos').all()).toEqual([
        { descricao: 'do-backup' }
      ])
      restaurado.close()

      const [copiaDosAtuais] = readdirSync(pastaDeBackups).filter((nome) =>
        nome.startsWith(PREFIXO_DO_BACKUP_ANTES_DE_RESTAURAR)
      )
      const copia = new Database(join(pastaDeBackups, copiaDosAtuais), { readonly: true })
      expect(copia.prepare('SELECT descricao FROM lancamentos').all()).toEqual([
        { descricao: 'atual' }
      ])
      copia.close()
    })

    it('com arquivo inválido não mexe em nada', () => {
      const caminhoDoBanco = join(pasta, 'principal.db')
      const lixo = join(pasta, 'lixo.db')
      writeFileSync(lixo, 'nada de banco aqui')

      const resultado = restaurarBancoAPartirDoBackup(
        banco,
        lixo,
        caminhoDoBanco,
        join(pasta, 'backups'),
        VERSAO_SUPORTADA
      )

      expect(resultado.valido).toBe(false)
      expect(banco.open).toBe(true)
      expect(existsSync(join(pasta, 'backups'))).toBe(false)
      expect(banco.prepare('SELECT descricao FROM lancamentos').all()).toEqual([
        { descricao: 'atual' }
      ])
    })
  })
})
