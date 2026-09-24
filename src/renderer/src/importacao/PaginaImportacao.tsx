import { useState } from 'react'
import { listarCategoriasEmUso } from '../../../shared/categorias/nomeDaCategoria'
import { obterDataIsoDeHoje } from '../../../shared/datas/dataIso'
import { canonizarCategoriasDoLote } from '../../../shared/importacao/canonizarCategoriasDoLote'
import {
  interpretarPlanilha,
  interpretarTextoColado
} from '../../../shared/importacao/interpretarEntrada'
import { lerCsv } from '../../../shared/importacao/lerCsv'
import { marcarDuplicadas } from '../../../shared/importacao/marcarDuplicadas'
import {
  montarCsvDoModelo,
  NOME_DO_ARQUIVO_MODELO
} from '../../../shared/importacao/modeloDaPlanilha'
import type { CelulaDaPlanilha, ItemDaPrevia } from '../../../shared/importacao/tipos'
import type { Lancamento, NovoLancamento } from '../../../shared/lancamentos/tipos'
import { extrairMensagemDeErro } from '../compartilhado/extrairMensagemDeErro'
import { lerArquivoDeTexto } from '../compartilhado/lerArquivoDeTexto'
import { lerPlanilhaXlsx } from '../compartilhado/lerPlanilhaXlsx'
import { PreviaDaImportacao } from './PreviaDaImportacao'
import { AreaParaSoltarArquivo } from '../componentes/AreaParaSoltarArquivo'
import { CampoDeData } from '../componentes/CampoDeData'

interface Props {
  lancamentosExistentes: Lancamento[]
  aoImportar: (novosLancamentos: NovoLancamento[]) => Promise<number>
}

interface ArquivoLido {
  nome: string
  linhas: CelulaDaPlanilha[][]
}

interface Mensagem {
  tipo: 'sucesso' | 'erro'
  texto: string
}

const EXTENSAO_DO_EXCEL = '.xlsx'

const EXEMPLO_DE_TEXTO = `Mercado 150,00
Uber 23,90
10/09 Farmácia #Saúde 45,90
+ Salário 5000,00`

export function PaginaImportacao({ lancamentosExistentes, aoImportar }: Props): React.JSX.Element {
  const [textoColado, setTextoColado] = useState('')
  const [arquivo, setArquivo] = useState<ArquivoLido | null>(null)
  const [dataDoLote, setDataDoLote] = useState(obterDataIsoDeHoje())
  const [escolhas, setEscolhas] = useState<Record<number, boolean>>({})
  const [mensagem, setMensagem] = useState<Mensagem | null>(null)

  const linhasInterpretadas = arquivo
    ? interpretarPlanilha(arquivo.linhas, dataDoLote)
    : interpretarTextoColado(textoColado, dataDoLote)
  const itens = marcarDuplicadas(
    canonizarCategoriasDoLote(linhasInterpretadas, listarCategoriasEmUso(lancamentosExistentes)),
    lancamentosExistentes
  )

  const estaIncluido = (item: ItemDaPrevia): boolean =>
    item.lancamento !== null && (escolhas[item.numeroDaLinha] ?? !item.duplicada)

  const itensParaImportar = itens.filter(estaIncluido)
  const quantidadeDuplicadas = itens.filter((item) => item.duplicada).length
  const quantidadeComErro = itens.filter((item) => item.lancamento === null).length

  const limparEntrada = (): void => {
    setTextoColado('')
    setArquivo(null)
    setEscolhas({})
  }

  const alterarTexto = (texto: string): void => {
    setTextoColado(texto)
    setArquivo(null)
    setEscolhas({})
    setMensagem(null)
  }

  const lerLinhasDoArquivo = async (arquivoEscolhido: File): Promise<CelulaDaPlanilha[][]> =>
    arquivoEscolhido.name.toLowerCase().endsWith(EXTENSAO_DO_EXCEL)
      ? lerPlanilhaXlsx(arquivoEscolhido)
      : lerCsv(await lerArquivoDeTexto(arquivoEscolhido))

  const escolherArquivo = async (arquivoEscolhido: File | undefined): Promise<void> => {
    if (!arquivoEscolhido) return
    try {
      const linhas = await lerLinhasDoArquivo(arquivoEscolhido)
      setArquivo({ nome: arquivoEscolhido.name, linhas })
      setTextoColado('')
      setEscolhas({})
      setMensagem(null)
    } catch {
      setMensagem({
        tipo: 'erro',
        texto: 'Não consegui ler este arquivo. Ele é mesmo .xlsx ou .csv?'
      })
    }
  }

  const alternarInclusao = (numeroDaLinha: number): void => {
    const item = itens.find((candidato) => candidato.numeroDaLinha === numeroDaLinha)
    if (!item) return
    setEscolhas({ ...escolhas, [numeroDaLinha]: !estaIncluido(item) })
  }

  const importar = async (): Promise<void> => {
    const novosLancamentos = itensParaImportar.flatMap((item) =>
      item.lancamento ? [item.lancamento] : []
    )
    try {
      const quantidade = await aoImportar(novosLancamentos)
      limparEntrada()
      setMensagem({ tipo: 'sucesso', texto: `${quantidade} lançamento(s) importado(s).` })
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: extrairMensagemDeErro(erro) })
    }
  }

  return (
    <>
      <section className="formulario importacao-entrada">
        <label className="campo-largo">
          Cole aqui as linhas (uma por gasto) ou uma tabela copiada do Excel
          <textarea
            rows={6}
            placeholder={EXEMPLO_DE_TEXTO}
            value={textoColado}
            onChange={(e) => alterarTexto(e.target.value)}
          />
        </label>
        <div className="campo">
          <span className="rotulo-do-campo">Data das linhas sem data</span>
          <CampoDeData
            valor={dataDoLote}
            aoMudar={setDataDoLote}
            rotuloDeAcessibilidade="Data das linhas sem data"
          />
        </div>
        <div className="campo campo-do-arquivo">
          <span className="rotulo-do-campo">Ou use um arquivo</span>
          <AreaParaSoltarArquivo
            extensoesAceitas=".xlsx,.csv,.txt"
            aoEscolher={escolherArquivo}
            rotulo="Arraste um arquivo Excel (.xlsx) ou CSV aqui, ou clique para escolher"
          />
        </div>
        <p className="dica-de-importacao">
          Uma despesa por linha: <code>Mercado 150,00</code>. Use <code>+</code> no começo para
          receita, uma data no começo (<code>10/09</code>) e <code>#categoria</code> se quiser.{' '}
          <button
            type="button"
            className="botao-de-texto botao-de-texto-em-linha"
            onClick={() =>
              window.api.arquivos.salvarTexto(NOME_DO_ARQUIVO_MODELO, montarCsvDoModelo())
            }
          >
            Baixar modelo (CSV)
          </button>
        </p>
      </section>

      {mensagem && (
        <p className={mensagem.tipo === 'sucesso' ? 'mensagem-de-sucesso' : 'erro-de-exclusao'}>
          {mensagem.texto}
        </p>
      )}

      {itens.length > 0 && (
        <>
          {arquivo && <p className="aviso-de-fechamento">Arquivo: {arquivo.nome}</p>}
          <PreviaDaImportacao
            itens={itens}
            estaIncluido={estaIncluido}
            aoAlternar={alternarInclusao}
          />
          <div className="rodape-da-importacao">
            <span>
              {itensParaImportar.length} para importar · {quantidadeDuplicadas} já existem ·{' '}
              {quantidadeComErro} com erro
            </span>
            <button disabled={itensParaImportar.length === 0} onClick={importar}>
              Importar {itensParaImportar.length} lançamento(s)
            </button>
          </div>
        </>
      )}
    </>
  )
}
