alter table public.epi_exchange_requests
  add column if not exists review_note text;

alter table public.epi_deliveries
  add column if not exists exchange_request_id uuid references public.epi_exchange_requests(id);

create unique index if not exists idx_epi_deliveries_exchange_request_id
  on public.epi_deliveries(exchange_request_id)
  where exchange_request_id is not null;

create index if not exists idx_epi_deliveries_exchange_request_lookup
  on public.epi_deliveries(exchange_request_id, employee_user_id, company_id);
