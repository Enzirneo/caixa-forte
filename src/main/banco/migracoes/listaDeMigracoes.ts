import { migrarCategoriasParaTabela } from './categoriasEmTabela'
import type { Migracao } from './executarMigracoes'

const AGORA_COM_MILISSEGUNDOS = "strftime('%Y-%m-%d %H:%M:%f', 'now')"

export const listaDeMigracoes: Migracao[] = [
  {
    versao: 1,
    descricao: 'cria tabela de lançamentos',
    sql: `
      CREATE TABLE lancamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT NOT NULL,
        valor_centavos INTEGER NOT NULL CHECK (valor_centavos > 0),
        data TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
        categoria TEXT NOT NULL
      )
    `
  },
  {
    versao: 2,
    descricao: 'registra alteração dos lançamentos e cria fechamentos de mês',
    sql: `
      ALTER TABLE lancamentos ADD COLUMN alterado_em TEXT NOT NULL DEFAULT '';
      UPDATE lancamentos SET alterado_em = ${AGORA_COM_MILISSEGUNDOS};
      CREATE TABLE fechamentos_meses (
        mes TEXT PRIMARY KEY,
        fechado_em TEXT NOT NULL,
        receitas_centavos INTEGER NOT NULL,
        despesas_centavos INTEGER NOT NULL
      );
    `
  },
  {
    versao: 3,
    descricao: 'cria destinos e movimentações de investimento',
    sql: `
      CREATE TABLE destinos_investimento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('investimento', 'poupanca', 'caixinha')),
        taxa_rendimento_centesimos INTEGER CHECK (taxa_rendimento_centesimos >= 0),
        periodicidade_taxa TEXT CHECK (periodicidade_taxa IN ('mensal', 'anual')),
        CHECK ((taxa_rendimento_centesimos IS NULL) = (periodicidade_taxa IS NULL))
      );
      CREATE TABLE movimentacoes_investimento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        destino_id INTEGER NOT NULL REFERENCES destinos_investimento (id),
        tipo TEXT NOT NULL CHECK (tipo IN ('aporte', 'resgate')),
        valor_centavos INTEGER NOT NULL CHECK (valor_centavos > 0),
        data TEXT NOT NULL
      );
    `
  },
  {
    versao: 4,
    descricao: 'passa as categorias dos lançamentos para uma tabela própria',
    executar: migrarCategoriasParaTabela
  },
  {
    versao: 5,
    descricao: 'cria lançamentos recorrentes e o registro do que já foi gerado',
    sql: `
      CREATE TABLE recorrencias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT NOT NULL,
        valor_centavos INTEGER NOT NULL CHECK (valor_centavos > 0),
        tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
        categoria_id INTEGER NOT NULL REFERENCES categorias (id),
        dia_do_mes INTEGER NOT NULL CHECK (dia_do_mes BETWEEN 1 AND 31),
        mes_de_inicio TEXT NOT NULL,
        mes_de_fim TEXT,
        ativa INTEGER NOT NULL DEFAULT 1 CHECK (ativa IN (0, 1))
      );
      CREATE TABLE recorrencias_geradas (
        recorrencia_id INTEGER NOT NULL REFERENCES recorrencias (id) ON DELETE CASCADE,
        competencia TEXT NOT NULL,
        PRIMARY KEY (recorrencia_id, competencia)
      );
    `
  },
  {
    versao: 6,
    descricao: 'cria cartões de crédito e o vínculo das parcelas com os lançamentos',
    sql: `
      CREATE TABLE cartoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        dia_de_fechamento INTEGER NOT NULL CHECK (dia_de_fechamento BETWEEN 1 AND 31),
        dia_de_vencimento INTEGER NOT NULL CHECK (dia_de_vencimento BETWEEN 1 AND 31),
        limite_centavos INTEGER CHECK (limite_centavos IS NULL OR limite_centavos > 0)
      );
      CREATE TABLE compras_no_cartao (
        lancamento_id INTEGER PRIMARY KEY REFERENCES lancamentos (id) ON DELETE CASCADE,
        cartao_id INTEGER NOT NULL REFERENCES cartoes (id),
        grupo_id INTEGER NOT NULL,
        data_da_compra TEXT NOT NULL,
        parcela_numero INTEGER NOT NULL,
        parcelas_total INTEGER NOT NULL
      );
      CREATE INDEX indice_compras_no_cartao_grupo ON compras_no_cartao (grupo_id);
      CREATE INDEX indice_compras_no_cartao_cartao ON compras_no_cartao (cartao_id);
    `
  }
]
