/**
 * Arquivo de força de exportação do useAuth
 * Garante que useAuth seja incluído no bundle de produção
 * e não seja removido por tree-shaking
 */

// Import direto
import { AuthProvider as AP, useAuth as UA, AuthContext as AC } from './AuthContext'
import type { User as U, AuthContextType as ACT } from './AuthContext'

// Re-export com aliases explícitos
export const AuthProvider = AP
export const useAuth = UA
export const AuthContext = AC
export type User = U
export type AuthContextType = ACT

// Export default para garantir
export { AP as default }