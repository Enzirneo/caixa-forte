import { useEffect, useState } from 'react'
import type { FechamentoMes } from '../../../shared/fechamentos/tipos'

interface UsoDeFechamentos {
  fechamentos: FechamentoMes[]
  fecharMes: (mes: string) => Promise<void>
  reabrirMes: (mes: string) => Promise<void>
}

export function useFechamentos(): UsoDeFechamentos {
  const [fechamentos, setFechamentos] = useState<FechamentoMes[]>([])

  useEffect(() => {
    let componenteMontado = true
    window.api.fechamentos.listar().then((lista) => {
      if (componenteMontado) setFechamentos(lista)
    })
    return () => {
      componenteMontado = false
    }
  }, [])

  const recarregar = async (): Promise<void> => {
    setFechamentos(await window.api.fechamentos.listar())
  }

  const fecharMes = async (mes: string): Promise<void> => {
    await window.api.fechamentos.fechar(mes)
    await recarregar()
  }

  const reabrirMes = async (mes: string): Promise<void> => {
    await window.api.fechamentos.reabrir(mes)
    await recarregar()
  }

  return { fechamentos, fecharMes, reabrirMes }
}
