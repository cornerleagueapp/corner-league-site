export async function printAdmissionPass(element: HTMLElement) {
  const previous = document.activeElement as HTMLElement | null;
  const frame = document.createElement("iframe");
  frame.title = "Print admission pass";
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("sandbox", "allow-same-origin allow-modals");
  Object.assign(frame.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "800px",
    height: "1100px",
    border: "0",
  });
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc || !frame.contentWindow) {
    frame.remove();
    throw new Error("Printing is unavailable in this browser.");
  }
  doc.open();
  doc.write(
    '<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Corner League admission pass</title></head><body></body></html>',
  );
  doc.close();
  const style = doc.createElement("style");
  style.textContent = `
 @page {size:auto;margin:12mm} *{box-sizing:border-box} body{margin:0;background:white;font:12px Arial,sans-serif;color:#092031}
 article{width:340px;max-width:100%;margin:0 auto;border:1px solid #ccc;border-top-width:5px;border-radius:12px;overflow:hidden;break-inside:avoid;print-color-adjust:exact;-webkit-print-color-adjust:exact}
 .admission-cover{display:block;width:100%;height:100px!important;object-fit:contain;background:#f4f4f4}
 .admission-cover-fallback{display:none} .admission-pass-info{padding:16px;text-align:center} h2{overflow-wrap:anywhere;font-size:21px;line-height:1.2;margin:10px 0}h3{font-size:15px;margin:8px 0}p{margin:8px 0;overflow-wrap:anywhere;white-space:pre-wrap}
 .admissions-eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.1em}.admission-status{font-size:10px;font-weight:bold}.admission-qr{background:white;padding:10px;margin:12px auto;width:200px;height:200px}.admission-qr img{display:block;width:180px;height:180px}
 .admission-muted{font-size:9px}.pass-description{display:none}
 .studio-pass-container{border:0!important;background:transparent!important} .studio-issued-pass{margin:0} .studio-issued-pass svg{display:block;width:100%;height:auto;max-height:245mm} .sr-only{display:none}
 `;
  doc.head.appendChild(style);
  doc.body.appendChild(element.cloneNode(true));
  await Promise.all(
    Array.from(doc.images).map((img) =>
      Promise.race([
        img.decode?.().catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]),
    ),
  );
  const cleanup = () => {
    frame.remove();
    if (previous?.isConnected) previous.focus({ preventScroll: true });
  };
  frame.contentWindow.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(cleanup, 120000);
  frame.contentWindow.focus();
  frame.contentWindow.print();
}

// Also isolate the selected ticket when the browser's own Print command is used.
export function registerAdmissionPrinting(getPass: () => HTMLElement | null) {
  const remove = () =>
    document.getElementById("cl-ticket-print-root")?.remove();
  const before = () => {
    remove();
    const pass = getPass();
    if (!pass) return;
    const root = document.createElement("div");
    root.id = "cl-ticket-print-root";
    root.style.display = "none";
    root.appendChild(pass.cloneNode(true));
    const style = document.createElement("style");
    style.textContent = `@media print { @page{margin:12mm} html,body{background:white!important;min-height:0!important;height:auto!important}body::before,body::after{display:none!important}body>*:not(#cl-ticket-print-root){display:none!important} #cl-ticket-print-root{display:block!important;background:white!important;color:#092031!important;min-height:0!important;height:auto!important;padding:0!important;margin:0!important;border:0!important} #cl-ticket-print-root article{width:340px;max-width:100%;margin:0 auto;break-inside:avoid;print-color-adjust:exact;-webkit-print-color-adjust:exact} #cl-ticket-print-root .admission-cover{height:100px!important;aspect-ratio:auto;object-fit:contain} #cl-ticket-print-root .admission-pass-info{padding:16px;font:12px Arial,sans-serif} #cl-ticket-print-root h2{font-size:21px} #cl-ticket-print-root .admission-qr{width:200px;height:200px;margin:12px auto} #cl-ticket-print-root .admission-qr img{width:180px;height:180px} #cl-ticket-print-root .pass-description{display:none} }`;
    root.appendChild(style);
    document.body.appendChild(root);
  };
  window.addEventListener("beforeprint", before);
  window.addEventListener("afterprint", remove);
  return () => {
    window.removeEventListener("beforeprint", before);
    window.removeEventListener("afterprint", remove);
    remove();
  };
}
