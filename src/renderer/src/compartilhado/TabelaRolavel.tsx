import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

// Mostra até seis linhas; passando disso, a tabela rola por dentro e o cabeçalho fica parado.
export function TabelaRolavel({ children }: Props): React.JSX.Element {
  return <div className="tabela-rolavel">{children}</div>
}
