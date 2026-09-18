export type ClinicService = {id: string; name: string; booking_url?: string | null};

// Recebe somente o catálogo ativo da clínica, lido pelo cliente da gestante.
export function contextualServices<T extends ClinicService>(services: T[], names: readonly string[] = []): T[] {
  return services.filter(service => names.includes(service.name));
}

export function bookingLink(value?: string | null): string | undefined {
  if (!value || /[\s\u0000-\u001f\u007f]/.test(value)) return undefined;
  if (/^tel:\+?[0-9()-]+$/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}
