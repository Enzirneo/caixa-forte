import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { formatarMesAbreviado, formatarMesPorExtenso } from '../../../shared/datas/mes'
import { obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { useFecharAoClicarFora } from './useFecharAoClicarFora'

interface Props {
  valor: string
  aoMudar: (mes: string) => void
  rotuloDeAcessibilidade: string
  textoQuandoVazio?: string
  podeLimpar?: boolean
}

const TAMANHO_DO_ICONE = 16
const MESES_DO_ANO = Array.from({ length: 12 }, (_, indice) => String(indice + 1).padStart(2, '0'))
const TAMANHO_DO_ANO = 4

export function CampoDeMes({
  valor,
  aoMudar,
  rotuloDeAcessibilidade,
  textoQuandoVazio = 'Escolher o mês',
  podeLimpar = false
}: Props): React.JSX.Element {
  const [aberto, setAberto] = useState(false)
  const [anoExibido, setAnoExibido] = useState(0)
  const referencia = useFecharAoClicarFora(aberto, () => setAberto(false))
  const mesAtual = obterDataIsoDeHoje().slice(0, TAMANHO_DO_ANO + 3)

  const abrir = (): void => {
    setAnoExibido(Number((valor || mesAtual).slice(0, TAMANHO_DO_ANO)))
    setAberto(true)
  }

  const escolher = (mes: string): void => {
    aoMudar(mes)
    setAberto(false)
  }

  return (
    <div className="popover-ancora" ref={referencia}>
      <button
        type="button"
        className="selecao-botao"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-label={rotuloDeAcessibilidade}
        onClick={() => (aberto ? setAberto(false) : abrir())}
      >
        <span className={valor ? undefined : 'selecao-vazia'}>
          {valor ? formatarMesPorExtenso(valor) : textoQuandoVazio}
        </span>
        <CalendarDays size={TAMANHO_DO_ICONE} />
      </button>

      {aberto && (
        <div className="popover calendario calendario-de-meses" role="dialog">
          <header className="calendario-cabecalho">
            <button
              type="button"
              className="botao-de-icone"
              aria-label="Ano anterior"
              onClick={() => setAnoExibido(anoExibido - 1)}
            >
              <ChevronLeft size={TAMANHO_DO_ICONE} />
            </button>
            <strong>{anoExibido}</strong>
            <button
              type="button"
              className="botao-de-icone"
              aria-label="Próximo ano"
              onClick={() => setAnoExibido(anoExibido + 1)}
            >
              <ChevronRight size={TAMANHO_DO_ICONE} />
            </button>
          </header>

          <div className="grade-de-meses">
            {MESES_DO_ANO.map((numero) => {
              const mes = `${anoExibido}-${numero}`
              return (
                <button
                  key={mes}
                  type="button"
                  className={[
                    'calendario-dia',
                    mes === valor ? 'selecionado' : '',
                    mes === mesAtual ? 'hoje' : ''
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => escolher(mes)}
                >
                  {formatarMesAbreviado(mes).split('/')[0]}
                </button>
              )
            })}
          </div>

          {podeLimpar && valor && (
            <footer className="calendario-rodape">
              <button type="button" className="botao-de-texto" onClick={() => escolher('')}>
                Limpar
              </button>
            </footer>
          )}
        </div>
      )}
    </div>
  )
}
