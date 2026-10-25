drop policy "transactions: all own" on public.transactions;
drop policy "budgets: all own" on public.budgets;

create policy "transactions: read own" on public.transactions for select to authenticated using (user_id = (select auth.uid()));
create policy "transactions: delete own" on public.transactions for delete to authenticated using (user_id = (select auth.uid()));
create policy "transactions: insert own" on public.transactions for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.categories c where c.id = category_id and c.type = transactions.type and (c.user_id is null or c.user_id = (select auth.uid()))));
create policy "transactions: update own" on public.transactions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.categories c where c.id = category_id and c.type = transactions.type and (c.user_id is null or c.user_id = (select auth.uid()))));

create policy "budgets: read own" on public.budgets for select to authenticated using (user_id = (select auth.uid()));
create policy "budgets: delete own" on public.budgets for delete to authenticated using (user_id = (select auth.uid()));
create policy "budgets: insert own" on public.budgets for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.categories c where c.id = category_id and c.type = 'EXPENSE' and (c.user_id is null or c.user_id = (select auth.uid()))));
create policy "budgets: update own" on public.budgets for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.categories c where c.id = category_id and c.type = 'EXPENSE' and (c.user_id is null or c.user_id = (select auth.uid()))));
