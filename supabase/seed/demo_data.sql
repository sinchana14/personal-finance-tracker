-- ============================================================
-- FinTrack demo dataset
-- ============================================================
-- Fills one user's account with ~6 months of income, expenses and
-- budgets (INR), ending today, modelled on a tight real budget:
--   * ₹25,000 salary on the 1st, no other income
--   * ₹10,000 rent
--   * a credit card bill of about ₹10,000 every month
--   * everything else (groceries, food, bus/metro/auto, bills, the odd
--     purchase) out of the remaining ~₹5,000; no two-wheeler, so no fuel
--   * total savings across the period end at exactly ₹900
--
-- Usage: set the email below, then run the whole file in the
-- Supabase SQL editor (it runs as postgres, so RLS is bypassed).
-- The output is deterministic (fixed random seed) for a given day.
--
-- To wipe the demo data again, run demo_data_reset.sql with the
-- same email. That removes ALL of the user's transactions and
-- budgets, so only use it on a demo account.
-- ============================================================

do $$
declare
  target_email text := 'sinchanahosmane14@gmail.com';  -- << change me
  salary numeric := 25000;
  rent numeric := 10000;
  final_savings numeric := 900;   -- net balance at the end of the period
  -- Leftover per month, oldest first (sums to final_savings); the credit
  -- card bill absorbs whatever is needed to hit it, so it varies ~₹9.5–10.5k
  monthly_leftover numeric[] := array[300, -150, 250, 100, 350, 50];
  uid uuid;
  cc_id bigint;
  today date := current_date;
  m date;            -- first day of the month being generated
  idx int := 0;
  last_day int;
  other numeric;
  i int;
begin
  select id into uid from auth.users where email = target_email;
  if uid is null then
    raise exception 'No user with email %', target_email;
  end if;

  -- The default categories have no credit card entry, so give the user one
  select id into cc_id from public.categories where user_id = uid and name = 'Credit Card Bill';
  if cc_id is null then
    insert into public.categories (user_id, name, icon, color, type)
    values (uid, 'Credit Card Bill', '💳', '#F43F5E', 'EXPENSE')
    returning id into cc_id;
  end if;

  perform setseed(0.42);

  create temp table _rows (
    cat text, amount numeric(12,2), day date, note text
  ) on commit drop;

  for m in
    select generate_series(date_trunc('month', today) - interval '5 months', date_trunc('month', today), interval '1 month')::date
  loop
    idx := idx + 1;
    last_day := extract(day from (m + interval '1 month' - interval '1 day'))::int;

    -- ---------- income ----------
    insert into _rows values ('Salary', salary, m, 'Monthly salary');

    -- ---------- fixed expenses ----------
    insert into _rows values ('Rent', rent, m + 2, 'Monthly rent');
    insert into _rows values ('Bills & Utilities', round((250 + random() * 200) / 10) * 10, m + 9, 'Electricity bill (share)');
    insert into _rows values ('Bills & Utilities', 299, m + 13, 'Mobile recharge');

    -- ---------- variable expenses (no two-wheeler: bus, metro, auto only) ----------
    for i in 1..4 loop
      insert into _rows values ('Groceries', round((250 + random() * 300) / 10) * 10, m + floor(random() * last_day)::int,
        (array['Weekly vegetables & fruits', 'Milk & essentials', 'Kirana store', 'Monthly staples'])[1 + floor(random() * 4)::int]);
    end loop;
    for i in 1..7 loop
      insert into _rows values ('Food & Dining', round((60 + random() * 190) / 10) * 10, m + floor(random() * last_day)::int,
        (array['Office canteen', 'Chai & snacks', 'Tiffin', 'Dosa breakfast', 'Street food'])[1 + floor(random() * 5)::int]);
    end loop;
    insert into _rows values ('Transport', 400, m + 1, 'Monthly bus pass');
    for i in 1..4 loop
      insert into _rows values ('Transport', round((30 + random() * 100) / 10) * 10, m + floor(random() * last_day)::int,
        (array['Auto ride', 'Metro', 'Shared auto', 'Bus ticket'])[1 + floor(random() * 4)::int]);
    end loop;
    if random() < 0.5 then
      insert into _rows values ('Health', round((100 + random() * 300) / 10) * 10, m + floor(random() * last_day)::int,
        (array['Pharmacy', 'Clinic visit'])[1 + floor(random() * 2)::int]);
    end if;
    if random() < 0.4 then
      insert into _rows values ('Shopping', round((199 + random() * 400) / 10) * 10, m + floor(random() * last_day)::int,
        (array['Toiletries', 'Phone cover', 'Slippers'])[1 + floor(random() * 3)::int]);
    end if;
    insert into _rows values ('Other Expense', round((50 + random() * 150) / 10) * 10, m + floor(random() * last_day)::int,
      (array['Haircut', 'Laundry', 'Courier charges'])[1 + floor(random() * 3)::int]);

    -- Nothing in the future
    delete from _rows where day > today;

    -- Credit card bill (due on the 20th) takes up what's left after the planned leftover
    if m + 19 <= today then
      select coalesce(sum(amount), 0) into other from _rows
      where cat not in ('Salary') and day >= m and day < m + interval '1 month';
      insert into _rows values ('Credit Card Bill', salary - other - monthly_leftover[idx], m + 19, 'Credit card bill payment');
    end if;
  end loop;

  -- Land the overall balance exactly on final_savings (matters when the
  -- current month is still partial), via the latest credit card bill
  update _rows set amount = amount + (
      (select sum(case when cat = 'Salary' then amount else -amount end) from _rows) - final_savings)
  where cat = 'Credit Card Bill' and day = (select max(day) from _rows where cat = 'Credit Card Bill');

  insert into public.transactions (user_id, category_id, amount, type, description, transaction_date)
  select uid, c.id, r.amount, c.type, r.note, r.day
  from _rows r
  join public.categories c on c.name = r.cat and (c.user_id is null or c.user_id = uid);

  -- Budgets for last month and this month, sized to the ~₹5k left after rent and the card bill
  insert into public.budgets (user_id, category_id, amount_limit, budget_month, budget_year)
  select uid, c.id, b.lim, extract(month from p.m)::int, extract(year from p.m)::int
  from (values ('Groceries', 1500), ('Food & Dining', 1200), ('Transport', 700),
               ('Bills & Utilities', 700), ('Credit Card Bill', 10000)) as b(cat, lim)
  join public.categories c on c.name = b.cat and (c.user_id is null or c.user_id = uid)
  cross join (values (date_trunc('month', today)::date), ((date_trunc('month', today) - interval '1 month')::date)) as p(m)
  on conflict (user_id, category_id, budget_month, budget_year) do update set amount_limit = excluded.amount_limit;
end $$;
