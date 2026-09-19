import type { CelulaDaPlanilha } from './tipos'

const DELIMITADORES_POSSIVEIS = [';', '\t', ','] as const
const DELIMITADOR_PADRAO = ';'
const MARCA_DE_ORDEM_DE_BYTES = '﻿'
const ASPAS = '"'

function detectarDelimitador(primeiraLinha: string): string {
  const contagens = DELIMITADORES_POSSIVEIS.map((delimitador) => ({
    delimitador,
    quantidade: primeiraLinha.split(delimitador).length - 1
  }))
  const maisFrequente = contagens.reduce((melhor, atual) =>
    atual.quantidade > melhor.quantidade ? atual : melhor
  )
  return maisFrequente.quantidade > 0 ? maisFrequente.delimitador : DELIMITADOR_PADRAO
}

export function lerCsv(texto: string): CelulaDaPlanilha[][] {
  const conteudo = texto.replace(MARCA_DE_ORDEM_DE_BYTES, '')
  const delimitador = detectarDelimitador(conteudo.split(/\r?\n/)[0] ?? '')

  const linhas: string[][] = []
  let linhaAtual: string[] = []
  let celulaAtual = ''
  let dentroDeAspas = false

  const fecharCelula = (): void => {
    linhaAtual.push(celulaAtual)
    celulaAtual = ''
  }
  const fecharLinha = (): void => {
    fecharCelula()
    linhas.push(linhaAtual)
    linhaAtual = []
  }

  for (let posicao = 0; posicao < conteudo.length; posicao++) {
    const caractere = conteudo[posicao]

    if (dentroDeAspas) {
      if (caractere === ASPAS && conteudo[posicao + 1] === ASPAS) {
        celulaAtual += ASPAS
        posicao++
      } else if (caractere === ASPAS) {
        dentroDeAspas = false
      } else {
        celulaAtual += caractere
      }
    } else if (caractere === ASPAS) {
      dentroDeAspas = true
    } else if (caractere === delimitador) {
      fecharCelula()
    } else if (caractere === '\n') {
      fecharLinha()
    } else if (caractere !== '\r') {
      celulaAtual += caractere
    }
  }
  if (celulaAtual !== '' || linhaAtual.length > 0) fecharLinha()

  return linhas
}
