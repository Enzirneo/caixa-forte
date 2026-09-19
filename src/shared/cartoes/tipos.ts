// `diasAntesDoVencimento` preenchido: a fatura fecha sempre tantos dias antes do vencimento (o dia
// do fechamento muda conforme o mês). Nulo: a fatura fecha sempre em `diaDeFechamento`.
export interface RegraDoCiclo {
  diaDeFechamento: number
  diaDeVencimento: number
  diasAntesDoVencimento: number | null
}

export interface NovoCartao extends RegraDoCiclo {
  nome: string
  limiteCentavos: number | null
}

// Exceção do mês: quando o banco foge da regra, vale a melhor data de compra informada.
export interface AjusteDeFechamento {
  cartaoId: number
  mesDoVencimento: string
  melhorDataDeCompra: string
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
  listarAjustes: () => Promise<AjusteDeFechamento[]>
  salvarAjuste: (ajuste: AjusteDeFechamento) => Promise<void>
  removerAjuste: (cartaoId: number, mesDoVencimento: string) => Promise<void>
}
