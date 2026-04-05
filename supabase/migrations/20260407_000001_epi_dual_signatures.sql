alter table public.epi_deliveries
  add column if not exists receiver_signature_data_url text,
  add column if not exists deliverer_signature_data_url text;
