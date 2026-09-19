import { useState } from 'react'
import { listarCategoriasEmUso } from '../../../shared/categorias/nomeDaCategoria'
import type { Lancamento } from '../../../shared/lancamentos/tipos'
import type { NovaRecorrencia, Recorrencia } from '../../../shared/recorrencias/tipos'
import { FormularioRecorrencia } from './FormularioRecorrencia'
import { ListaRecorrencias } from './ListaRecorrencias'

interface Props {
  lancamentos: Lancamento[]
  recorrencias: Recorrencia[]
  aoCriar: (novaRecorrencia: NovaRecorrencia) => Promise<void>
  aoAtualizar: (recorrencia: Recorrencia) => Promise<void>
  aoDefinirAtiva: (id: number, ativa: boolean) => Promise<void>
  aoExcluir: (id: number) => Promise<void>
}

export function PaginaRecorrencias({
  lancamentos,
  recorrencias,
  aoCriar,
  aoAtualizar,
  aoDefinirAtiva,
  aoExcluir
}: Props): React.JSX.Element {
  const [recorrenciaEmEdicao, setRecorrenciaEmEdicao] = useState<Recorrencia | null>(null)

  const salvar = async (novaRecorrencia: NovaRecorrencia): Promise<void> => {
    if (recorrenciaEmEdicao) {
      await aoAtualizar({
        ...novaRecorrencia,
        id: recorrenciaEmEdicao.id,
        ativa: recorrenciaEmEdicao.ativa
      })
    } else {
      await aoCriar(novaRecorrencia)
    }
    setRecorrenciaEmEdicao(null)
  }

  return (
    <>
      <p className="aviso-de-fechamento">
        Os lançamentos são criados sozinhos quando o dia chega, e também os dos meses em que você
        não abriu o app. Apagar um lançamento criado não o traz de volta.
      </p>
      <FormularioRecorrencia
        key={recorrenciaEmEdicao?.id ?? 'nova'}
        recorrenciaEmEdicao={recorrenciaEmEdicao}
        categoriasSugeridas={listarCategoriasEmUso(lancamentos)}
        aoSalvar={salvar}
        aoCancelarEdicao={() => setRecorrenciaEmEdicao(null)}
      />
      <ListaRecorrencias
        recorrencias={recorrencias}
        aoEditar={setRecorrenciaEmEdicao}
        aoDefinirAtiva={aoDefinirAtiva}
        aoExcluir={aoExcluir}
      />
    </>
  )
}
