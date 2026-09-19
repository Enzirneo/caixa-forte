import { useEffect, useState } from 'react'
import type {
  Cartao,
  NovaCompraNoCartao,
  NovoCartao,
  VinculoDeCompra
} from '../../../shared/cartoes/tipos'

interface UsoDeCartoes {
  cartoes: Cartao[]
  vinculos: VinculoDeCompra[]
  criarCartao: (novoCartao: NovoCartao) => Promise<void>
  atualizarCartao: (cartao: Cartao) => Promise<void>
  excluirCartao: (id: number) => Promise<void>
  registrarCompra: (novaCompra: NovaCompraNoCartao) => Promise<void>
  excluirCompra: (grupoId: number) => Promise<void>
}

// Compras e parcelas são lançamentos de verdade, então a lista de lançamentos precisa ser relida.
export function useCartoes(aoAlterarLancamentos: () => Promise<void>): UsoDeCartoes {
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [vinculos, setVinculos] = useState<VinculoDeCompra[]>([])

  useEffect(() => {
    let componenteMontado = true
    Promise.all([window.api.cartoes.listarCartoes(), window.api.cartoes.listarVinculos()]).then(
      ([listaDeCartoes, listaDeVinculos]) => {
        if (!componenteMontado) return
        setCartoes(listaDeCartoes)
        setVinculos(listaDeVinculos)
      }
    )
    return () => {
      componenteMontado = false
    }
  }, [])

  const recarregarCartoes = async (): Promise<void> => {
    setCartoes(await window.api.cartoes.listarCartoes())
  }

  const recarregarComprasELancamentos = async (): Promise<void> => {
    await aoAlterarLancamentos()
    setVinculos(await window.api.cartoes.listarVinculos())
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

  return {
    cartoes,
    vinculos,
    criarCartao,
    atualizarCartao,
    excluirCartao,
    registrarCompra,
    excluirCompra
  }
}
