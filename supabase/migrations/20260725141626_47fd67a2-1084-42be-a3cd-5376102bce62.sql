revoke execute on function public.has_role(uuid, public.app_role) from anon;
revoke execute on function public.touch_updated_at() from anon, authenticated;