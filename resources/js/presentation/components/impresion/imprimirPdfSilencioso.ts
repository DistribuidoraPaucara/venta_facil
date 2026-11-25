/**
 * Imprime un PDF (ticket) sin abrir una pestaña nueva.
 *
 * Carga la URL en un iframe oculto y llama a print(). Si el navegador
 * está abierto con --kiosk-printing (Chrome/Edge), imprime directo a la
 * impresora predeterminada del equipo, sin diálogo.
 *
 * Si la impresión falla, abre el PDF en una pestaña como respaldo.
 */
export function imprimirPdfSilencioso(url: string): void {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');

    iframe.onload = () => {
        try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        } catch (error) {
            console.error('[imprimirPdfSilencioso] Error al imprimir, abriendo PDF en pestaña:', error);
            window.open(url, '_blank');
        }
        // Dar tiempo al diálogo/cola de impresión antes de quitar el iframe
        setTimeout(() => iframe.remove(), 60_000);
    };

    iframe.onerror = () => {
        console.error('[imprimirPdfSilencioso] No se pudo cargar el ticket:', url);
        iframe.remove();
    };

    iframe.src = url;
    document.body.appendChild(iframe);
}
