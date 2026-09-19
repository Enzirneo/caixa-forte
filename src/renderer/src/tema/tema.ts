import {
  interpretarPreferenciaSalva,
  resolverTema,
  type PreferenciaDeTema
} from '../../../shared/tema/resolverTema'
import {
  lerDoArmazenamentoLocal,
  salvarNoArmazenamentoLocal
} from '../compartilhado/armazenamentoLocal'

const CHAVE_DA_PREFERENCIA_DE_TEMA = 'caixa-forte:tema'
const CONSULTA_DE_SISTEMA_ESCURO = '(prefers-color-scheme: dark)'

export function carregarPreferenciaDeTema(): PreferenciaDeTema {
  return interpretarPreferenciaSalva(lerDoArmazenamentoLocal(CHAVE_DA_PREFERENCIA_DE_TEMA))
}

export function salvarPreferenciaDeTema(preferencia: PreferenciaDeTema): void {
  salvarNoArmazenamentoLocal(CHAVE_DA_PREFERENCIA_DE_TEMA, preferencia)
}

export function observarSistemaEscuro(): MediaQueryList {
  return window.matchMedia(CONSULTA_DE_SISTEMA_ESCURO)
}

export function aplicarPreferenciaDeTema(preferencia: PreferenciaDeTema): void {
  const tema = resolverTema(preferencia, observarSistemaEscuro().matches)
  document.documentElement.dataset.tema = tema
}
