import { formatarDataIsoComoBrasileira } from '../datas/dataIso'
import { formatarCentavosParaCampo } from '../dinheiro/formatarCentavosParaCampo'
import type { Lancamento } from '../lancamentos/tipos'

const DELIMITADOR = ';'
const QUEBRA_DE_LINHA = '\r\n'
const MARCA_DE_ORDEM_DE_BYTES = '﻿'
const CABECALHO = ['Data', 'Descrição', 'Valor', 'Tipo', 'Categoria']

export const NOME_SUGERIDO_DA_EXPORTACAO = 'lancamentos-caixa-forte.csv'

function escaparCelula(texto: string): string {
  const precisaDeAspas = /[;"\r\n]/.test(texto)
  return precisaDeAspas ? `"${texto.replaceAll('"', '""')}"` : texto
}

function montarLinha(lancamento: Lancamento): string[] {
  return [
    formatarDataIsoComoBrasileira(lancamento.data),
    lancamento.descricao,
    formatarCentavosParaCampo(lancamento.valorCentavos),
    lancamento.tipo,
    lancamento.categoria
  ]
}

// Mesmo formato da importação: o arquivo exportado pode ser importado de volta.
export function montarCsvDosLancamentos(lancamentos: Lancamento[]): string {
  const maisAntigosPrimeiro = [...lancamentos].sort(
    (a, b) => a.data.localeCompare(b.data) || a.id - b.id
  )
  const linhas = [CABECALHO, ...maisAntigosPrimeiro.map(montarLinha)].map((celulas) =>
    celulas.map(escaparCelula).join(DELIMITADOR)
  )
  return MARCA_DE_ORDEM_DE_BYTES + linhas.join(QUEBRA_DE_LINHA) + QUEBRA_DE_LINHA
}
