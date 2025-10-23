/**
 * Arquivo de força de exportação do useAuth
 * Garante que useAuth seja incluído no bundle de produção
 * e não seja removido por tree-shaking
 */

// Import e re-export direto
export { AuthProvider, useAuth, AuthContext } from './AuthContext'
export type { User, AuthContextType } from './AuthContext'
