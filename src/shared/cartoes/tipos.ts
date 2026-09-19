export interface NovoCartao {
  nome: string
  diaDeFechamento: number
  diaDeVencimento: number
  limiteCentavos: number | null
}

export interface Cartao extends NovoCartao {
  id: number
}

export interface NovaCompraNoCartao {
  cartaoId: number
  descricao: string
  valorTotalCentavos: number
  parcelas: number
  dataDaCompra: string
  categoria: string
}

// Liga um lançamento (uma parcela) à compra e ao cartão de onde ele veio.
export interface VinculoDeCompra {
  lancamentoId: number
  cartaoId: number
  grupoId: number
  dataDaCompra: string
  parcelaNumero: number
  parcelasTotal: number
}

export interface ApiCartoes {
  listarCartoes: () => Promise<Cartao[]>
  criarCartao: (novoCartao: NovoCartao) => Promise<Cartao>
  atualizarCartao: (cartao: Cartao) => Promise<void>
  excluirCartao: (id: number) => Promise<void>
  listarVinculos: () => Promise<VinculoDeCompra[]>
  registrarCompra: (novaCompra: NovaCompraNoCartao) => Promise<number>
  excluirCompra: (grupoId: number) => Promise<void>
}
