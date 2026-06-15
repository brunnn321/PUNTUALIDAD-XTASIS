-- Permisos explícitos para el Data API (PostgREST)
-- Necesario porque auto_expose_new_tables no está activo

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON public.profiles   TO anon, authenticated, service_role;
GRANT SELECT ON public.event_types TO anon, authenticated, service_role;
GRANT SELECT ON public.events      TO anon, authenticated, service_role;
GRANT SELECT ON public.attendances TO anon, authenticated, service_role;
GRANT SELECT ON public.push_tokens TO anon, authenticated, service_role;

GRANT INSERT, UPDATE, DELETE ON public.profiles    TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.event_types TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.events      TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.attendances TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated, service_role;
