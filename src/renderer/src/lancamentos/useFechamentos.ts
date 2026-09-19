import { useEffect, useState } from 'react'
import type { FechamentoMes } from '../../../shared/fechamentos/tipos'

interface UsoDeFechamentos {
  fechamentos: FechamentoMes[]
  refazerFechamento: (mes: string) => Promise<void>
}

async function fecharMesesEncerradosELer(): Promise<FechamentoMes[]> {
  await window.api.fechamentos.fecharMesesEncerrados()
  return window.api.fechamentos.listar()
}

export function useFechamentos(): UsoDeFechamentos {
  const [fechamentos, setFechamentos] = useState<FechamentoMes[]>([])

  useEffect(() => {
    let componenteMontado = true
    const atualizar = (): void => {
      fecharMesesEncerradosELer().then((lista) => {
        if (componenteMontado) setFechamentos(lista)
      })
    }

    atualizar()
    window.addEventListener('focus', atualizar)
    return () => {
      componenteMontado = false
      window.removeEventListener('focus', atualizar)
    }
  }, [])

  const refazerFechamento = async (mes: string): Promise<void> => {
    await window.api.fechamentos.refazer(mes)
    setFechamentos(await window.api.fechamentos.listar())
  }

  return { fechamentos, refazerFechamento }
}
