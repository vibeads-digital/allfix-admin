import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  getGatewayConfig,
  updateGatewayConfig,
  type GatewayConfig,
} from '@/lib/api/subscription';

const GATEWAY_LABEL: Record<GatewayConfig['gateway'], string> = {
  razorpay: 'Razorpay',
  easebuzz: 'EaseBuzz',
  payu: 'PayU CheckoutPro',
  cashfree: 'Cashfree',
  sabpaisa: 'SabPaisa',
  paytm: 'Paytm',
  airpay: 'Airpay',
};

const GATEWAY_KEY = ['gateway-config'] as const;

export function GatewayConfigPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: GATEWAY_KEY,
    queryFn: () => getGatewayConfig(),
  });

  const gateways = data?.gateways ?? [];

  const mutation = useMutation({
    mutationFn: (configs: Pick<GatewayConfig, 'gateway' | 'isActive' | 'isDefault'>[]) =>
      updateGatewayConfig(configs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GATEWAY_KEY });
      toast.success('Gateway settings saved');
    },
    onError: () => toast.error('Could not save settings'),
  });

  const update = (
    gateway: GatewayConfig['gateway'],
    field: 'isActive' | 'isDefault',
    value: boolean,
  ) => {
    const updated = gateways.map((g) => {
      const base = { gateway: g.gateway, isActive: g.isActive, isDefault: g.isDefault };
      if (g.gateway === gateway) {
        if (field === 'isActive') return { ...base, isActive: value, isDefault: value ? base.isDefault : false };
        if (field === 'isDefault') return { ...base, isDefault: value, isActive: value ? true : base.isActive };
      }
      // Only one default allowed — clear others when setting a new default.
      if (field === 'isDefault' && value) return { ...base, isDefault: false };
      return base;
    });
    mutation.mutate(updated);
  };

  const activeCount = gateways.filter((g) => g.isActive).length;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Gateways</h1>
        <p className="text-sm text-gray-500 mt-1">
          Credentials are stored in <code className="bg-gray-100 px-1 rounded">.env</code> — toggle which gateways are active and set the default.
          {activeCount === 1 && (
            <span className="ml-2 text-amber-600 font-medium">
              Single gateway mode — selector hidden from users.
            </span>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-3">
          {gateways.map((g) => (
            <div
              key={g.gateway}
              className={`flex items-center justify-between rounded-xl border px-5 py-4 transition-colors ${
                g.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-800">{GATEWAY_LABEL[g.gateway]}</span>
                {g.isDefault && g.isActive && (
                  <Badge variant="secondary" className="text-[11px] bg-amber-50 text-amber-700 border-amber-200">
                    Default
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`${g.gateway}-default`}
                    checked={g.isDefault && g.isActive}
                    disabled={mutation.isPending || !g.isActive}
                    onCheckedChange={(v) => update(g.gateway, 'isDefault', v)}
                  />
                  <Label htmlFor={`${g.gateway}-default`} className="text-xs text-gray-500 cursor-pointer">
                    Default
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id={`${g.gateway}-active`}
                    checked={g.isActive}
                    disabled={mutation.isPending || (g.isActive && activeCount === 1)}
                    onCheckedChange={(v) => update(g.gateway, 'isActive', v)}
                  />
                  <Label htmlFor={`${g.gateway}-active`} className="text-xs text-gray-500 cursor-pointer">
                    Active
                  </Label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        At least one gateway must remain active. Disabling the last active gateway is blocked.
      </p>
    </div>
  );
}
