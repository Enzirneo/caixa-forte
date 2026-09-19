import type { Database } from 'better-sqlite3'
import { formatarNomeDaCategoria } from '../../../shared/categorias/nomeDaCategoria'

interface LinhaCategoria {
  id: number
  nome: string
}

// Corrige as categorias que já foram salvas em minúscula. A chave (usada para reconhecer
// "Comida" e "comida" como a mesma) não muda, então nenhum lançamento perde a ligação.
export function capitalizarNomesDasCategorias(banco: Database): void {
  const categorias = banco.prepare('SELECT id, nome FROM categorias').all() as LinhaCategoria[]
  const atualizar = banco.prepare('UPDATE categorias SET nome = ? WHERE id = ?')

  for (const categoria of categorias) {
    const nomeCorrigido = formatarNomeDaCategoria(categoria.nome)
    if (nomeCorrigido !== categoria.nome) atualizar.run(nomeCorrigido, categoria.id)
  }
}
