-- Removes ALL transactions and budgets for one user (use on demo accounts only).
-- Categories and the profile are left alone.
with u as (select id from auth.users where email = 'sinchanahosmane14@gmail.com')  -- << change me
, t as (delete from public.transactions where user_id = (select id from u) returning 1)
, b as (delete from public.budgets where user_id = (select id from u) returning 1)
select (select count(*) from t) as transactions_deleted, (select count(*) from b) as budgets_deleted;
