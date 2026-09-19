import type { Database } from 'better-sqlite3'
import { gerarChaveDaCategoria, normalizarEspacos } from '../../shared/categorias/nomeDaCategoria'

interface LinhaCategoria {
  id: number
}

export function obterOuCriarCategoria(banco: Database, nome: string): number {
  const nomeLimpo = normalizarEspacos(nome)
  const chave = gerarChaveDaCategoria(nomeLimpo)

  const existente = banco.prepare('SELECT id FROM categorias WHERE chave = ?').get(chave) as
    LinhaCategoria | undefined
  if (existente) return existente.id

  const { lastInsertRowid } = banco
    .prepare('INSERT INTO categorias (nome, chave) VALUES (?, ?)')
    .run(nomeLimpo, chave)
  return Number(lastInsertRowid)
}
