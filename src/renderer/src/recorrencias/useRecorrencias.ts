import { useEffect, useState } from 'react'
import type {
  NovaRecorrencia,
  Recorrencia,
  RecorrenciaEditada
} from '../../../shared/recorrencias/tipos'

interface UsoDeRecorrencias {
  recorrencias: Recorrencia[]
  criar: (novaRecorrencia: NovaRecorrencia) => Promise<void>
  atualizar: (recorrencia: RecorrenciaEditada) => Promise<void>
  definirAtiva: (id: number, ativa: boolean) => Promise<void>
  excluir: (id: number) => Promise<void>
}

// Ao abrir e sempre que a janela volta ao foco, cria o que já venceu (ex.: o aluguel do dia 5
// depois de o app ter ficado aberto na virada do dia).
export function useRecorrencias(aoGerarLancamentos: () => Promise<void>): UsoDeRecorrencias {
  const [recorrencias, setRecorrencias] = useState<Recorrencia[]>([])

  useEffect(() => {
    let componenteMontado = true
    const sincronizar = (): void => {
      window.api.recorrencias.gerarPendentes().then(async (criados) => {
        if (criados > 0) await aoGerarLancamentos()
        const lista = await window.api.recorrencias.listar()
        if (componenteMontado) setRecorrencias(lista)
      })
    }

    sincronizar()
    window.addEventListener('focus', sincronizar)
    return () => {
      componenteMontado = false
      window.removeEventListener('focus', sincronizar)
    }
  }, [aoGerarLancamentos])

  const recarregarTudo = async (): Promise<void> => {
    await aoGerarLancamentos()
    setRecorrencias(await window.api.recorrencias.listar())
  }

  const criar = async (novaRecorrencia: NovaRecorrencia): Promise<void> => {
    await window.api.recorrencias.criar(novaRecorrencia)
    await recarregarTudo()
  }

  const atualizar = async (recorrencia: RecorrenciaEditada): Promise<void> => {
    await window.api.recorrencias.atualizar(recorrencia)
    await recarregarTudo()
  }

  const definirAtiva = async (id: number, ativa: boolean): Promise<void> => {
    await window.api.recorrencias.definirAtiva(id, ativa)
    await recarregarTudo()
  }

  const excluir = async (id: number): Promise<void> => {
    await window.api.recorrencias.excluir(id)
    await recarregarTudo()
  }

  return { recorrencias, criar, atualizar, definirAtiva, excluir }
}
