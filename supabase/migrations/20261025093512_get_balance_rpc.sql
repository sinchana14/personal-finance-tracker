create function public.get_balance() returns numeric
language sql stable security invoker set search_path = '' as $$
  select coalesce(sum(case when type = 'INCOME' then amount else -amount end), 0)
  from public.transactions
  where user_id = (select auth.uid());
$$;
revoke execute on function public.get_balance() from public, anon;
grant execute on function public.get_balance() to authenticated;
