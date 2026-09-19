import { useEffect, useState } from 'react'
import type { InformacoesDeBackup } from '../../../shared/backup/tipos'
import {
  NOME_SUGERIDO_DA_EXPORTACAO,
  montarCsvDosLancamentos
} from '../../../shared/exportacao/montarCsvDosLancamentos'
import type { Lancamento } from '../../../shared/lancamentos/tipos'
import { extrairMensagemDeErro } from '../compartilhado/extrairMensagemDeErro'

interface Props {
  lancamentos: Lancamento[]
}

interface Mensagem {
  tipo: 'sucesso' | 'erro'
  texto: string
}

export function PaginaDados({ lancamentos }: Props): React.JSX.Element {
  const [informacoes, setInformacoes] = useState<InformacoesDeBackup | null>(null)
  const [mensagem, setMensagem] = useState<Mensagem | null>(null)
  const [confirmandoRestauracao, setConfirmandoRestauracao] = useState(false)

  useEffect(() => {
    let componenteMontado = true
    window.api.backup.informacoes().then((dados) => {
      if (componenteMontado) setInformacoes(dados)
    })
    return () => {
      componenteMontado = false
    }
  }, [])

  const executar = async (acao: () => Promise<Mensagem | null>): Promise<void> => {
    try {
      setMensagem(await acao())
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: extrairMensagemDeErro(erro) })
    }
  }

  const fazerBackup = (): Promise<void> =>
    executar(async () => {
      const caminho = await window.api.backup.criar()
      return caminho ? { tipo: 'sucesso', texto: `Backup salvo em ${caminho}` } : null
    })

  const restaurar = (): Promise<void> =>
    executar(async () => {
      setConfirmandoRestauracao(false)
      const resultado = await window.api.backup.restaurar()
      return resultado === 'reiniciando'
        ? { tipo: 'sucesso', texto: 'Backup restaurado. O app vai reiniciar em instantes.' }
        : null
    })

  const exportar = (): Promise<void> =>
    executar(async () => {
      const caminho = await window.api.arquivos.salvarTexto(
        NOME_SUGERIDO_DA_EXPORTACAO,
        montarCsvDosLancamentos(lancamentos)
      )
      return caminho ? { tipo: 'sucesso', texto: `Lançamentos exportados em ${caminho}` } : null
    })

  const escolherPastaExterna = (): Promise<void> =>
    executar(async () => {
      const dados = await window.api.backup.escolherPastaExterna()
      setInformacoes(dados)
      return dados.pastaExterna
        ? { tipo: 'sucesso', texto: `Cópias também serão gravadas em ${dados.pastaExterna}` }
        : null
    })

  const removerPastaExterna = (): Promise<void> =>
    executar(async () => {
      setInformacoes(await window.api.backup.removerPastaExterna())
      return { tipo: 'sucesso', texto: 'A cópia em outra pasta foi desativada.' }
    })

  const copiarParaPastaExterna = (): Promise<void> =>
    executar(async () => {
      const caminho = await window.api.backup.copiarParaPastaExterna()
      setInformacoes(await window.api.backup.informacoes())
      return { tipo: 'sucesso', texto: `Cópia criada em ${caminho}` }
    })

  const ultimoAutomatico = informacoes?.automaticos[0]

  return (
    <>
      {mensagem && (
        <p className={mensagem.tipo === 'sucesso' ? 'mensagem-de-sucesso' : 'erro-de-exclusao'}>
          {mensagem.texto}
        </p>
      )}

      <section className="cartao-de-dados">
        <h2>Cópias de segurança</h2>
        <p>
          O app faz uma cópia automática por semana e guarda as 8 mais recentes.{' '}
          {ultimoAutomatico
            ? `A última foi em ${new Date(ultimoAutomatico.criadoEm).toLocaleString('pt-BR')}.`
            : 'Ainda não há nenhuma.'}
        </p>
        <p className="aviso-de-dados">
          Essas cópias ficam neste mesmo computador. Para se proteger de um defeito no disco, faça
          também um backup manual em um pendrive ou em uma pasta sincronizada com a nuvem.
        </p>
        <div className="acoes-de-dados">
          <button onClick={fazerBackup}>Fazer backup agora…</button>
          <button className="secundario" onClick={() => window.api.backup.abrirPasta()}>
            Abrir a pasta das cópias automáticas
          </button>
          {!confirmandoRestauracao && (
            <button className="secundario" onClick={() => setConfirmandoRestauracao(true)}>
              Restaurar de um backup…
            </button>
          )}
        </div>
        {confirmandoRestauracao && (
          <div className="confirmacao-de-restauracao">
            <p>
              Restaurar <strong>substitui todos os dados atuais</strong> pelos do arquivo escolhido.
              Uma cópia dos dados atuais é guardada antes, e o app reinicia. Continuar?
            </p>
            <div className="acoes-de-dados">
              <button className="perigo" onClick={restaurar}>
                Sim, escolher o arquivo
              </button>
              <button className="secundario" onClick={() => setConfirmandoRestauracao(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="cartao-de-dados">
        <h2>Cópia em outra pasta</h2>
        {informacoes?.pastaExterna ? (
          <>
            <p>
              As cópias automáticas semanais também são gravadas em{' '}
              <code>{informacoes.pastaExterna}</code>.{' '}
              {informacoes.ultimoBackupExterno
                ? `A última foi em ${new Date(informacoes.ultimoBackupExterno).toLocaleString('pt-BR')}.`
                : 'Ainda não há nenhuma lá.'}
            </p>
            <p className="aviso-de-dados">
              Se a pasta estiver sincronizada com a nuvem (OneDrive, por exemplo), a cópia também
              sobrevive a um defeito neste computador. O app guarda as 8 mais recentes.
            </p>
            <div className="acoes-de-dados">
              <button onClick={copiarParaPastaExterna}>Copiar agora</button>
              <button className="secundario" onClick={escolherPastaExterna}>
                Trocar a pasta…
              </button>
              <button className="secundario" onClick={removerPastaExterna}>
                Desativar
              </button>
            </div>
          </>
        ) : (
          <>
            <p>
              Nenhuma pasta escolhida. Escolha uma pasta do OneDrive, do Google Drive ou de um
              pendrive, e as cópias automáticas passam a ser gravadas lá também.
            </p>
            <div className="acoes-de-dados">
              <button onClick={escolherPastaExterna}>Escolher a pasta…</button>
            </div>
          </>
        )}
      </section>

      <section className="cartao-de-dados">
        <h2>Exportar</h2>
        <p>
          Salva os {lancamentos.length} lançamentos em um arquivo CSV, que abre no Excel e pode ser
          importado de volta pela aba Importar.
        </p>
        <div className="acoes-de-dados">
          <button onClick={exportar} disabled={lancamentos.length === 0}>
            Exportar lançamentos (CSV)…
          </button>
        </div>
      </section>
    </>
  )
}
