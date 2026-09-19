const DELIMITADOR_DO_MODELO = ';'
const MARCA_DE_ORDEM_DE_BYTES = '﻿'

const CABECALHO = ['Data', 'Descrição', 'Valor', 'Tipo', 'Categoria']
const EXEMPLOS = [
  ['05/09/2026', 'Salário', '5000,00', 'receita', 'Renda'],
  ['18/09/2026', 'Mercado', '150,00', 'despesa', 'Alimentação']
]

export const NOME_DO_ARQUIVO_MODELO = 'modelo-caixa-forte.csv'

// A marca de ordem de bytes faz o Excel abrir os acentos corretamente.
export function montarCsvDoModelo(): string {
  const linhas = [CABECALHO, ...EXEMPLOS].map((celulas) => celulas.join(DELIMITADOR_DO_MODELO))
  return MARCA_DE_ORDEM_DE_BYTES + linhas.join('\r\n') + '\r\n'
}
