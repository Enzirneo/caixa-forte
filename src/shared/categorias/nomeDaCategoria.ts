import type { Lancamento } from '../lancamentos/tipos'

export const CATEGORIA_PARA_NOME_VAZIO = 'Sem categoria'

export function normalizarEspacos(nome: string): string {
  return nome.trim().replace(/\s+/g, ' ')
}

export function gerarChaveDaCategoria(nome: string): string {
  return normalizarEspacos(nome)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export function canonizarNomeDaCategoria(nome: string, nomesExistentes: string[]): string {
  const nomeLimpo = normalizarEspacos(nome)
  const chave = gerarChaveDaCategoria(nomeLimpo)
  const existente = nomesExistentes.find((candidato) => gerarChaveDaCategoria(candidato) === chave)
  return existente ?? nomeLimpo
}

export function listarCategoriasEmUso(lancamentos: Lancamento[]): string[] {
  const nomePorChave = new Map<string, string>()
  for (const { categoria } of lancamentos) {
    const chave = gerarChaveDaCategoria(categoria)
    if (!nomePorChave.has(chave)) nomePorChave.set(chave, normalizarEspacos(categoria))
  }
  return [...nomePorChave.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
