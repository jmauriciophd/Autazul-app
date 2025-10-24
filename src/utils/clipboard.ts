/**
 * Utilitário para copiar texto para a área de transferência
 * Com fallback para ambientes que bloqueiam Clipboard API
 */

/**
 * Copia texto para a área de transferência usando múltiplas estratégias
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Estratégia 1: Clipboard API moderna (preferida)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.warn('Clipboard API bloqueada, tentando fallback:', error)
      // Continua para o fallback
    }
  }

  // Estratégia 2: Fallback usando execCommand (depreciado mas funciona)
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    
    // Torna o textarea invisível
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '-9999px'
    textArea.style.opacity = '0'
    textArea.setAttribute('readonly', '')
    
    document.body.appendChild(textArea)
    
    // Seleciona o texto
    textArea.select()
    textArea.setSelectionRange(0, text.length)
    
    // Copia usando execCommand
    const successful = document.execCommand('copy')
    
    // Remove o elemento
    document.body.removeChild(textArea)
    
    if (successful) {
      return true
    }
  } catch (error) {
    console.error('Fallback de clipboard também falhou:', error)
  }

  // Estratégia 3: Última tentativa com seleção manual
  try {
    const range = document.createRange()
    const selection = window.getSelection()
    const tempDiv = document.createElement('div')
    
    tempDiv.textContent = text
    tempDiv.style.position = 'fixed'
    tempDiv.style.left = '-9999px'
    
    document.body.appendChild(tempDiv)
    
    if (selection) {
      selection.removeAllRanges()
      range.selectNodeContents(tempDiv)
      selection.addRange(range)
      
      const successful = document.execCommand('copy')
      selection.removeAllRanges()
      document.body.removeChild(tempDiv)
      
      if (successful) {
        return true
      }
    }
  } catch (error) {
    console.error('Última tentativa de clipboard falhou:', error)
  }

  return false
}

/**
 * Verifica se a Clipboard API está disponível e não bloqueada
 */
export function isClipboardAvailable(): boolean {
  return !!(navigator.clipboard && navigator.clipboard.writeText)
}

/**
 * Lê texto da área de transferência
 */
export async function readFromClipboard(): Promise<string | null> {
  if (!navigator.clipboard || !navigator.clipboard.readText) {
    console.warn('Clipboard read não suportado')
    return null
  }

  try {
    const text = await navigator.clipboard.readText()
    return text
  } catch (error) {
    console.warn('Erro ao ler clipboard:', error)
    return null
  }
}
