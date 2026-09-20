interface Props {
  marcada: boolean
  aoMudar: (marcada: boolean) => void
  texto: string
}

// Opção discreta de formulário: uma caixinha com texto pequeno, sem chamar atenção.
export function CaixaDeSelecao({ marcada, aoMudar, texto }: Props): React.JSX.Element {
  return (
    <label className="caixa-de-selecao">
      <input type="checkbox" checked={marcada} onChange={(e) => aoMudar(e.target.checked)} />
      {texto}
    </label>
  )
}
