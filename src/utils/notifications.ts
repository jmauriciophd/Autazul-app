import { toast } from 'sonner@2.0.3'

export const notify = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 3000,
    })
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 4000,
    })
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 3000,
    })
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 3500,
    })
  },

  loading: (message: string) => {
    return toast.loading(message)
  },

  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId)
  },
}

// Mensagens pré-definidas do sistema
export const messages = {
  auth: {
    loginSuccess: 'Login realizado com sucesso!',
    logoutSuccess: 'Logout realizado com sucesso!',
    signupSuccess: 'Conta criada com sucesso!',
    invalidCredentials: 'Email ou senha incorretos',
    sessionExpired: 'Sua sessão expirou. Faça login novamente.',
  },
  child: {
    addSuccess: 'Filho adicionado com sucesso!',
    addError: 'Erro ao adicionar filho',
    updateSuccess: 'Informações atualizadas!',
    deleteSuccess: 'Filho removido',
  },
  professional: {
    inviteSuccess: 'Convite gerado com sucesso!',
    inviteError: 'Erro ao gerar convite',
    acceptSuccess: 'Você foi vinculado com sucesso!',
    acceptError: 'Erro ao aceitar convite',
    removeSuccess: 'Profissional removido',
    removeError: 'Erro ao remover profissional',
  },
  event: {
    addSuccess: 'Evento cadastrado com sucesso!',
    addError: 'Erro ao cadastrar evento',
    createSuccess: 'Evento cadastrado com sucesso!',
    createError: 'Erro ao cadastrar evento',
    updateSuccess: 'Evento atualizado!',
    deleteSuccess: 'Evento removido',
    loadError: 'Erro ao carregar eventos',
  },
  general: {
    loadError: 'Erro ao carregar dados',
    networkError: 'Erro de conexão. Verifique sua internet.',
    unexpectedError: 'Ocorreu um erro inesperado',
    copySuccess: 'Copiado para a área de transferência!',
  },
}
