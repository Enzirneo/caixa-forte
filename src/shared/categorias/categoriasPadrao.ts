import type { Lancamento, TipoDoFormulario } from '../lancamentos/tipos'
import { gerarChaveDaCategoria, listarCategoriasEmUso } from './nomeDaCategoria'

// Reembolso é uma categoria só de receita, com regra própria: abate uma despesa já lançada.
export const CATEGORIA_REEMBOLSO = 'Reembolso'

export const CATEGORIAS_PADRAO_DE_DESPESA = [
  'Assinatura',
  'Comida',
  'Compras',
  'Educação',
  'Entretenimento',
  'Lazer',
  'Moradia',
  'Saúde',
  'Transporte',
  'Outros'
]

export const CATEGORIAS_PADRAO_DE_RECEITA = ['Freelance', 'Rendimento', 'Salário', 'Outros']

const CHAVE_DO_REEMBOLSO = gerarChaveDaCategoria(CATEGORIA_REEMBOLSO)

export function ehCategoriaDeReembolso(categoria: string): boolean {
  return gerarChaveDaCategoria(categoria) === CHAVE_DO_REEMBOLSO
}

function juntarSemRepetir(nomes: string[]): string[] {
  const nomePorChave = new Map<string, string>()
  for (const nome of nomes) {
    const chave = gerarChaveDaCategoria(nome)
    if (!nomePorChave.has(chave)) nomePorChave.set(chave, nome)
  }
  return [...nomePorChave.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

// As categorias prontas do tipo escolhido mais as que a pessoa já usou nele.
// "Reembolso" só é oferecida na receita, e só onde um reembolso pode ser lançado.
export function montarSugestoesDeCategoria(
  tipo: TipoDoFormulario,
  lancamentos: Lancamento[],
  reembolsoDisponivel: boolean
): string[] {
  const padrao = tipo === 'despesa' ? CATEGORIAS_PADRAO_DE_DESPESA : CATEGORIAS_PADRAO_DE_RECEITA
  const emUso = listarCategoriasEmUso(lancamentos.filter((lancamento) => lancamento.tipo === tipo))
  const semReembolso = juntarSemRepetir([...emUso, ...padrao]).filter(
    (nome) => !ehCategoriaDeReembolso(nome)
  )
  return tipo === 'receita' && reembolsoDisponivel
    ? [CATEGORIA_REEMBOLSO, ...semReembolso]
    : semReembolso
}
