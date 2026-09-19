import type { Database } from 'better-sqlite3'
import { obterDataIsoDeHoje } from '../../shared/datas/dataIso'
import {
  calcularDataDaOcorrencia,
  listarCompetenciasVencidas
} from '../../shared/recorrencias/regras'
import type { Recorrencia } from '../../shared/recorrencias/tipos'
import { criarCompraNoCartao } from '../cartoes/repositorioCartoes'
import {
  definirRecorrenciaDoLancamento,
  inserirLancamento
} from '../lancamentos/repositorioLancamentos'
import {
  listarCompetenciasGeradas,
  listarRecorrencias,
  registrarCompetenciaGerada
} from './repositorioRecorrencias'

// Numa recorrência de cartão, cada ocorrência é uma compra: cai na fatura certa pela data.
function criarOcorrencia(banco: Database, recorrencia: Recorrencia, competencia: string): void {
  const data = calcularDataDaOcorrencia(competencia, recorrencia.diaDoMes)
  const lancamentoId =
    recorrencia.cartaoId != null
      ? criarCompraNoCartao(banco, {
          cartaoId: recorrencia.cartaoId,
          descricao: recorrencia.descricao,
          valorTotalCentavos: recorrencia.valorCentavos,
          parcelas: 1,
          dataDaCompra: data,
          categoria: recorrencia.categoria
        })[0]
      : inserirLancamento(banco, {
          descricao: recorrencia.descricao,
          valorCentavos: recorrencia.valorCentavos,
          data,
          tipo: recorrencia.tipo,
          categoria: recorrencia.categoria
        }).id
  definirRecorrenciaDoLancamento(banco, lancamentoId, recorrencia.id)
}

function gerarPendentesDaRecorrencia(
  banco: Database,
  recorrencia: Recorrencia,
  hojeIso: string
): number {
  const jaGeradas = listarCompetenciasGeradas(banco, recorrencia.id)
  const pendentes = listarCompetenciasVencidas(recorrencia, hojeIso).filter(
    (competencia) => !jaGeradas.has(competencia)
  )

  for (const competencia of pendentes) {
    criarOcorrencia(banco, recorrencia, competencia)
    // Fica registrado mesmo se o lançamento for apagado depois, para não voltar sozinho.
    registrarCompetenciaGerada(banco, recorrencia.id, competencia)
  }
  return pendentes.length
}

export function gerarLancamentosRecorrentes(banco: Database, hojeIso: string): number {
  return banco.transaction(() =>
    listarRecorrencias(banco)
      .filter((recorrencia) => recorrencia.ativa)
      .reduce(
        (total, recorrencia) => total + gerarPendentesDaRecorrencia(banco, recorrencia, hojeIso),
        0
      )
  )()
}

// Falhar aqui (por exemplo, um dado antigo estranho) não pode impedir o app de abrir.
export function tentarGerarRecorrentesDeHoje(banco: Database): void {
  try {
    gerarLancamentosRecorrentes(banco, obterDataIsoDeHoje())
  } catch (erro) {
    console.error('Não foi possível gerar os lançamentos recorrentes:', erro)
  }
}
