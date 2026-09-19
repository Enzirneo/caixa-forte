import { existsSync, readFileSync, renameSync, writeFileSync } from 'fs'
import {
  interpretarConfiguracao,
  serializarConfiguracao,
  type Configuracao
} from '../../shared/configuracao/configuracao'

const SUFIXO_DO_ARQUIVO_TEMPORARIO = '.novo'

export function lerConfiguracaoDe(caminho: string): Configuracao {
  return interpretarConfiguracao(existsSync(caminho) ? readFileSync(caminho, 'utf-8') : null)
}

// Grava num arquivo temporário e troca: uma queda no meio não deixa a configuração pela metade.
export function salvarConfiguracaoEm(caminho: string, configuracao: Configuracao): void {
  const temporario = `${caminho}${SUFIXO_DO_ARQUIVO_TEMPORARIO}`
  writeFileSync(temporario, serializarConfiguracao(configuracao), 'utf-8')
  renameSync(temporario, caminho)
}
