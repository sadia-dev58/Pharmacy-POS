function ReceiptPaper({ sale }) {
  const barcodeRef = React.useRef(null);
  const info = useSettings();

  React.useEffect(() => {
    if (barcodeRef.current && window.JsBarcode) {
      try {
        JsBarcode(barcodeRef.current, sale.invoice_number, {
          format: 'CODE128',
          width: 1.6,
          height: 40,
          displayValue: false,
          margin: 0,
        });
      } catch (e) { /* ignore render errors for odd characters */ }
    }
  }, [sale.invoice_number]);

  const saleDate = new Date(sale.sale_date || Date.now());

  return (
    <div className="receipt-paper">
      <div className="r-center">
        {info.pharmacy_logo && <img src={info.pharmacy_logo} alt="" style={{ width: 44, height: 44, objectFit: 'contain', margin: '0 auto 6px' }} />}
        <div className="r-brand">{info.pharmacy_name}</div>
        <div>{info.pharmacy_address}</div>
        <div>{info.pharmacy_phone} · {info.pharmacy_email}</div>
      </div>
      <div className="r-divider"></div>
      <div>Invoice: <strong>{sale.invoice_number}</strong></div>
      <div>Date: {saleDate.toLocaleString()}</div>
      <div>Customer: {sale.customer_name || 'Walk-in Customer'}{sale.customer_phone ? ` (${sale.customer_phone})` : ''}</div>
      <div className="r-divider"></div>

      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Item</th>
            <th style={{ textAlign: 'center' }}>Qty</th>
            <th style={{ textAlign: 'right' }}>Price</th>
            <th style={{ textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((it) => (
            <tr key={it.sale_item_id}>
              <td>{it.medicine_name}{it.dosage ? ` (${it.dosage})` : ''}</td>
              <td style={{ textAlign: 'center' }}>{it.quantity}</td>
              <td style={{ textAlign: 'right' }}>{parseFloat(it.selling_price).toFixed(2)}</td>
              <td style={{ textAlign: 'right' }}>{parseFloat(it.total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="r-divider"></div>
      <div className="r-total-row"><span>Subtotal</span><span>Rs {parseFloat(sale.subtotal).toFixed(2)}</span></div>
      <div className="r-total-row"><span>Discount</span><span>- Rs {parseFloat(sale.discount).toFixed(2)}</span></div>
      <div className="r-total-row"><span>Tax</span><span>+ Rs {parseFloat(sale.tax).toFixed(2)}</span></div>
      <div className="r-total-row r-grand"><span>Total</span><span>Rs {parseFloat(sale.total_amount).toFixed(2)}</span></div>
      <div className="r-total-row"><span>Paid ({sale.payment_method})</span><span>Rs {parseFloat(sale.amount_paid).toFixed(2)}</span></div>
      <div className="r-total-row"><span>Change</span><span>Rs {parseFloat(sale.change_return).toFixed(2)}</span></div>

      <svg ref={barcodeRef} className="r-barcode-svg"></svg>
      <div className="r-center" style={{ marginTop: 6 }}>{info.receipt_footer}</div>
      <div className="r-center" style={{ fontSize: 10, color: '#888' }}>Medicines are non-returnable once dispensed unless defective.</div>
    </div>
  );
}

function ReceiptModal({ sale, onClose }) {
  const info = useSettings();

  function handlePrint() {
    window.print();
  }

  function handleDownloadPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: [226, 550 + sale.items.length * 14] }); // ~80mm width
    let y = 24;
    const centerX = 113;

    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    if (info.pharmacy_logo) {
      try {
        const logoFormat = info.pharmacy_logo.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(info.pharmacy_logo, logoFormat, centerX - 16, y - 12, 32, 32);
        y += 30;
      } catch (e) { /* unsupported image data - skip silently, text header still renders */ }
    }
    doc.text(info.pharmacy_name, centerX, y, { align: 'center' }); y += 14;
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(info.pharmacy_address, centerX, y, { align: 'center' }); y += 10;
    doc.text(`${info.pharmacy_phone} · ${info.pharmacy_email}`, centerX, y, { align: 'center' }); y += 14;

    doc.text(`Invoice: ${sale.invoice_number}`, 14, y); y += 11;
    doc.text(`Date: ${new Date(sale.sale_date).toLocaleString()}`, 14, y); y += 11;
    doc.text(`Customer: ${sale.customer_name || 'Walk-in Customer'}`, 14, y); y += 14;

    doc.text('Item', 14, y);
    doc.text('Qty', 130, y);
    doc.text('Total', 170, y, { align: 'right' });
    y += 8;
    doc.line(14, y, 212, y); y += 10;

    sale.items.forEach((it) => {
      const name = `${it.medicine_name}${it.dosage ? ' (' + it.dosage + ')' : ''}`;
      const wrapped = doc.splitTextToSize(name, 110);
      doc.text(wrapped, 14, y);
      doc.text(String(it.quantity), 130, y);
      doc.text(parseFloat(it.total).toFixed(2), 205, y, { align: 'right' });
      y += 11 * wrapped.length;
    });

    y += 4;
    doc.line(14, y, 212, y); y += 12;

    const rows = [
      ['Subtotal', parseFloat(sale.subtotal).toFixed(2)],
      ['Discount', '-' + parseFloat(sale.discount).toFixed(2)],
      ['Tax', '+' + parseFloat(sale.tax).toFixed(2)],
    ];
    rows.forEach(([label, val]) => {
      doc.text(label, 14, y);
      doc.text(val, 205, y, { align: 'right' });
      y += 11;
    });

    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL', 14, y);
    doc.text('Rs ' + parseFloat(sale.total_amount).toFixed(2), 205, y, { align: 'right' });
    y += 16;

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(`Paid (${sale.payment_method}): Rs ${parseFloat(sale.amount_paid).toFixed(2)}`, 14, y); y += 10;
    doc.text(`Change: Rs ${parseFloat(sale.change_return).toFixed(2)}`, 14, y); y += 18;

    doc.text(info.receipt_footer, centerX, y, { align: 'center' });

    doc.save(`${sale.invoice_number}.pdf`);
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-head no-print">
          <h3>Receipt</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div id="print-receipt-root">
            <ReceiptPaper sale={sale} />
          </div>
          <div className="receipt-actions no-print">
            <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print</button>
            <button className="btn btn-outline" onClick={handleDownloadPdf}>⬇ Download PDF</button>
            <button className="btn btn-outline" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
