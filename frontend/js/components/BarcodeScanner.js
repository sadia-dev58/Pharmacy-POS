/**
 * useHardwareScanner
 * Most USB/Bluetooth barcode scanners behave like a keyboard: they "type"
 * the barcode digits very fast and then send an Enter keystroke.
 * This hook listens globally, buffers fast keystrokes, and fires onScan()
 * when it sees the Enter terminator - no dedicated input focus required.
 */
function useHardwareScanner(onScan, enabled = true) {
  React.useEffect(() => {
    if (!enabled) return;
    let buffer = '';
    let lastTime = 0;

    function handleKeydown(e) {
      // Ignore if the user is typing in a normal text field (except our own scan input)
      const tag = (e.target.tagName || '').toLowerCase();
      const isEditable = tag === 'input' || tag === 'textarea';
      if (isEditable && !e.target.dataset.scanTarget) return;

      const now = Date.now();
      if (now - lastTime > 60) buffer = ''; // gap too long -> human typing, reset
      lastTime = now;

      if (e.key === 'Enter') {
        const code = buffer.trim();
        if (code.length >= 4) {
          onScan(code);
        }
        buffer = '';
        return;
      }
      if (e.key.length === 1) {
        buffer += e.key;
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [onScan, enabled]);
}

/** Short beep on successful scan - generated in-browser, no audio file needed */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1046.5; // C6 - a clean, audible "scanner beep" pitch
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    osc.onended = () => ctx.close();
  } catch (e) { /* Web Audio unsupported/blocked - scan still works, just silent */ }
}

/**
 * CameraBarcodeModal
 * Opens the laptop's webcam via html5-qrcode and scans standard barcode/QR
 * formats. This is the primary scanning method for this app (built for
 * scanning with a laptop camera rather than a dedicated USB scanner).
 *
 * Stays open across multiple scans so the user can ring up several items
 * in a row without reopening the camera each time; a short debounce stops
 * the same barcode firing repeatedly while it's still in frame.
 */
function CameraBarcodeModal({ onDetected, onClose }) {
  const scannerRef = React.useRef(null);
  const lastScan = React.useRef({ code: '', time: 0 });
  const [status, setStatus] = React.useState('Starting camera…');
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState(null); // { ok, message, code }
  const [manualCode, setManualCode] = React.useState('');
  const [cameraReady, setCameraReady] = React.useState(false);
  const [frameCount, setFrameCount] = React.useState(0);
  const [busy, setBusy] = React.useState(false);

  // Always call the LATEST onDetected without needing it in the effect's
  // dependency array below - this is what stops the camera from being
  // torn down and restarted every time the parent screen re-renders
  // (e.g. when the cart updates, a toast shows, etc). That restart loop
  // was the actual reason scans never seemed to register.
  const onDetectedRef = React.useRef(onDetected);
  React.useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);

  async function handleDetection(code) {
    setBusy(true);
    setResult(null);
    try {
      const res = await onDetectedRef.current(code);
      // res is { ok, message } from POS's handleBarcodeScan - falls back to a
      // generic success if the caller doesn't return a structured result.
      setResult(res ? { ...res, code } : { ok: true, message: `Scanned ${code}`, code });
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    let html5QrCode;
    let cancelled = false;

    async function start() {
      try {
        html5QrCode = new Html5Qrcode('camera-scan-region', false);
        scannerRef.current = html5QrCode;
        // Barcodes are wide and short (unlike QR codes) - a wider scan box
        // lines up with how a pharmacy barcode actually sits in frame and
        // detects noticeably faster than a square box.
        const config = { fps: 15, qrbox: { width: 320, height: 130 }, aspectRatio: 1.6 };

        // "environment" is requested first (back camera on phones/tablets);
        // on a laptop with a single built-in webcam the browser simply
        // falls back to that camera automatically.
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (cancelled) return;
            const code = decodedText.trim();
            const now = Date.now();
            // Ignore the same code re-firing while still in frame (< 2s apart)
            if (code === lastScan.current.code && now - lastScan.current.time < 2000) return;
            lastScan.current = { code, time: now };
            playBeep();
            handleDetection(code);
          },
          () => {
            // Fires on every frame where no barcode was found (very frequent) -
            // used here purely as a heartbeat so the UI can prove the camera
            // is actively analyzing frames, not frozen.
            if (!cancelled) setFrameCount((n) => n + 1);
          }
        );
        setCameraReady(true);
        setStatus('Point the camera at a barcode');
      } catch (err) {
        setError('Could not access camera: ' + (err.message || err) + '. Check your browser\'s camera permission for this page, or type the barcode below instead.');
      }
    }

    start();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {});
      }
    };
  }, []); // deliberately empty - camera starts once per modal-open, never restarts mid-session

  function submitManual(e) {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    playBeep();
    handleDetection(code);
    setManualCode('');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Scan barcode</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div id="camera-scan-region"></div>

          {error ? (
            <div className="scan-status" style={{ color: 'var(--color-danger)' }}>{error}</div>
          ) : (
            <div className="scan-live-status">
              {cameraReady && <span className="scan-live-dot"></span>}
              <span>{status}</span>
              {cameraReady && <span className="text-muted" style={{ marginLeft: 6 }}>({frameCount} frames analyzed)</span>}
            </div>
          )}

          {busy && (
            <div className="scan-status">Checking inventory…</div>
          )}

          {result && !busy && (
            <div className={`scan-result-banner ${result.ok ? 'ok' : 'error'}`}>
              <div>
                {result.ok
                  ? <>✓ Added to cart: <strong>{result.name || result.code}</strong></>
                  : <>✕ {result.message}</>}
              </div>
              <button type="button" className="scan-result-dismiss" onClick={() => setResult(null)}>&times;</button>
            </div>
          )}

          <form onSubmit={submitManual} className="scan-manual-entry">
            <input
              placeholder="Camera not reading it? Type the barcode here…"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <button type="submit" className="btn btn-outline btn-sm">Add</button>
          </form>

          <div className="scan-tips">
            <strong>For a faster scan:</strong> hold the barcode ~15–20cm from the camera, flat (not angled), well-lit, and fill the wide box above with it — the camera reads 1D barcodes fastest when they're horizontal and not too close or too far.
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-primary" onClick={onClose}>Done scanning</button>
        </div>
      </div>
    </div>
  );
}
