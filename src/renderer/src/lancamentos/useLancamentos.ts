import { useEffect, useState } from 'react'
import type { Lancamento, NovoLancamento } from '../../../shared/lancamentos/tipos'

interface UsoDeLancamentos {
  lancamentos: Lancamento[]
  criar: (novoLancamento: NovoLancamento) => Promise<void>
  atualizar: (lancamento: Lancamento) => Promise<void>
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

  const recarregar = async (): Promise<void> => {
    setLancamentos(await window.api.lancamentos.listar())
  }

  const criar = async (novoLancamento: NovoLancamento): Promise<void> => {
    await window.api.lancamentos.criar(novoLancamento)
    await recarregar()
  }

  const atualizar = async (lancamento: Lancamento): Promise<void> => {
    await window.api.lancamentos.atualizar(lancamento)
    await recarregar()
  }

  const excluir = async (id: number): Promise<void> => {
    await window.api.lancamentos.excluir(id)
    await recarregar()
  }

  return { lancamentos, criar, atualizar, excluir }
}
