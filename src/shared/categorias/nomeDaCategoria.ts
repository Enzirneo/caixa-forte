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

export function capitalizarPrimeiraLetra(texto: string): string {
  const [primeira, ...restante] = texto
  return primeira === undefined ? texto : primeira.toLocaleUpperCase('pt-BR') + restante.join('')
}

// O nome que vai para o banco: sem espaços sobrando e com a primeira letra sempre maiúscula.
export function formatarNomeDaCategoria(nome: string): string {
  return capitalizarPrimeiraLetra(normalizarEspacos(nome))
}

export function canonizarNomeDaCategoria(nome: string, nomesExistentes: string[]): string {
  const chave = gerarChaveDaCategoria(nome)
  const existente = nomesExistentes.find((candidato) => gerarChaveDaCategoria(candidato) === chave)
  return existente ?? formatarNomeDaCategoria(nome)
}

export function listarCategoriasEmUso(lancamentos: Lancamento[]): string[] {
  const nomePorChave = new Map<string, string>()
  for (const { categoria } of lancamentos) {
    const chave = gerarChaveDaCategoria(categoria)
    if (!nomePorChave.has(chave)) nomePorChave.set(chave, normalizarEspacos(categoria))
  }
  return [...nomePorChave.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

// Sugestões que contêm o que foi digitado, sem ligar para maiúscula nem acento.
export function filtrarSugestoesDeCategoria(sugestoes: string[], textoDigitado: string): string[] {
  const chaveDigitada = gerarChaveDaCategoria(textoDigitado)
  if (chaveDigitada === '') return sugestoes
  return sugestoes.filter((sugestao) => gerarChaveDaCategoria(sugestao).includes(chaveDigitada))
}
