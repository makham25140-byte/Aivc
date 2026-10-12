/**
 * Google Flow Navigation & Security Link Utilities
 *
 * Official URLs:
 * - https://flow.google.com/ (Official direct domain)
 * - https://labs.google/fx/tools/flow (Google Labs FX Flow Studio)
 *
 * Security & Embedding Notice:
 * Google Flow uses strict 'X-Frame-Options: SAMEORIGIN/DENY' and CSP 'frame-ancestors'
 * which strictly prohibits embedding within <iframe> or WebView contexts.
 * Direct user-initiated tab opening (window.open with user gesture or <a target="_blank">)
 * is the only officially compliant and functional method.
 */

export const OFFICIAL_GOOGLE_FLOW_URL = 'https://flow.google.com/';
export const OFFICIAL_GOOGLE_FLOW_LABS_URL = 'https://labs.google/fx/tools/flow';

export interface SafeOpenFlowResult {
  success: boolean;
  isBlockedByPopupBlocker: boolean;
  targetUrl: string;
  errorMessage?: string;
  copiedToClipboard?: boolean;
}

/**
 * Checks whether Google Flow can be embedded in an iframe.
 * Always returns false because Google's security headers prohibit third-party framing.
 */
export function canIframeGoogleFlow(): boolean {
  return false;
}

/**
 * Safely copies prompt text to the system clipboard with multi-tier fallback.
 */
export async function copyPromptToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Navigator clipboard API failed, attempting execCommand fallback:', err);
  }

  // Fallback for restricted clipboard contexts
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.warn('execCommand copy fallback also failed:', err);
    return false;
  }
}

/**
 * Safely opens Google Flow in a new tab without crashing the app or freezing on blank screens.
 * If pop-up blockers prevent window.open, returns a structured result so the UI can
 * display a direct link and retry button.
 */
export async function safeOpenGoogleFlow(
  shotPrompt?: string,
  targetUrl: string = OFFICIAL_GOOGLE_FLOW_URL
): Promise<SafeOpenFlowResult> {
  let copied = false;
  if (shotPrompt) {
    copied = await copyPromptToClipboard(shotPrompt);
  }

  try {
    // Attempt to open the new window/tab safely
    const newWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer');

    // Detect if browser popup blocker suppressed the window
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      return {
        success: false,
        isBlockedByPopupBlocker: true,
        targetUrl,
        errorMessage: 'เบราว์เซอร์บล็อกหน้าต่างใหม่ (Pop-up Blocker) กรุณากดปุ่ม "เปิด Google Flow ในแท็บใหม่" ด้านล่างนี้เพื่อเปิดโดยตรง',
        copiedToClipboard: copied,
      };
    }

    return {
      success: true,
      isBlockedByPopupBlocker: false,
      targetUrl,
      copiedToClipboard: copied,
    };
  } catch (err: any) {
    console.error('Failed to open Google Flow tab:', err);
    return {
      success: false,
      isBlockedByPopupBlocker: true,
      targetUrl,
      errorMessage: 'ไม่สามารถเปิดหน้าต่างใหม่ได้โดยอัตโนมัติ: ' + (err?.message || 'ระบบความปลอดภัยของเบราว์เซอร์บล็อกไว้') + ' กรุณาคลิกปุ่มลิงก์โดยตรง',
      copiedToClipboard: copied,
    };
  }
}
