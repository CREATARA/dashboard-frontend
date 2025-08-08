import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter ,useNavigate} from 'react-router-dom'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}
const ClerkProviderWithRoutes = () => {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      navigate={(to) => navigate(to)}
    >
      <App />
    </ClerkProvider>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <BrowserRouter>
    <ClerkProviderWithRoutes />
  </BrowserRouter>
  </StrictMode>
  
)
