import type { Database } from 'better-sqlite3'
import {
  CATEGORIA_PARA_NOME_VAZIO,
  gerarChaveDaCategoria,
  normalizarEspacos
} from '../../../shared/categorias/nomeDaCategoria'

interface LinhaComCategoriaEmTexto {
  id: number
  categoria: string
}

// Junta as variações já digitadas ("Comida", "comida", " Comida ") em uma categoria só,
// mantendo a grafia do lançamento mais antigo, e liga cada lançamento a ela.
export function migrarCategoriasParaTabela(banco: Database): void {
  banco.exec(`
    CREATE TABLE categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      chave TEXT NOT NULL UNIQUE
    );
    ALTER TABLE lancamentos ADD COLUMN categoria_id INTEGER REFERENCES categorias (id);
  `)

  const inserirCategoria = banco.prepare('INSERT INTO categorias (nome, chave) VALUES (?, ?)')
  const ligarLancamento = banco.prepare('UPDATE lancamentos SET categoria_id = ? WHERE id = ?')
  const idPorChave = new Map<string, number>()

  const lancamentos = banco
    .prepare('SELECT id, categoria FROM lancamentos ORDER BY id')
    .all() as LinhaComCategoriaEmTexto[]

  for (const lancamento of lancamentos) {
    const nome = normalizarEspacos(lancamento.categoria) || CATEGORIA_PARA_NOME_VAZIO
    const chave = gerarChaveDaCategoria(nome)

    let categoriaId = idPorChave.get(chave)
    if (categoriaId === undefined) {
      categoriaId = Number(inserirCategoria.run(nome, chave).lastInsertRowid)
      idPorChave.set(chave, categoriaId)
    }
    ligarLancamento.run(categoriaId, lancamento.id)
  }

  banco.exec('ALTER TABLE lancamentos DROP COLUMN categoria')
}
