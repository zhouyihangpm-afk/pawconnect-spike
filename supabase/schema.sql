-- PawConnect baseline schema, security and fictional seed data
-- Run once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- Safe to re-run: it drops and recreates the PawConnect objects (all data is reset).

drop function if exists public.submit_application(text, text, text, text);
drop function if exists public.track_application(text);
drop table if exists public.applications;
drop table if exists public.pets;
drop table if exists public.shelters;
drop sequence if exists public.application_seq;

-- ---------- Tables ----------
create table public.shelters (
  shelter_id   text primary key,
  shelter_name text not null,
  suburb       text,
  demo_phone   text,
  description  text
);

create table public.pets (
  pet_id       text primary key,
  shelter_id   text not null references public.shelters(shelter_id),
  name         text not null,
  animal_type  text not null check (animal_type in ('Dog','Cat','Rabbit','Other')),
  breed        text,
  age_years    int  check (age_years >= 0),
  sex          text check (sex in ('Male','Female')),
  availability text not null default 'Available'
               check (availability in ('Available','On Hold','Adopted')),
  description  text,
  photo_url    text
);

create sequence public.application_seq start 1004;

create table public.applications (
  application_id      text primary key default ('APP-' || nextval('public.application_seq')),
  pet_id              text not null references public.pets(pet_id),
  applicant_demo_name text not null check (length(trim(applicant_demo_name)) > 0),
  demo_email          text not null check (demo_email like '%@%'),
  reason              text not null check (length(trim(reason)) > 0),
  application_status  text not null default 'Pending'
                      check (application_status in ('Pending','Under Review','Approved','Rejected')),
  submitted_at        timestamptz not null default now()
);

-- ---------- Row Level Security ----------
alter table public.shelters     enable row level security;
alter table public.pets         enable row level security;
alter table public.applications enable row level security;

create policy "public read shelters" on public.shelters
  for select to anon, authenticated using (true);

create policy "public read pets" on public.pets
  for select to anon, authenticated using (true);
create policy "staff insert pets" on public.pets
  for insert to authenticated with check (true);
create policy "staff update pets" on public.pets
  for update to authenticated using (true) with check (true);

-- Applications: no anon policies at all, so the public cannot list or edit them directly.
create policy "staff read applications" on public.applications
  for select to authenticated using (true);
create policy "staff update applications" on public.applications
  for update to authenticated using (true) with check (true);

-- ---------- Public functions (the only way anon touches applications) ----------
create function public.submit_application(
  p_pet_id text, p_name text, p_email text, p_reason text
) returns text
language plpgsql security definer set search_path = public
as $$
declare
  new_id text;
begin
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_email), '') = ''
     or coalesce(trim(p_reason), '') = '' then
    raise exception 'Missing required fields';
  end if;
  if not exists (select 1 from pets where pet_id = p_pet_id and availability = 'Available') then
    raise exception 'Pet is not available for adoption';
  end if;
  insert into applications (pet_id, applicant_demo_name, demo_email, reason)
  values (p_pet_id, trim(p_name), trim(p_email), trim(p_reason))
  returning application_id into new_id;
  return new_id;
end;
$$;

create function public.track_application(p_application_id text)
returns table (application_id text, pet_name text, application_status text, submitted_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select a.application_id, p.name, a.application_status, a.submitted_at
  from applications a
  join pets p on p.pet_id = a.pet_id
  where a.application_id = upper(trim(p_application_id));
$$;

revoke all on function public.submit_application(text, text, text, text) from public;
revoke all on function public.track_application(text) from public;
grant execute on function public.submit_application(text, text, text, text) to anon, authenticated;
grant execute on function public.track_application(text) to anon, authenticated;

-- ---------- Fictional seed data ----------
insert into public.shelters values
 ('SH01','Harbourside Animal Rescue (Demo)','Glebe NSW','02 0000 0001','Fictional shelter for prototype testing. Focus on dogs and cats.'),
 ('SH02','Westgate Pet Haven (Demo)','Parramatta NSW','02 0000 0002','Fictional shelter for prototype testing. Small animals and senior pets.');

insert into public.pets values
 ('P001','SH01','Biscuit','Dog','Labrador Mix',3,'Male','Available','Friendly and energetic, good with children.','https://placehold.co/600x400?text=Biscuit'),
 ('P002','SH01','Luna','Cat','Domestic Shorthair',2,'Female','Available','Calm indoor cat who likes quiet homes.','https://placehold.co/600x400?text=Luna'),
 ('P003','SH02','Milo','Dog','Beagle',5,'Male','Available','Loves walks; needs a fenced yard.','https://placehold.co/600x400?text=Milo'),
 ('P004','SH02','Pepper','Rabbit','Mini Lop',1,'Female','Available','Gentle rabbit, used to being handled.','https://placehold.co/600x400?text=Pepper'),
 ('P005','SH02','Oscar','Cat','Ragdoll Mix',7,'Male','Available','Senior cat, affectionate and relaxed.','https://placehold.co/600x400?text=Oscar'),
 ('P006','SH01','Daisy','Dog','Kelpie Cross',4,'Female','Available','Smart and active; suits an experienced owner.','https://placehold.co/600x400?text=Daisy'),
 ('P007','SH01','Shadow','Cat','Domestic Longhair',6,'Male','Adopted','Already adopted - used to test availability filtering.','https://placehold.co/600x400?text=Shadow'),
 ('P008','SH02','Coco','Rabbit','Netherland Dwarf',2,'Female','On Hold','Application in progress - used to test availability filtering.','https://placehold.co/600x400?text=Coco');

insert into public.applications (application_id, pet_id, applicant_demo_name, demo_email, reason, application_status, submitted_at) values
 ('APP-1001','P001','Test Applicant One','applicant1@example.com','Demo record for status lookup test.','Pending','2026-10-21 10:00+11'),
 ('APP-1002','P003','Test Applicant Two','applicant2@example.com','Demo record for status lookup test.','Under Review','2026-10-21 10:05+11'),
 ('APP-1003','P008','Test Applicant Three','applicant3@example.com','Demo record for status lookup test.','Approved','2026-10-21 10:10+11');
