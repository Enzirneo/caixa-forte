import { useCallback, useEffect, useState } from 'react'
import type {
  AjusteDeFechamento,
  Cartao,
  NovaCompraNoCartao,
  NovoCartao,
  VinculoDeCompra
} from '../../../shared/cartoes/tipos'

interface UsoDeCartoes {
  cartoes: Cartao[]
  vinculos: VinculoDeCompra[]
  ajustes: AjusteDeFechamento[]
  criarCartao: (novoCartao: NovoCartao) => Promise<void>
  atualizarCartao: (cartao: Cartao) => Promise<void>
  excluirCartao: (id: number) => Promise<void>
  registrarCompra: (novaCompra: NovaCompraNoCartao) => Promise<void>
  excluirCompra: (grupoId: number) => Promise<void>
  recarregarVinculos: () => Promise<void>
  salvarAjuste: (ajuste: AjusteDeFechamento) => Promise<void>
  removerAjuste: (cartaoId: number, mesDoVencimento: string) => Promise<void>
}

// Compras e parcelas são lançamentos de verdade, então a lista de lançamentos precisa ser relida.
export function useCartoes(aoAlterarLancamentos: () => Promise<void>): UsoDeCartoes {
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [vinculos, setVinculos] = useState<VinculoDeCompra[]>([])
  const [ajustes, setAjustes] = useState<AjusteDeFechamento[]>([])

  useEffect(() => {
    let componenteMontado = true
    Promise.all([
      window.api.cartoes.listarCartoes(),
      window.api.cartoes.listarVinculos(),
      window.api.cartoes.listarAjustes()
    ]).then(([listaDeCartoes, listaDeVinculos, listaDeAjustes]) => {
      if (!componenteMontado) return
      setCartoes(listaDeCartoes)
      setVinculos(listaDeVinculos)
      setAjustes(listaDeAjustes)
    })
    return () => {
      componenteMontado = false
    }
  }, [])

  const recarregarCartoes = async (): Promise<void> => {
    setCartoes(await window.api.cartoes.listarCartoes())
  }

  // Recorrências de cartão criam compras sozinhas: a lista de compras precisa ser relida.
  const recarregarVinculos = useCallback(async (): Promise<void> => {
    setVinculos(await window.api.cartoes.listarVinculos())
  }, [])

  const recarregarComprasELancamentos = async (): Promise<void> => {
    await aoAlterarLancamentos()
    await recarregarVinculos()
  }

  const criarCartao = async (novoCartao: NovoCartao): Promise<void> => {
    await window.api.cartoes.criarCartao(novoCartao)
    await recarregarCartoes()
  }

  const atualizarCartao = async (cartao: Cartao): Promise<void> => {
    await window.api.cartoes.atualizarCartao(cartao)
    await recarregarCartoes()
  }

  const excluirCartao = async (id: number): Promise<void> => {
    await window.api.cartoes.excluirCartao(id)
    await recarregarCartoes()
  }

  const registrarCompra = async (novaCompra: NovaCompraNoCartao): Promise<void> => {
    await window.api.cartoes.registrarCompra(novaCompra)
    await recarregarComprasELancamentos()
  }

  const excluirCompra = async (grupoId: number): Promise<void> => {
    await window.api.cartoes.excluirCompra(grupoId)
    await recarregarComprasELancamentos()
  }

  const salvarAjuste = async (ajuste: AjusteDeFechamento): Promise<void> => {
    await window.api.cartoes.salvarAjuste(ajuste)
    setAjustes(await window.api.cartoes.listarAjustes())
  }

  const removerAjuste = async (cartaoId: number, mesDoVencimento: string): Promise<void> => {
    await window.api.cartoes.removerAjuste(cartaoId, mesDoVencimento)
    setAjustes(await window.api.cartoes.listarAjustes())
  }

  return {
    cartoes,
    vinculos,
    ajustes,
    criarCartao,
    atualizarCartao,
    excluirCartao,
    registrarCompra,
    excluirCompra,
    recarregarVinculos,
    salvarAjuste,
    removerAjuste
  }
}
