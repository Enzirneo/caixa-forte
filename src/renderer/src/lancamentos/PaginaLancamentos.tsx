import { formatarCentavosComoReal } from '../../../shared/dinheiro/formatarCentavos'
import { calcularSaldoEmCentavos } from '../../../shared/lancamentos/calcularSaldo'
import { FormularioLancamento } from './FormularioLancamento'
import { ListaLancamentos } from './ListaLancamentos'
import { useLancamentos } from './useLancamentos'

export function PaginaLancamentos(): React.JSX.Element {
  const { lancamentos, criar, excluir } = useLancamentos()
  const saldoEmCentavos = calcularSaldoEmCentavos(lancamentos)

  return (
    <main className="pagina">
      <header className="cabecalho">
        <h1>Caixa Forte</h1>
        <div className="saldo">
          <span>Saldo</span>
          <strong className={saldoEmCentavos < 0 ? 'despesa' : 'receita'}>
            {formatarCentavosComoReal(saldoEmCentavos)}
          </strong>
        </div>
      </header>
      <FormularioLancamento aoCriar={criar} />
      <ListaLancamentos lancamentos={lancamentos} aoExcluir={excluir} />
    </main>
  )
}
