import { TrendingDown, TrendingUp } from 'lucide-react'

interface Props {
  titulo: string
  valor: string
  corDoValor?: 'receita' | 'despesa'
  detalhe?: string
  variacaoPercentual?: number | null
  // Para despesas, subir é ruim; para receitas, subir é bom.
  aumentoEhBom?: boolean
}

const TAMANHO_DO_ICONE_DE_VARIACAO = 14

export function CartaoDeIndicador({
  titulo,
  valor,
  corDoValor,
  detalhe,
  variacaoPercentual = null,
  aumentoEhBom = true
}: Props): React.JSX.Element {
  const subiu = variacaoPercentual !== null && variacaoPercentual > 0
  const caiu = variacaoPercentual !== null && variacaoPercentual < 0
  const favoravel = (subiu && aumentoEhBom) || (caiu && !aumentoEhBom)
  const Icone = caiu ? TrendingDown : TrendingUp

  return (
    <div className="indicador">
      <span className="indicador-titulo">{titulo}</span>
      <strong className={corDoValor}>{valor}</strong>
      {variacaoPercentual !== null && variacaoPercentual !== 0 && (
        <span className={`indicador-variacao ${favoravel ? 'favoravel' : 'desfavoravel'}`}>
          <Icone size={TAMANHO_DO_ICONE_DE_VARIACAO} />
          {variacaoPercentual > 0 ? '+' : ''}
          {variacaoPercentual}% vs mês anterior
        </span>
      )}
      {detalhe && <span className="indicador-detalhe">{detalhe}</span>}
    </div>
  )
}
