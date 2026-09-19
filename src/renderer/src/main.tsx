import '@fontsource-variable/dm-sans/wght.css'
import '@fontsource-variable/playfair-display/wght.css'
import '@fontsource-variable/playfair-display/wght-italic.css'
import '@fontsource/pinyon-script/latin-400.css'
import './assets/estilos.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { aplicarPreferenciaDeTema, carregarPreferenciaDeTema } from './tema/tema'

// Aplica o tema antes de desenhar a tela, para não piscar com as cores erradas.
aplicarPreferenciaDeTema(carregarPreferenciaDeTema())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
