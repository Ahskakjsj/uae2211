/**
 * Alzaabi Cyber Shield - Complete Client Protection & Encryption Engine
 * Blocks F12, DevTools shortcuts, Right-Click, Code Stealing & Tampering
 */

export function initSecurityShield() {
  if (typeof window === 'undefined') return;

  // 1. Prevent Right-Click Context Menu
  const handleContextMenu = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    // Allow right click inside text inputs or textareas for standard paste/cut
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('alzaabi-security-blocked', { detail: { reason: 'right-click' } }));
    return false;
  };

  // 2. Prevent F12, Inspect, View-Source, Save Page Shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    // Check F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('alzaabi-security-blocked', { detail: { reason: 'f12' } }));
      return false;
    }

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    // Inspect: Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
    if (isCtrlOrCmd && e.shiftKey) {
      const k = e.key.toUpperCase();
      if (k === 'I' || k === 'J' || k === 'C' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67) {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('alzaabi-security-blocked', { detail: { reason: 'inspect' } }));
        return false;
      }
    }

    // View Source: Ctrl+U
    if (isCtrlOrCmd && (e.key.toUpperCase() === 'U' || e.keyCode === 85)) {
      e.preventDefault();
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('alzaabi-security-blocked', { detail: { reason: 'view-source' } }));
      return false;
    }

    // Save Page: Ctrl+S
    if (isCtrlOrCmd && (e.key.toUpperCase() === 'S' || e.keyCode === 83)) {
      e.preventDefault();
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('alzaabi-security-blocked', { detail: { reason: 'save-page' } }));
      return false;
    }

    // Print: Ctrl+P
    if (isCtrlOrCmd && (e.key.toUpperCase() === 'P' || e.keyCode === 80)) {
      e.preventDefault();
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('alzaabi-security-blocked', { detail: { reason: 'save-page' } }));
      return false;
    }
  };

  // 3. Prevent Dragging elements/images to desktop
  const handleDragStart = (e: DragEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'IMG' || target.classList.contains('no-drag'))) {
      e.preventDefault();
      return false;
    }
  };

  // 4. Anti-Debugger Deterrence Loop (Low overhead)
  let lastTime = Date.now();
  const antiDebugTimer = setInterval(() => {
    // Only check when window has focus and page is active
    if (document.hidden) return;
    const currentTime = Date.now();
    // If debugger paused JavaScript execution, time delta will be unnaturally large (> 3500ms)
    if (currentTime - lastTime > 3500) {
      window.dispatchEvent(new CustomEvent('alzaabi-security-blocked', { detail: { reason: 'inspect' } }));
    }
    lastTime = currentTime;
  }, 2000);

  // Attach event listeners with capture phase for maximum interception priority
  window.addEventListener('contextmenu', handleContextMenu, true);
  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('dragstart', handleDragStart, true);

  return () => {
    window.removeEventListener('contextmenu', handleContextMenu, true);
    window.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('dragstart', handleDragStart, true);
    clearInterval(antiDebugTimer);
  };
}
