import { apiGet, apiPatch } from "./client";

export type SupportContact = {
  supportEmail: string;
  supportWhatsapp: string;
};

// Public endpoint (no auth) — same one the mobile app reads from.
export const getSupportContact = () =>
  apiGet<SupportContact>("/settings/support-contact");

export const updateSupportContact = (body: SupportContact) =>
  apiPatch<SupportContact>("/settings/admin/support-contact", body);

export type InvoiceSettings = {
  companyName: string;
  legalEntityName: string;
  gstin: string;
  pan: string;
  cin: string;
  registeredAddress: string;
  corporateAddress: string;
  website: string;
  companyState: string;
  hsnSac: string;
  gstRate: number;
};

export const getInvoiceSettings = () =>
  apiGet<InvoiceSettings>("/settings/admin/invoice-settings");

export const updateInvoiceSettings = (body: InvoiceSettings) =>
  apiPatch<InvoiceSettings>("/settings/admin/invoice-settings", body);
