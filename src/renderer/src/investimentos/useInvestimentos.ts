import { useEffect, useState } from 'react'
import type {
  Destino,
  Movimentacao,
  NovaMovimentacao,
  NovoDestino
} from '../../../shared/investimentos/tipos'

interface UsoDeInvestimentos {
  destinos: Destino[]
  movimentacoes: Movimentacao[]
  criarDestino: (novoDestino: NovoDestino) => Promise<void>
  criarMovimentacao: (novaMovimentacao: NovaMovimentacao) => Promise<void>
  excluirMovimentacao: (id: number) => Promise<void>
}

export function useInvestimentos(): UsoDeInvestimentos {
  const [destinos, setDestinos] = useState<Destino[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])

  useEffect(() => {
    let componenteMontado = true
    Promise.all([
      window.api.investimentos.listarDestinos(),
      window.api.investimentos.listarMovimentacoes()
    ]).then(([listaDeDestinos, listaDeMovimentacoes]) => {
      if (!componenteMontado) return
      setDestinos(listaDeDestinos)
      setMovimentacoes(listaDeMovimentacoes)
    })
    return () => {
      componenteMontado = false
    }
  }, [])

  const criarDestino = async (novoDestino: NovoDestino): Promise<void> => {
    await window.api.investimentos.criarDestino(novoDestino)
    setDestinos(await window.api.investimentos.listarDestinos())
  }

  const criarMovimentacao = async (novaMovimentacao: NovaMovimentacao): Promise<void> => {
    await window.api.investimentos.criarMovimentacao(novaMovimentacao)
    setMovimentacoes(await window.api.investimentos.listarMovimentacoes())
  }

  const excluirMovimentacao = async (id: number): Promise<void> => {
    await window.api.investimentos.excluirMovimentacao(id)
    setMovimentacoes(await window.api.investimentos.listarMovimentacoes())
  }

  return { destinos, movimentacoes, criarDestino, criarMovimentacao, excluirMovimentacao }
}
