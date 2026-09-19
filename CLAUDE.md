# Caixa Forte

App de desktop (Windows) para gerir finanças pessoais. Roda só no PC, sem servidor e sem nuvem. Os dados ficam num arquivo SQLite local.

**Stack:** Electron + React + TypeScript (electron-vite) + SQLite (`better-sqlite3`).

## Código limpo

- **Nomes que explicam**: `calcularRendimentoPoupanca`, não `calc` nem `data2`. Sem abreviações obscuras.
- **Funções pequenas**: uma função faz uma coisa. Se precisa de "e" para descrever, divida.
- **Sem duplicação**: se copiou o mesmo trecho duas vezes, extraia.
- **Sem comentário que repete o código**: comente só o *porquê*, nunca o *quê*.
- **Sem números e textos soltos**: use constantes com nome.
- **Falhe cedo**: valide na entrada e retorne antes, em vez de aninhar `if`.
- **Sem código morto**: apague em vez de comentar.
- **Tipos explícitos**: nada de `any`.

## Organização

- Separe por **funcionalidade**, não por tipo de arquivo (`lancamentos/`, `dashboard/`, `investimentos/`).
- **Regra de negócio fora da tela**: cálculos e regras ficam em funções puras, sem React e sem banco, para poder testar.
- Componentes React só cuidam de exibir e de receber a ação do usuário.
- Acesso ao banco fica isolado em módulos próprios (repositórios).

## Regras do projeto

- **Dinheiro é inteiro em centavos** (`123456` = R$ 1.234,56). Nunca `float`. Converta para texto só na tela e na exportação.
- **Alterações no banco só por migration**, nunca editando o banco à mão. Nunca perder dados do usuário.
- Tudo local: nenhuma chamada de rede é obrigatória para lançar gastos. Taxas online (Banco Central, Tesouro) são opcionais e ficam em cache.
- Textos da interface e nomes de domínio em **português**; código e identificadores técnicos seguem o padrão do TypeScript.

## Como trabalhar

- Mudanças pequenas e focadas, um commit por assunto.
- Regra de negócio nova nasce com teste.
- Antes de dar algo por pronto: `npm run typecheck` e `npm run lint`.
- Mensagens de commit no formato `tipo: descrição` (`feat`, `fix`, `refactor`, `chore`, `docs`, `test`).
