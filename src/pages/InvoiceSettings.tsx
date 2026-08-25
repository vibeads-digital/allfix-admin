import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  getInvoiceSettings,
  updateInvoiceSettings,
  type InvoiceSettings,
} from '@/lib/api/settings';

const INVOICE_SETTINGS_KEY = ['invoice-settings'] as const;

export function InvoiceSettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: INVOICE_SETTINGS_KEY,
    queryFn: () => getInvoiceSettings(),
  });

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoice Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Company / GST identity shown on every generated tax invoice, in the
          mobile app and here in the admin panel.
        </p>
      </div>

      {isLoading || !data ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : (
        <InvoiceSettingsForm initial={data} />
      )}
    </div>
  );
}

// Mounted only once `initial` is available, so the form fields can start
// from it directly instead of hydrating via an effect.
function InvoiceSettingsForm({ initial }: { initial: InvoiceSettings }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InvoiceSettings>(initial);

  const set = <K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const mutation = useMutation({
    mutationFn: (body: InvoiceSettings) => updateInvoiceSettings(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_SETTINGS_KEY });
      toast.success('Invoice settings saved');
    },
    onError: () => toast.error('Could not save invoice settings'),
  });

  const gstinValid = form.gstin === '' || /^[0-9A-Z]{15}$/.test(form.gstin);
  const panValid = form.pan === '' || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.pan);
  const canSave =
    form.companyName.trim().length > 0 &&
    form.legalEntityName.trim().length > 0 &&
    form.registeredAddress.trim().length > 0 &&
    form.companyState.trim().length > 0 &&
    gstinValid &&
    panValid &&
    !mutation.isPending;

  return (
    <div className="space-y-5 rounded-xl border border-gray-200 bg-white px-5 py-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Company name (brand)">
          <Input
            value={form.companyName}
            onChange={(e) => set('companyName', e.target.value)}
            placeholder="AllFLix"
          />
        </Field>
        <Field label="Legal entity name">
          <Input
            value={form.legalEntityName}
            onChange={(e) => set('legalEntityName', e.target.value)}
            placeholder="Registered company name"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="GSTIN" error={!gstinValid ? 'Enter a valid 15-character GSTIN' : undefined}>
          <Input
            value={form.gstin}
            onChange={(e) => set('gstin', e.target.value.toUpperCase())}
            placeholder="27AANCR0572L1ZW"
            maxLength={15}
          />
        </Field>
        <Field label="PAN (optional)" error={!panValid ? 'Enter a valid 10-character PAN' : undefined}>
          <Input
            value={form.pan}
            onChange={(e) => set('pan', e.target.value.toUpperCase())}
            placeholder="AANCR0572L"
            maxLength={10}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="CIN (optional)">
          <Input value={form.cin} onChange={(e) => set('cin', e.target.value)} />
        </Field>
        <Field label="Company state (for GST place of supply)">
          <Input
            value={form.companyState}
            onChange={(e) => set('companyState', e.target.value)}
            placeholder="Maharashtra"
          />
        </Field>
      </div>

      <Field label="Registered address">
        <Textarea
          value={form.registeredAddress}
          onChange={(e) => set('registeredAddress', e.target.value)}
          rows={3}
        />
      </Field>

      <Field label="Corporate address (optional — falls back to registered address)">
        <Textarea
          value={form.corporateAddress}
          onChange={(e) => set('corporateAddress', e.target.value)}
          rows={3}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Website (optional)">
          <Input
            value={form.website}
            onChange={(e) => set('website', e.target.value)}
            placeholder="https://allflix.dharvix.com"
          />
        </Field>
        <Field label="HSN/SAC code">
          <Input
            value={form.hsnSac}
            onChange={(e) => set('hsnSac', e.target.value)}
            placeholder="e.g. 998431"
          />
        </Field>
      </div>

      <Field label="GST rate (%)">
        <Input
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={form.gstRate}
          onChange={(e) => set('gstRate', Number(e.target.value))}
          className="w-32"
        />
      </Field>
      <p className="text-xs text-gray-400 -mt-3">
        Split evenly into CGST + SGST when the customer's billing state
        matches the company state above, otherwise charged in full as IGST.
      </p>

      <Button onClick={() => mutation.mutate(form)} disabled={!canSave}>
        {mutation.isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
