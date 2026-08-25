import { useState } from 'react';
import { ArrowUpDown, Download, Eye, Receipt } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePageSearch } from '@/store/topbar-search';
import {
  adminListPayments,
  getAdminInvoice,
  type AdminPayment,
  type PaymentStatus,
} from '@/lib/api/subscription';
import { buildInvoiceHtml } from '@/lib/invoiceHtml';
import { todayIstIso } from '@/lib/utils';

const PAYMENTS_KEY = ['payments', 'admin'] as const;
const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  granted: 'Granted',
  failed: 'Failed',
  refunded: 'Refunded',
  partially_refunded: 'Partially Refunded',
};
// Payments only ever land in these three states in practice — admin grants
// don't create a payment row, and there's no refund flow yet, so those
// options in the filter would never match anything.
const FILTER_STATUSES: PaymentStatus[] = ['pending', 'completed', 'failed'];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'createdAt:desc', label: 'Recently added' },
  { value: 'createdAt:asc', label: 'Oldest added' },
  { value: 'amount:desc', label: 'Amount (high-low)' },
  { value: 'amount:asc', label: 'Amount (low-high)' },
];

function formatAmount(amount: string, currency: string) {
  const sign = currency === 'INR' ? '₹' : `${currency} `;
  return `${sign}${Number(amount).toLocaleString('en-IN')}`;
}

export function PaymentsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<PaymentStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState(todayIstIso);
  const [dateTo, setDateTo] = useState(todayIstIso);
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<AdminPayment | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const pageSize = 10;

  const handleDownloadInvoice = async (paymentId: number) => {
    setDownloadingInvoice(true);
    try {
      const invoice = await getAdminInvoice(paymentId);
      const html = buildInvoiceHtml(invoice);
      // A same-origin blob URL (rather than document.write on about:blank)
      // keeps the popup blocker happy across browsers and avoids CSP issues
      // with inline scripts on the opener's own origin.
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) {
        toast.error('Please allow pop-ups to download the invoice');
      }
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      toast.error('Could not load invoice for this payment');
    } finally {
      setDownloadingInvoice(false);
    }
  };
  usePageSearch('Search by name, email or mobile…', q, (v) => {
    setQ(v);
    setPage(1);
  });

  const [orderBy, order] = sort.split(':') as ['createdAt' | 'amount', 'asc' | 'desc'];

  const { data, isLoading } = useQuery({
    queryKey: [...PAYMENTS_KEY, status, dateFrom, dateTo, sort, q, page],
    queryFn: () =>
      adminListPayments({
        status,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        order,
        orderBy,
        search: q || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
  });

  const payments = data?.payments ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PageHeader
        title="Payments"
        description={`${total} transaction${total === 1 ? '' : 's'}`}
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as PaymentStatus | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {FILTER_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 w-[170px]">
              <ArrowUpDown className="size-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="h-9 w-auto text-sm"
              aria-label="From date"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="h-9 w-auto text-sm"
              aria-label="To date"
            />
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">
          Loading…
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payments found"
          description="No transactions match these filters."
        />
      ) : (
        <Card className="overflow-hidden p-0 gap-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/30">
                  <th className="px-4 py-3">User</th>
                  <th className="px-2 py-3">Plan</th>
                  <th className="px-2 py-3">Amount</th>
                  <th className="px-2 py-3">Method</th>
                  <th className="px-2 py-3">Date</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  // Show every identifier the account actually has (name,
                  // email, phone) instead of hiding all but one — phone-only
                  // accounts otherwise rendered a blank cell.
                  const [primary, ...rest] = [
                    p.userFullname,
                    p.userEmail,
                    p.userPhone,
                  ].filter((v): v is string => Boolean(v));
                  const secondary = rest.join(' • ') || null;
                  return (
                  <tr
                    key={p.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium truncate">{primary ?? 'Unknown'}</div>
                      {secondary && (
                        <div className="text-xs text-muted-foreground truncate">
                          {secondary}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {p.planName}
                    </td>
                    <td className="px-2 py-3 font-medium tabular-nums">
                      {formatAmount(p.amount, p.currency)}
                    </td>
                    <td className="px-2 py-3 text-muted-foreground capitalize">
                      {p.paymentMethod ?? p.gateway ?? '—'}
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-3">
                      <StatusBadge status={STATUS_LABEL[p.status]} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-7"
                        aria-label="View"
                        onClick={() => setActive(p)}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-3 border-t border-border text-xs text-muted-foreground">
            <span>
              Showing {payments.length} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {formatAmount(active.amount, active.currency)} —{' '}
                  {active.planName}
                </DialogTitle>
                <DialogDescription>
                  {[active.userFullname, active.userEmail, active.userPhone]
                    .filter(Boolean)
                    .join(' • ')} • #{active.id}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Status" value={<StatusBadge status={STATUS_LABEL[active.status]} />} />
                <Stat label="Type" value={active.paymentType} />
                <Stat label="Method" value={active.paymentMethod ?? '—'} />
                <Stat label="Gateway" value={active.gateway ?? '—'} />
                <Stat
                  label="Paid at"
                  value={active.paidAt ? new Date(active.paidAt).toLocaleString() : '—'}
                />
                <Stat
                  label="Created"
                  value={new Date(active.createdAt).toLocaleString()}
                />
                {active.gatewayOrderId && (
                  <Stat label="Gateway order ID" value={active.gatewayOrderId} />
                )}
                {active.gatewayPaymentId && (
                  <Stat label="Gateway payment ID" value={active.gatewayPaymentId} />
                )}
                {Number(active.refundAmount) > 0 && (
                  <Stat
                    label="Refunded"
                    value={`${formatAmount(active.refundAmount, active.currency)}${active.refundedAt ? ` on ${new Date(active.refundedAt).toLocaleDateString()}` : ''}`}
                  />
                )}
                {active.failureReason && (
                  <Stat label="Failure reason" value={active.failureReason} />
                )}
              </div>

              {active.status === 'completed' && (
                <Button
                  variant="outline"
                  className="w-full mt-1"
                  disabled={downloadingInvoice}
                  onClick={() => handleDownloadInvoice(active.id)}
                >
                  <Download className="size-4" />
                  {downloadingInvoice ? 'Preparing invoice…' : 'Download invoice'}
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3 bg-muted/20">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-semibold mt-0.5 capitalize">{value}</div>
    </div>
  );
}
