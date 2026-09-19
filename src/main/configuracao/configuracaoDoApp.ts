import type { Configuracao } from '../../shared/configuracao/configuracao'
import { obterCaminhoDaConfiguracao } from '../banco/caminhos'
import { lerConfiguracaoDe, salvarConfiguracaoEm } from './arquivoDeConfiguracao'

export function lerConfiguracao(): Configuracao {
  return lerConfiguracaoDe(obterCaminhoDaConfiguracao())
}

export function salvarConfiguracao(configuracao: Configuracao): void {
  salvarConfiguracaoEm(obterCaminhoDaConfiguracao(), configuracao)
}
