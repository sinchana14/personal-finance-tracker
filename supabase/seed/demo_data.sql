-- ============================================================
-- FinTrack demo dataset
-- ============================================================
-- Fills one user's account with ~6 months of realistic income,
-- expenses and budgets (amounts in INR), ending today, sized for
-- a ₹25,000 monthly salary: shared-flat rent, modest food and
-- travel spend, and roughly ₹5–10k saved each month.
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
  uid uuid;
  today date := current_date;
  m date;            -- first day of the month being generated
  last_day int;
  i int;
begin
  select id into uid from auth.users where email = target_email;
  if uid is null then
    raise exception 'No user with email %', target_email;
  end if;

  perform setseed(0.42);

  create temp table _rows (
    cat text, amount numeric(12,2), day date, note text
  ) on commit drop;

  for m in
    select generate_series(date_trunc('month', today) - interval '5 months', date_trunc('month', today), interval '1 month')::date
  loop
    last_day := extract(day from (m + interval '1 month' - interval '1 day'))::int;

    -- ---------- income ----------
    insert into _rows values ('Salary', salary, m, 'Monthly salary – Nimbus Software');
    if random() < 0.4 then
      insert into _rows values ('Freelance', round((2000 + random() * 4000) / 100) * 100, m + (14 + floor(random() * 12))::int,
        (array['Logo design for local café', 'Poster design gig', 'Website bug fixes', 'Resume design for a friend', 'Landing page tweaks'])[1 + floor(random() * 5)::int]);
    end if;
    if extract(month from m)::int % 3 = 0 then
      insert into _rows values ('Investment', round((300 + random() * 500) / 10) * 10, m + 19, 'Mutual fund SIP returns');
    end if;
    if extract(month from m)::int = 8 then
      insert into _rows values ('Gift', 2000, m + 8, 'Raksha Bandhan gift');
    end if;
    if random() < 0.3 then
      insert into _rows values ('Other Income', round((50 + random() * 450) / 10) * 10, m + floor(random() * 27)::int,
        (array['Cashback credited', 'Sold old books', 'Refund – cancelled order'])[1 + floor(random() * 3)::int]);
    end if;

    -- ---------- fixed expenses ----------
    insert into _rows values ('Rent', 7000, m + 4, 'Room rent – shared flat');
    insert into _rows values ('Bills & Utilities', round((400 + random() * 400) / 10) * 10, m + 9, 'Electricity bill (share)');
    insert into _rows values ('Bills & Utilities', 499, m + 11, 'Broadband (split with flatmates)');
    insert into _rows values ('Bills & Utilities', 299, m + 13, 'Mobile recharge');
    insert into _rows values ('Entertainment', 149, m + 17, 'Netflix mobile plan');

    -- ---------- variable expenses ----------
    for i in 1..4 loop
      insert into _rows values ('Groceries', round((300 + random() * 800) / 10) * 10, m + floor(random() * last_day)::int,
        (array['Weekly vegetables & fruits', 'DMart run', 'Milk & essentials', 'Zepto top-up', 'Monthly staples'])[1 + floor(random() * 5)::int]);
    end loop;
    for i in 1..10 loop
      insert into _rows values ('Food & Dining', round((80 + random() * 370) / 10) * 10, m + floor(random() * last_day)::int,
        (array['Office canteen', 'Chai & snacks', 'Dosa breakfast', 'Swiggy dinner', 'Coffee with friends', 'Street food', 'Weekend biryani'])[1 + floor(random() * 7)::int]);
    end loop;
    for i in 1..8 loop
      insert into _rows values ('Transport', round((30 + random() * 220) / 10) * 10, m + floor(random() * last_day)::int,
        (array['Metro card top-up', 'Bus pass', 'Auto ride', 'Rapido bike taxi', 'Petrol for scooter'])[1 + floor(random() * 5)::int]);
    end loop;
    for i in 1..(1 + floor(random() * 2)::int) loop
      insert into _rows values ('Shopping', round((299 + random() * 1700) / 10) * 10, m + floor(random() * last_day)::int,
        (array['Meesho – kurta', 'Amazon – phone cover', 'Footwear', 'Flipkart – earphones', 'Birthday present'])[1 + floor(random() * 5)::int]);
    end loop;
    for i in 1..(1 + floor(random() * 2)::int) loop
      insert into _rows values ('Entertainment', round((150 + random() * 450) / 10) * 10, m + floor(random() * last_day)::int,
        (array['Movie tickets', 'Bowling with friends', 'Weekend trip share', 'Mobile game top-up'])[1 + floor(random() * 4)::int]);
    end loop;
    if random() < 0.4 then
      insert into _rows values ('Health', round((150 + random() * 850) / 10) * 10, m + floor(random() * last_day)::int,
        (array['Pharmacy', 'Doctor consultation', 'Gym (monthly)'])[1 + floor(random() * 3)::int]);
    end if;
    if random() < 0.3 then
      insert into _rows values ('Education', round((299 + random() * 1200) / 10) * 10, m + floor(random() * last_day)::int,
        (array['Udemy course', 'Technical books', 'Exam registration'])[1 + floor(random() * 3)::int]);
    end if;
    insert into _rows values ('Other Expense', round((50 + random() * 350) / 10) * 10, m + floor(random() * last_day)::int,
      (array['Haircut', 'Laundry', 'Courier charges', 'Donation'])[1 + floor(random() * 4)::int]);
  end loop;

  -- Nothing in the future
  delete from _rows where day > today;

  insert into public.transactions (user_id, category_id, amount, type, description, transaction_date)
  select uid, c.id, r.amount, c.type, r.note, r.day
  from _rows r
  join public.categories c on c.user_id is null and c.name = r.cat;

  -- Budgets for last month and this month
  insert into public.budgets (user_id, category_id, amount_limit, budget_month, budget_year)
  select uid, c.id, b.lim, extract(month from p.m)::int, extract(year from p.m)::int
  from (values ('Food & Dining', 2500), ('Groceries', 3000), ('Transport', 1200),
               ('Shopping', 1500), ('Entertainment', 800), ('Bills & Utilities', 1500)) as b(cat, lim)
  join public.categories c on c.user_id is null and c.name = b.cat
  cross join (values (date_trunc('month', today)::date), ((date_trunc('month', today) - interval '1 month')::date)) as p(m)
  on conflict (user_id, category_id, budget_month, budget_year) do update set amount_limit = excluded.amount_limit;
end $$;
