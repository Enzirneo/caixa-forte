import { canonizarNomeDaCategoria } from '../categorias/nomeDaCategoria'
import type { LinhaInterpretada } from './tipos'

// Mostra na prévia a mesma grafia que será gravada: a de uma categoria que já existe ou,
// para categorias novas, a da primeira linha do lote que a usa.
export function canonizarCategoriasDoLote(
  linhas: LinhaInterpretada[],
  categoriasExistentes: string[]
): LinhaInterpretada[] {
  const nomesConhecidos = [...categoriasExistentes]

  return linhas.map((linha) => {
    if (linha.lancamento === null) return linha

    const categoria = canonizarNomeDaCategoria(linha.lancamento.categoria, nomesConhecidos)
    if (!nomesConhecidos.includes(categoria)) nomesConhecidos.push(categoria)
    return { ...linha, lancamento: { ...linha.lancamento, categoria } }
  })
}
