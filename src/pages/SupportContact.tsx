import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getSupportContact,
  updateSupportContact,
  type SupportContact,
} from '@/lib/api/settings';

const SUPPORT_CONTACT_KEY = ['support-contact'] as const;

export function SupportContactPage() {
  const { data, isLoading } = useQuery({
    queryKey: SUPPORT_CONTACT_KEY,
    queryFn: () => getSupportContact(),
  });

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Contact</h1>
        <p className="text-sm text-gray-500 mt-1">
          Shown on the mobile app's Help &amp; Support screen (including on
          the login screen, before signing in).
        </p>
      </div>

      {isLoading || !data ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : (
        <SupportContactForm initial={data} />
      )}
    </div>
  );
}

// Mounted only once `initial` is available, so the form fields can start
// from it directly instead of hydrating via an effect (which would either
// stomp on in-progress edits on refetch, or need extra state to guard against
// that).
function SupportContactForm({ initial }: { initial: SupportContact }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(initial.supportEmail);
  const [whatsapp, setWhatsapp] = useState(initial.supportWhatsapp);

  const mutation = useMutation({
    mutationFn: (body: SupportContact) => updateSupportContact(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_CONTACT_KEY });
      toast.success('Support contact saved');
    },
    onError: () => toast.error('Could not save support contact'),
  });

  const whatsappValid = /^\d{10,15}$/.test(whatsapp);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSave = emailValid && whatsappValid && !mutation.isPending;

  return (
    <div className="space-y-5 rounded-xl border border-gray-200 bg-white px-5 py-5">
      <div className="space-y-1.5">
        <Label htmlFor="support-email">Support email</Label>
        <Input
          id="support-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="support@example.com"
        />
        {!emailValid && email.length > 0 && (
          <p className="text-xs text-red-500">Enter a valid email address</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="support-whatsapp">WhatsApp number</Label>
        <Input
          id="support-whatsapp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value.replace(/[^\d]/g, ''))}
          placeholder="919876543210"
          maxLength={15}
        />
        <p className="text-xs text-gray-400">
          Digits only, with country code — no "+" or spaces (e.g. 91 for
          India followed by the 10-digit number).
        </p>
        {!whatsappValid && whatsapp.length > 0 && (
          <p className="text-xs text-red-500">
            Enter a valid number with country code, digits only
          </p>
        )}
      </div>

      <Button
        onClick={() => mutation.mutate({ supportEmail: email, supportWhatsapp: whatsapp })}
        disabled={!canSave}
      >
        {mutation.isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  );
}
