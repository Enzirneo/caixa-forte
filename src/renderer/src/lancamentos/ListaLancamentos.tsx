import { formatarDataIsoComoBrasileira } from '../../../shared/datas/dataIso'
import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import { foiAlteradoAposFechamento } from '../../../shared/fechamentos/regrasDeFechamento'
import type { FechamentoMes } from '../../../shared/fechamentos/tipos'
import type { OrdenacaoDeLancamentos } from '../../../shared/lancamentos/filtrarLancamentos'
import type { Lancamento } from '../../../shared/lancamentos/tipos'
import { CATEGORIA_REEMBOLSO } from '../../../shared/categorias/categoriasPadrao'
import { BotaoExcluirComConfirmacao } from '../compartilhado/BotaoExcluirComConfirmacao'

interface Props {
  lancamentos: Lancamento[]
  filtrando: boolean
  ordenacao: OrdenacaoDeLancamentos
  aoOrdenar: (ordenacao: OrdenacaoDeLancamentos) => void
  fechamentos: FechamentoMes[]
  rotulosDeCompra: Map<number, string>
  rotulosDeReembolso: Map<number, string>
  aoEditar: (lancamento: Lancamento) => void
  aoExcluir: (id: number) => Promise<void>
}

type CampoOrdenavel = 'data' | 'categoria' | 'valor'

interface PropsDoCabecalho {
  rotulo: string
  campo: CampoOrdenavel
  ordenacao: OrdenacaoDeLancamentos
  aoOrdenar: (ordenacao: OrdenacaoDeLancamentos) => void
  alinhadoADireita?: boolean
}

// Primeiro clique ordena de forma crescente (ou mais novo, para data); clicar de novo inverte.
function CabecalhoOrdenavel({
  rotulo,
  campo,
  ordenacao,
  aoOrdenar,
  alinhadoADireita
}: PropsDoCabecalho): React.JSX.Element {
  const ativo = ordenacao.startsWith(`${campo}-`)
  const crescente = ordenacao.endsWith('-asc')
  const proxima = `${campo}-${ativo && !crescente ? 'asc' : 'desc'}` as OrdenacaoDeLancamentos
  const seta = ativo ? (crescente ? ' ▲' : ' ▼') : ''
  return (
    <th className={alinhadoADireita ? 'numero' : undefined}>
      <button type="button" className="cabecalho-ordenavel" onClick={() => aoOrdenar(proxima)}>
        {rotulo}
        {seta}
      </button>
    </th>
  )
}

export function ListaLancamentos({
  lancamentos,
  filtrando,
  ordenacao,
  aoOrdenar,
  fechamentos,
  rotulosDeCompra,
  rotulosDeReembolso,
  aoEditar,
  aoExcluir
}: Props): React.JSX.Element {
  if (lancamentos.length === 0) {
    return (
      <p className="vazio">
        {filtrando
          ? 'Nenhum lançamento encontrado com esses filtros.'
          : 'Nenhum lançamento neste mês.'}
      </p>
    )
  }

  return (
    <table className="lista">
      <thead>
        <tr>
          <CabecalhoOrdenavel
            rotulo="Data"
            campo="data"
            ordenacao={ordenacao}
            aoOrdenar={aoOrdenar}
          />
          <th>Descrição</th>
          <CabecalhoOrdenavel
            rotulo="Categoria"
            campo="categoria"
            ordenacao={ordenacao}
            aoOrdenar={aoOrdenar}
          />
          <CabecalhoOrdenavel
            rotulo="Valor"
            campo="valor"
            ordenacao={ordenacao}
            aoOrdenar={aoOrdenar}
            alinhadoADireita
          />
          <th />
        </tr>
      </thead>
      <tbody>
        {lancamentos.map((lancamento) => (
          <tr key={lancamento.id}>
            <td>{formatarDataIsoComoBrasileira(lancamento.data)}</td>
            <td>
              {lancamento.descricao}
              {foiAlteradoAposFechamento(lancamento, fechamentos) && (
                <span className="ressalva"> · lançado após o fechamento</span>
              )}
              {lancamento.recorrenciaId != null && (
                <span className="rotulo-de-compra">Recorrente</span>
              )}
              {rotulosDeReembolso.has(lancamento.id) && (
                <span className="rotulo-de-compra">{rotulosDeReembolso.get(lancamento.id)}</span>
              )}
              {rotulosDeCompra.has(lancamento.id) && (
                <span className="rotulo-de-compra">{rotulosDeCompra.get(lancamento.id)}</span>
              )}
            </td>
            <td>{lancamento.tipo === 'reembolso' ? CATEGORIA_REEMBOLSO : lancamento.categoria}</td>
            <td className={`numero ${lancamento.tipo}`}>
              {formatarCentavosComoReal(lancamento.valorCentavos)}
            </td>
            <td className="acoes-linha">
              <button className="secundario" onClick={() => aoEditar(lancamento)}>
                Editar
              </button>
              <BotaoExcluirComConfirmacao aoConfirmar={() => aoExcluir(lancamento.id)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
