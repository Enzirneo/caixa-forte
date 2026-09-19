import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { DIAS_DA_SEMANA_ABREVIADOS, montarGradeDoMes } from '../../../shared/datas/calendario'
import { formatarDataIsoComoBrasileira, obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { formatarMesPorExtenso, obterMesDaData, somarMeses } from '../../../shared/datas/mes'
import { converterTextoEmDataIso } from '../../../shared/importacao/converterTextoEmDataIso'
import { useFecharAoClicarFora } from './useFecharAoClicarFora'

interface Props {
  valor: string
  aoMudar: (dataIso: string) => void
  rotuloDeAcessibilidade: string
}

const TAMANHO_DO_ICONE = 16
const PRIMEIROS_CARACTERES_DO_ANO = 4

export function CampoDeData({ valor, aoMudar, rotuloDeAcessibilidade }: Props): React.JSX.Element {
  const [aberto, setAberto] = useState(false)
  const [textoEmEdicao, setTextoEmEdicao] = useState<string | null>(null)
  const [mesExibido, setMesExibido] = useState(obterMesDaData(valor || obterDataIsoDeHoje()))
  const referencia = useFecharAoClicarFora(aberto, () => setAberto(false))
  const hoje = obterDataIsoDeHoje()

  const abrir = (): void => {
    setMesExibido(obterMesDaData(valor || hoje))
    setAberto(true)
  }

  const escolherDia = (dataIso: string): void => {
    aoMudar(dataIso)
    setTextoEmEdicao(null)
    setAberto(false)
  }

  const confirmarTexto = (): void => {
    if (textoEmEdicao !== null) {
      const anoPadrao = Number(hoje.slice(0, PRIMEIROS_CARACTERES_DO_ANO))
      const dataIso = converterTextoEmDataIso(textoEmEdicao, anoPadrao)
      if (dataIso !== null) aoMudar(dataIso)
    }
    setTextoEmEdicao(null)
  }

  const aoApertarTecla = (evento: KeyboardEvent): void => {
    if (evento.key !== 'Enter') return
    evento.preventDefault()
    confirmarTexto()
    setAberto(false)
  }

  return (
    <div className="popover-ancora" ref={referencia}>
      <div className="campo-com-icone">
        <input
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          aria-label={rotuloDeAcessibilidade}
          value={textoEmEdicao ?? (valor ? formatarDataIsoComoBrasileira(valor) : '')}
          onFocus={abrir}
          onClick={() => !aberto && abrir()}
          onChange={(e) => setTextoEmEdicao(e.target.value)}
          onBlur={confirmarTexto}
          onKeyDown={aoApertarTecla}
        />
        <button
          type="button"
          className="botao-de-icone"
          aria-label="Abrir o calendário"
          onClick={() => (aberto ? setAberto(false) : abrir())}
        >
          <CalendarDays size={TAMANHO_DO_ICONE} />
        </button>
      </div>

      {aberto && (
        <div className="popover calendario" role="dialog" aria-label="Calendário">
          <header className="calendario-cabecalho">
            <button
              type="button"
              className="botao-de-icone"
              aria-label="Mês anterior"
              onClick={() => setMesExibido(somarMeses(mesExibido, -1))}
            >
              <ChevronLeft size={TAMANHO_DO_ICONE} />
            </button>
            <strong>{formatarMesPorExtenso(mesExibido)}</strong>
            <button
              type="button"
              className="botao-de-icone"
              aria-label="Próximo mês"
              onClick={() => setMesExibido(somarMeses(mesExibido, 1))}
            >
              <ChevronRight size={TAMANHO_DO_ICONE} />
            </button>
          </header>

          <div className="calendario-semana calendario-dias-da-semana">
            {DIAS_DA_SEMANA_ABREVIADOS.map((letra, indice) => (
              <span key={indice}>{letra}</span>
            ))}
          </div>

          {montarGradeDoMes(mesExibido).map((semana) => (
            <div key={semana[0].dataIso} className="calendario-semana">
              {semana.map((dia) => {
                const classes = [
                  'calendario-dia',
                  dia.doMesExibido ? '' : 'fora-do-mes',
                  dia.dataIso === valor ? 'selecionado' : '',
                  dia.dataIso === hoje ? 'hoje' : ''
                ]
                return (
                  <button
                    key={dia.dataIso}
                    type="button"
                    className={classes.filter(Boolean).join(' ')}
                    onClick={() => escolherDia(dia.dataIso)}
                  >
                    {dia.diaDoMes}
                  </button>
                )
              })}
            </div>
          ))}

          <footer className="calendario-rodape">
            <button type="button" className="botao-de-texto" onClick={() => escolherDia(hoje)}>
              Hoje
            </button>
          </footer>
        </div>
      )}
    </div>
  )
}
