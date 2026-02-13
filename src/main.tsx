import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@tomlievens/design-system/styles/tokens.css'
import './index.css'
import '@tomlievens/design-system/styles/components.css'
import { MenuProvider } from './store/menu-context'
import { TablesProvider } from './store/tables-context'
import { OrdersProvider } from './store/orders-context'
import { PasswordGate } from './components/PasswordGate'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PasswordGate>
      <MenuProvider>
        <TablesProvider>
          <OrdersProvider>
            <App />
          </OrdersProvider>
        </TablesProvider>
      </MenuProvider>
    </PasswordGate>
  </StrictMode>,
)
