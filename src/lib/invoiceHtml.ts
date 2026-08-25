import type { InvoiceDetail } from './api/subscription';

const GATEWAY_LABEL: Record<string, string> = {
  razorpay: 'Razorpay',
  easebuzz: 'EaseBuzz',
  payu: 'PayU',
  cashfree: 'Cashfree',
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  trial: 'Trial Subscription',
  subscription: 'Subscription',
  renewal: 'Renewal',
  upgrade: 'Plan Upgrade',
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatMoney(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// One row of a plain label/value table — omitted entirely when the value is
// blank, so optional company/customer fields (PAN, CIN, corporate address…)
// don't render as empty rows.
function row(label: string, value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return '';
  return `<tr><td class="label">${escapeHtml(label)}</td><td>${escapeHtml(String(value))}</td></tr>`;
}

// Mirrors mobile/src/lib/invoiceHtml.ts — same tax invoice layout, rendered
// here for the browser's own print-to-PDF instead of expo-print.
export function buildInvoiceHtml(invoice: InvoiceDetail): string {
  const { company, tax, payment, plan, subscription, user } = invoice;
  const invoiceDate = formatDate(invoice.issuedAt ?? invoice.createdAt);
  const gatewayLabel = payment.gateway ? (GATEWAY_LABEL[payment.gateway] ?? payment.gateway) : '—';
  const paymentTypeLabel = PAYMENT_TYPE_LABEL[payment.paymentType] ?? payment.paymentType;
  const isIntraState = tax.cgstAmount > 0 || tax.sgstAmount > 0;
  const supportPhone = company.supportWhatsapp ? `+${company.supportWhatsapp}` : '';

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="company-name">${escapeHtml(company.companyName)}</div>
      <div class="legal-name">${escapeHtml(company.legalEntityName)}</div>
    </div>
    <div class="invoice-title">TAX INVOICE</div>
  </div>

  <table class="info-table">
    ${row('GSTIN', company.gstin)}
    ${row('PAN', company.pan)}
    ${row('CIN', company.cin)}
    ${row('Registered Address', company.registeredAddress)}
    ${row('Corporate Address', company.corporateAddress)}
    ${row('Support Email', company.supportEmail)}
    ${row('Website', company.website)}
    ${row('Phone', supportPhone)}
  </table>

  <div class="section-title">Invoice Details</div>
  <table class="info-table">
    ${row('Invoice No.', invoice.invoiceNumber)}
    ${row('Invoice Date', invoiceDate)}
    ${row('Order ID', payment.gatewayOrderId)}
    ${row('Subscription ID', subscription.id)}
    ${row('Payment Gateway Transaction ID', payment.gatewayPaymentId)}
    ${row('Payment Gateway', gatewayLabel)}
    ${row('Payment Mode', paymentTypeLabel)}
  </table>

  <div class="section-title">Customer Details</div>
  <table class="info-table">
    ${row('Customer Name', user.fullname)}
    ${row('Email', user.email)}
    ${row('Mobile', user.phone)}
  </table>

  <div class="section-title">Subscription Details</div>
  <table class="items-table">
    <thead>
      <tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>${escapeHtml(plan.name)}</td>
        <td>1</td>
        <td>₹${formatMoney(tax.taxableAmount)}</td>
        <td>₹${formatMoney(tax.taxableAmount)}</td>
      </tr>
    </tbody>
  </table>
  <div class="muted">
    Subscription Period: ${formatDate(subscription.startAt)} to ${formatDate(subscription.endAt)}
  </div>

  <div class="section-title">Tax Breakup</div>
  <table class="info-table">
    ${row('Subtotal', `₹${formatMoney(tax.taxableAmount)}`)}
    ${
      isIntraState
        ? `${row(`CGST @${tax.cgstRate}%`, `₹${formatMoney(tax.cgstAmount)}`)}
           ${row(`SGST @${tax.sgstRate}%`, `₹${formatMoney(tax.sgstAmount)}`)}`
        : row(`IGST @${tax.igstRate}%`, `₹${formatMoney(tax.igstAmount)}`)
    }
    <tr class="total-row"><td class="label">Grand Total</td><td>₹${formatMoney(tax.totalAmount)}</td></tr>
  </table>

  <div class="section-title">Service Details</div>
  <table class="info-table">
    ${row('HSN/SAC', company.hsnSac)}
    ${row('Place of Supply', tax.placeOfSupply)}
    ${row('Currency', payment.currency)}
  </table>

  <div class="section-title">Payment Details</div>
  <table class="info-table">
    ${row('Amount Paid', `₹${formatMoney(tax.totalAmount)}`)}
    ${row('Payment Status', invoice.status === 'issued' ? 'Paid' : invoice.status)}
    ${row('Paid On', payment.paidAt ? formatDate(payment.paidAt) : null)}
    ${row('Gateway Reference', payment.gatewayPaymentId)}
  </table>

  <div class="section-title">Terms &amp; Conditions</div>
  <ul class="terms">
    <li>This invoice is generated electronically and does not require a physical signature.</li>
    <li>Subscription is valid only for the purchased period.</li>
    <li>Subscription fees are non-refundable except where required by applicable law.</li>
    <li>The service is governed by the platform's Terms of Use and Privacy Policy.</li>
    <li>All applicable taxes have been charged as per prevailing GST laws.</li>
  </ul>
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`;
}

const CSS = `
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 0; }
  .page { padding: 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 16px; }
  .company-name { font-size: 20px; font-weight: 800; }
  .legal-name { font-size: 12px; color: #555; margin-top: 2px; }
  .invoice-title { font-size: 18px; font-weight: 800; letter-spacing: 1px; }
  .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 18px; margin-bottom: 6px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .info-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  .info-table td { padding: 3px 0; vertical-align: top; }
  .info-table td.label { color: #666; width: 45%; }
  .items-table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 4px; }
  .items-table th, .items-table td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  .items-table th { background: #f3f3f3; }
  .muted { font-size: 11.5px; color: #666; margin-top: 6px; }
  .total-row td { font-weight: 800; border-top: 1px solid #999; padding-top: 6px; }
  .terms { font-size: 11px; color: #555; padding-left: 18px; margin: 4px 0; }
  .terms li { margin-bottom: 3px; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;
