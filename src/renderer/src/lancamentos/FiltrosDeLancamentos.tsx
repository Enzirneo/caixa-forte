import { Search } from 'lucide-react'
import { useState } from 'react'
import { converterTextoEmCentavos } from '../../../shared/dinheiro/converterTextoEmCentavos'
import {
  FILTRO_PADRAO_DE_LANCAMENTOS,
  filtroEstaAtivo,
  type FiltroDeLancamentos,
  type OrdenacaoDeLancamentos
} from '../../../shared/lancamentos/filtrarLancamentos'
import type { TipoLancamento } from '../../../shared/lancamentos/tipos'
import { Selecao, type OpcaoDeSelecao } from '../componentes/Selecao'

const VALOR_DE_TODAS_AS_CATEGORIAS = ''
const TAMANHO_DO_ICONE_DE_BUSCA = 16

const OPCOES_DE_TIPO: OpcaoDeSelecao[] = [
  { valor: 'todos', rotulo: 'Todos os tipos' },
  { valor: 'receita', rotulo: 'Receitas' },
  { valor: 'despesa', rotulo: 'Despesas' }
]

const OPCOES_DE_ORDENACAO: OpcaoDeSelecao[] = [
  { valor: 'data-desc', rotulo: 'Mais novos primeiro' },
  { valor: 'data-asc', rotulo: 'Mais antigos primeiro' },
  { valor: 'valor-desc', rotulo: 'Maior valor primeiro' },
  { valor: 'valor-asc', rotulo: 'Menor valor primeiro' }
]

interface Props {
  filtro: FiltroDeLancamentos
  aoMudar: (filtro: FiltroDeLancamentos) => void
  categorias: string[]
  quantidadeExibida: number
  quantidadeNoMes: number
}

function converterTextoEmLimite(texto: string): number | null {
  return texto.trim() === '' ? null : converterTextoEmCentavos(texto)
}

export function FiltrosDeLancamentos({
  filtro,
  aoMudar,
  categorias,
  quantidadeExibida,
  quantidadeNoMes
}: Props): React.JSX.Element {
  const [textoDoMinimo, setTextoDoMinimo] = useState('')
  const [textoDoMaximo, setTextoDoMaximo] = useState('')
  const ativo = filtroEstaAtivo(filtro)

  const limpar = (): void => {
    setTextoDoMinimo('')
    setTextoDoMaximo('')
    aoMudar({ ...FILTRO_PADRAO_DE_LANCAMENTOS, ordenacao: filtro.ordenacao })
  }

  const opcoesDeCategoria: OpcaoDeSelecao[] = [
    { valor: VALOR_DE_TODAS_AS_CATEGORIAS, rotulo: 'Todas as categorias' },
    ...categorias.map((categoria) => ({ valor: categoria, rotulo: categoria }))
  ]

  return (
    <div className="filtros-de-lancamentos">
      <div className="campo-de-filtro campo-de-busca">
        <span className="rotulo-do-campo">Buscar</span>
        <div className="campo-com-icone-a-esquerda">
          <Search size={TAMANHO_DO_ICONE_DE_BUSCA} />
          <input
            placeholder="Descrição ou categoria"
            aria-label="Buscar lançamentos"
            value={filtro.texto}
            onChange={(e) => aoMudar({ ...filtro, texto: e.target.value })}
          />
        </div>
      </div>
      <div className="campo-de-filtro">
        <span className="rotulo-do-campo">Categoria</span>
        <Selecao
          valor={filtro.categoria ?? VALOR_DE_TODAS_AS_CATEGORIAS}
          opcoes={opcoesDeCategoria}
          aoMudar={(valor) =>
            aoMudar({ ...filtro, categoria: valor === VALOR_DE_TODAS_AS_CATEGORIAS ? null : valor })
          }
          rotuloDeAcessibilidade="Filtrar por categoria"
        />
      </div>
      <div className="campo-de-filtro">
        <span className="rotulo-do-campo">Tipo</span>
        <Selecao
          valor={filtro.tipo}
          opcoes={OPCOES_DE_TIPO}
          aoMudar={(valor) => aoMudar({ ...filtro, tipo: valor as TipoLancamento | 'todos' })}
          rotuloDeAcessibilidade="Filtrar por tipo"
        />
      </div>
      <div className="campo-de-filtro campo-de-valor">
        <span className="rotulo-do-campo">Valor mínimo</span>
        <input
          inputMode="decimal"
          placeholder="0,00"
          aria-label="Valor mínimo"
          value={textoDoMinimo}
          onChange={(e) => {
            setTextoDoMinimo(e.target.value)
            aoMudar({ ...filtro, valorMinimoCentavos: converterTextoEmLimite(e.target.value) })
          }}
        />
      </div>
      <div className="campo-de-filtro campo-de-valor">
        <span className="rotulo-do-campo">Valor máximo</span>
        <input
          inputMode="decimal"
          placeholder="0,00"
          aria-label="Valor máximo"
          value={textoDoMaximo}
          onChange={(e) => {
            setTextoDoMaximo(e.target.value)
            aoMudar({ ...filtro, valorMaximoCentavos: converterTextoEmLimite(e.target.value) })
          }}
        />
      </div>
      <div className="campo-de-filtro">
        <span className="rotulo-do-campo">Ordenar por</span>
        <Selecao
          valor={filtro.ordenacao}
          opcoes={OPCOES_DE_ORDENACAO}
          aoMudar={(valor) => aoMudar({ ...filtro, ordenacao: valor as OrdenacaoDeLancamentos })}
          rotuloDeAcessibilidade="Ordenar por"
        />
      </div>
      <div className="contagem-de-lancamentos">
        <span>
          {ativo
            ? `${quantidadeExibida} de ${quantidadeNoMes} lançamentos`
            : `${quantidadeNoMes} lançamentos`}
        </span>
        {ativo && (
          <button type="button" className="botao-de-texto" onClick={limpar}>
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}
