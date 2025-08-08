/**
 * Copy text to clipboard with fallback methods for better browser compatibility
 * @param text - The text to copy to clipboard
 * @param successMessage - Optional success message to show
 * @returns Promise<boolean> - True if copy was successful
 */
export async function copyToClipboard(text: string, successMessage?: string): Promise<boolean> {
  try {
    // Try modern clipboard API first (requires HTTPS or localhost)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      if (successMessage) {
        alert(successMessage)
      }
      return true
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        const successful = document.execCommand('copy')
        if (successful && successMessage) {
          alert(successMessage)
        }
        return successful
      } catch (err) {
        // If all else fails, show the text for manual copy
        prompt('Copy text manually:', text)
        return false
      } finally {
        document.body.removeChild(textArea)
      }
    }
  } catch (error) {
    console.warn('Clipboard copy failed, showing manual copy option:', error)
    // Final fallback - show prompt for manual copy
    prompt('Copy text manually:', text)
    return false
  }
}

/**
 * Copy text to clipboard with a simple interface
 * @param text - The text to copy
 */
export function copyText(text: string): void {
  copyToClipboard(text, 'Disalin ke clipboard!')
}

/**
 * Copy URL to clipboard with URL-specific message
 * @param url - The URL to copy
 */
export function copyUrl(url: string): void {
  copyToClipboard(url, 'URL disalin ke clipboard!')
}
