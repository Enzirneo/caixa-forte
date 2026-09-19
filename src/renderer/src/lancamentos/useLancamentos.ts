import { useCallback, useEffect, useState } from 'react'
import type {
  Lancamento,
  LancamentoEditado,
  NovoLancamento
} from '../../../shared/lancamentos/tipos'

interface UsoDeLancamentos {
  lancamentos: Lancamento[]
  recarregar: () => Promise<void>
  criar: (novoLancamento: NovoLancamento) => Promise<void>
  criarVarios: (novosLancamentos: NovoLancamento[]) => Promise<number>
  atualizar: (lancamento: LancamentoEditado) => Promise<void>
  excluir: (id: number) => Promise<void>
}

export function useLancamentos(): UsoDeLancamentos {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])

  useEffect(() => {
    let componenteMontado = true
    window.api.lancamentos.listar().then((lista) => {
      if (componenteMontado) setLancamentos(lista)
    })
    return () => {
      componenteMontado = false
    }
  }, [])

  const recarregar = useCallback(async (): Promise<void> => {
    setLancamentos(await window.api.lancamentos.listar())
  }, [])

  const criar = async (novoLancamento: NovoLancamento): Promise<void> => {
    await window.api.lancamentos.criar(novoLancamento)
    await recarregar()
  }

  const criarVarios = async (novosLancamentos: NovoLancamento[]): Promise<number> => {
    const quantidade = await window.api.lancamentos.criarVarios(novosLancamentos)
    await recarregar()
    return quantidade
  }

  const atualizar = async (lancamento: LancamentoEditado): Promise<void> => {
    await window.api.lancamentos.atualizar(lancamento)
    await recarregar()
  }

  const excluir = async (id: number): Promise<void> => {
    await window.api.lancamentos.excluir(id)
    await recarregar()
  }

  return { lancamentos, recarregar, criar, criarVarios, atualizar, excluir }
}
