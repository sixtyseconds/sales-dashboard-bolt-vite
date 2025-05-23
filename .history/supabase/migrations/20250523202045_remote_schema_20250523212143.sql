drop policy "Enable profile access" on "public"."profiles";

drop policy "Enable create access for own targets" on "public"."targets";

drop policy "Enable read access for own targets" on "public"."targets";

drop policy "Enable update access for own targets" on "public"."targets";

drop policy "Enable team member management" on "public"."team_members";

drop index if exists "public"."idx_deals_contact_identifier";

alter type "public"."activity_status" rename to "activity_status__old_version_to_be_dropped";

create type "public"."activity_status" as enum ('pending', 'completed', 'cancelled', 'no_show');

create table "public"."challenge_features" (
    "id" uuid not null default uuid_generate_v4(),
    "challenge_id" uuid,
    "title" text not null,
    "description" text,
    "order_index" integer,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."challenge_features" enable row level security;

create table "public"."challenges" (
    "id" uuid not null default uuid_generate_v4(),
    "title" text not null,
    "description" text,
    "icon" text,
    "color" text,
    "order_index" integer,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "subtext" text
);


alter table "public"."challenges" enable row level security;

create table "public"."contacts" (
    "id" uuid not null default uuid_generate_v4(),
    "email" text not null,
    "first_name" text,
    "last_name" text,
    "company" text,
    "phone" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."contacts" enable row level security;

create table "public"."content" (
    "id" uuid not null default uuid_generate_v4(),
    "title" text not null,
    "type" text not null,
    "url" text,
    "thumbnail" text,
    "description" text,
    "category" text,
    "duration" integer,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."content" enable row level security;

create table "public"."pricing_plans" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "description" text,
    "price" numeric(10,2),
    "interval" text,
    "features" text[],
    "is_popular" boolean default false,
    "order_index" integer,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."pricing_plans" enable row level security;

create table "public"."solutions" (
    "id" uuid not null default uuid_generate_v4(),
    "challenge_id" uuid,
    "title" text not null,
    "description" text,
    "features" text[],
    "demo_url" text,
    "order_index" integer,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."solutions" enable row level security;

create table "public"."user_roles" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."user_roles" enable row level security;

drop type "public"."activity_status__old_version_to_be_dropped";

alter table "public"."activities" add column "is_processed" boolean default false;

alter table "public"."deal_activities" add column "activity_id" uuid;

alter table "public"."deal_activities" add column "contact_email" text;

alter table "public"."deal_activities" add column "is_matched" boolean default false;

alter table "public"."deal_activities" alter column "deal_id" drop not null;

alter table "public"."deals" add column "closed_lost_date" timestamp with time zone;

alter table "public"."deals" add column "closed_won_date" timestamp with time zone;

alter table "public"."deals" add column "first_meeting_date" timestamp with time zone;

alter table "public"."deals" add column "notes" text;

alter table "public"."deals" add column "opportunity_date" timestamp with time zone;

alter table "public"."deals" add column "sql_date" timestamp with time zone;

alter table "public"."deals" add column "verbal_date" timestamp with time zone;

alter table "public"."targets" add column "closed_by" uuid;

alter table "public"."targets" add column "created_by" uuid;

alter table "public"."targets" add column "previous_target_id" uuid;

CREATE UNIQUE INDEX challenge_features_pkey ON public.challenge_features USING btree (id);

CREATE UNIQUE INDEX challenges_pkey ON public.challenges USING btree (id);

CREATE UNIQUE INDEX contacts_email_key ON public.contacts USING btree (email);

CREATE UNIQUE INDEX contacts_pkey ON public.contacts USING btree (id);

CREATE UNIQUE INDEX content_pkey ON public.content USING btree (id);

CREATE INDEX idx_deal_activities_contact_email ON public.deal_activities USING btree (contact_email);

CREATE INDEX idx_deal_activities_unmatched ON public.deal_activities USING btree (is_matched) WHERE (is_matched = false);

CREATE INDEX idx_deals_contact_email ON public.deals USING btree (contact_email);

CREATE UNIQUE INDEX pricing_plans_pkey ON public.pricing_plans USING btree (id);

CREATE UNIQUE INDEX solutions_pkey ON public.solutions USING btree (id);

CREATE UNIQUE INDEX user_roles_name_key ON public.user_roles USING btree (name);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

alter table "public"."challenge_features" add constraint "challenge_features_pkey" PRIMARY KEY using index "challenge_features_pkey";

alter table "public"."challenges" add constraint "challenges_pkey" PRIMARY KEY using index "challenges_pkey";

alter table "public"."contacts" add constraint "contacts_pkey" PRIMARY KEY using index "contacts_pkey";

alter table "public"."content" add constraint "content_pkey" PRIMARY KEY using index "content_pkey";

alter table "public"."pricing_plans" add constraint "pricing_plans_pkey" PRIMARY KEY using index "pricing_plans_pkey";

alter table "public"."solutions" add constraint "solutions_pkey" PRIMARY KEY using index "solutions_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."challenge_features" add constraint "challenge_features_challenge_id_fkey" FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE not valid;

alter table "public"."challenge_features" validate constraint "challenge_features_challenge_id_fkey";

alter table "public"."contacts" add constraint "contacts_email_key" UNIQUE using index "contacts_email_key";

alter table "public"."deal_activities" add constraint "deal_activities_activity_id_fkey" FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL not valid;

alter table "public"."deal_activities" validate constraint "deal_activities_activity_id_fkey";

alter table "public"."solutions" add constraint "solutions_challenge_id_fkey" FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE not valid;

alter table "public"."solutions" validate constraint "solutions_challenge_id_fkey";

alter table "public"."targets" add constraint "targets_closed_by_fkey" FOREIGN KEY (closed_by) REFERENCES auth.users(id) not valid;

alter table "public"."targets" validate constraint "targets_closed_by_fkey";

alter table "public"."targets" add constraint "targets_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."targets" validate constraint "targets_created_by_fkey";

alter table "public"."targets" add constraint "targets_previous_target_id_fkey" FOREIGN KEY (previous_target_id) REFERENCES targets(id) not valid;

alter table "public"."targets" validate constraint "targets_previous_target_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_name_key" UNIQUE using index "user_roles_name_key";

set check_function_bodies = off;

create or replace view "public"."activities_with_profile" as  SELECT a.id,
    a.user_id,
    a.type,
    a.status,
    a.priority,
    a.client_name,
    a.sales_rep,
    a.details,
    a.amount,
    a.date,
    a.created_at,
    a.updated_at,
    a.quantity,
    a.contact_identifier,
    a.contact_identifier_type,
    a.is_processed,
    p.id AS profile_id,
    p.first_name AS profile_first_name,
    p.last_name AS profile_last_name,
    p.avatar_url AS profile_avatar_url
   FROM (activities a
     LEFT JOIN profiles p ON ((a.user_id = p.id)));


create or replace view "public"."deal_activities_with_profile" as  SELECT da.id,
    da.deal_id,
    da.user_id,
    da.activity_type,
    da.contact_email,
    da.notes,
    da.due_date,
    da.completed,
    da.is_matched,
    da.created_at,
    da.updated_at,
    p.id AS profile_id,
    TRIM(BOTH FROM concat(COALESCE(p.first_name, ''::text), ' ', COALESCE(p.last_name, ''::text))) AS profile_full_name,
    p.avatar_url AS profile_avatar_url
   FROM (deal_activities da
     LEFT JOIN profiles p ON ((da.user_id = p.id)));


CREATE OR REPLACE FUNCTION public.handle_deal_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO deal_stage_history (deal_id, stage_id, user_id, entered_at)
    VALUES (NEW.id, NEW.stage_id, NEW.owner_id, NEW.created_at); -- Use created_at for initial entry
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_deal_stage_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  previous_stage_id UUID;
  previous_entry_id UUID;
BEGIN
  -- Check if the stage_id actually changed
  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN

    -- Find the most recent previous history entry for this deal that hasn't exited
    SELECT id, stage_id INTO previous_entry_id, previous_stage_id
    FROM deal_stage_history
    WHERE deal_id = NEW.id AND exited_at IS NULL
    ORDER BY entered_at DESC
    LIMIT 1;

    -- If a previous entry exists, update its exited_at and duration
    IF previous_entry_id IS NOT NULL THEN
      UPDATE deal_stage_history
      SET
        exited_at = NEW.stage_changed_at, -- Use the timestamp from the deals table update
        duration_seconds = EXTRACT(EPOCH FROM (NEW.stage_changed_at - entered_at))::INTEGER
      WHERE id = previous_entry_id;
    END IF;

    -- Insert the new stage history record
    -- Use the user_id who caused the change if available, otherwise fallback?
    -- For now, let's assume the owner_id is sufficient, or maybe null if the trigger context doesn't easily provide the specific user performing the action.
    -- Supabase Auth context might be available depending on setup (e.g., auth.uid())
    INSERT INTO deal_stage_history (deal_id, stage_id, user_id, entered_at)
    VALUES (NEW.id, NEW.stage_id, NEW.owner_id, NEW.stage_changed_at); -- Using owner_id and stage_changed_at from the deal record

  END IF;

  RETURN NEW; -- Return the updated row for the trigger
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND is_admin = true
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    DECLARE
      is_admin_status boolean;
    BEGIN
      -- Check the is_admin status in the profiles table for the given user_id
      SELECT is_admin INTO is_admin_status
      FROM public.profiles
      WHERE id = user_id;

      -- Return the status, defaulting to false if not found or null
      RETURN COALESCE(is_admin_status, false);
    END;
    $function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."challenge_features" to "anon";

grant insert on table "public"."challenge_features" to "anon";

grant references on table "public"."challenge_features" to "anon";

grant select on table "public"."challenge_features" to "anon";

grant trigger on table "public"."challenge_features" to "anon";

grant truncate on table "public"."challenge_features" to "anon";

grant update on table "public"."challenge_features" to "anon";

grant delete on table "public"."challenge_features" to "authenticated";

grant insert on table "public"."challenge_features" to "authenticated";

grant references on table "public"."challenge_features" to "authenticated";

grant select on table "public"."challenge_features" to "authenticated";

grant trigger on table "public"."challenge_features" to "authenticated";

grant truncate on table "public"."challenge_features" to "authenticated";

grant update on table "public"."challenge_features" to "authenticated";

grant delete on table "public"."challenge_features" to "service_role";

grant insert on table "public"."challenge_features" to "service_role";

grant references on table "public"."challenge_features" to "service_role";

grant select on table "public"."challenge_features" to "service_role";

grant trigger on table "public"."challenge_features" to "service_role";

grant truncate on table "public"."challenge_features" to "service_role";

grant update on table "public"."challenge_features" to "service_role";

grant delete on table "public"."challenges" to "anon";

grant insert on table "public"."challenges" to "anon";

grant references on table "public"."challenges" to "anon";

grant select on table "public"."challenges" to "anon";

grant trigger on table "public"."challenges" to "anon";

grant truncate on table "public"."challenges" to "anon";

grant update on table "public"."challenges" to "anon";

grant delete on table "public"."challenges" to "authenticated";

grant insert on table "public"."challenges" to "authenticated";

grant references on table "public"."challenges" to "authenticated";

grant select on table "public"."challenges" to "authenticated";

grant trigger on table "public"."challenges" to "authenticated";

grant truncate on table "public"."challenges" to "authenticated";

grant update on table "public"."challenges" to "authenticated";

grant delete on table "public"."challenges" to "service_role";

grant insert on table "public"."challenges" to "service_role";

grant references on table "public"."challenges" to "service_role";

grant select on table "public"."challenges" to "service_role";

grant trigger on table "public"."challenges" to "service_role";

grant truncate on table "public"."challenges" to "service_role";

grant update on table "public"."challenges" to "service_role";

grant delete on table "public"."contacts" to "anon";

grant insert on table "public"."contacts" to "anon";

grant references on table "public"."contacts" to "anon";

grant select on table "public"."contacts" to "anon";

grant trigger on table "public"."contacts" to "anon";

grant truncate on table "public"."contacts" to "anon";

grant update on table "public"."contacts" to "anon";

grant delete on table "public"."contacts" to "authenticated";

grant insert on table "public"."contacts" to "authenticated";

grant references on table "public"."contacts" to "authenticated";

grant select on table "public"."contacts" to "authenticated";

grant trigger on table "public"."contacts" to "authenticated";

grant truncate on table "public"."contacts" to "authenticated";

grant update on table "public"."contacts" to "authenticated";

grant delete on table "public"."contacts" to "service_role";

grant insert on table "public"."contacts" to "service_role";

grant references on table "public"."contacts" to "service_role";

grant select on table "public"."contacts" to "service_role";

grant trigger on table "public"."contacts" to "service_role";

grant truncate on table "public"."contacts" to "service_role";

grant update on table "public"."contacts" to "service_role";

grant delete on table "public"."content" to "anon";

grant insert on table "public"."content" to "anon";

grant references on table "public"."content" to "anon";

grant select on table "public"."content" to "anon";

grant trigger on table "public"."content" to "anon";

grant truncate on table "public"."content" to "anon";

grant update on table "public"."content" to "anon";

grant delete on table "public"."content" to "authenticated";

grant insert on table "public"."content" to "authenticated";

grant references on table "public"."content" to "authenticated";

grant select on table "public"."content" to "authenticated";

grant trigger on table "public"."content" to "authenticated";

grant truncate on table "public"."content" to "authenticated";

grant update on table "public"."content" to "authenticated";

grant delete on table "public"."content" to "service_role";

grant insert on table "public"."content" to "service_role";

grant references on table "public"."content" to "service_role";

grant select on table "public"."content" to "service_role";

grant trigger on table "public"."content" to "service_role";

grant truncate on table "public"."content" to "service_role";

grant update on table "public"."content" to "service_role";

grant delete on table "public"."pricing_plans" to "anon";

grant insert on table "public"."pricing_plans" to "anon";

grant references on table "public"."pricing_plans" to "anon";

grant select on table "public"."pricing_plans" to "anon";

grant trigger on table "public"."pricing_plans" to "anon";

grant truncate on table "public"."pricing_plans" to "anon";

grant update on table "public"."pricing_plans" to "anon";

grant delete on table "public"."pricing_plans" to "authenticated";

grant insert on table "public"."pricing_plans" to "authenticated";

grant references on table "public"."pricing_plans" to "authenticated";

grant select on table "public"."pricing_plans" to "authenticated";

grant trigger on table "public"."pricing_plans" to "authenticated";

grant truncate on table "public"."pricing_plans" to "authenticated";

grant update on table "public"."pricing_plans" to "authenticated";

grant delete on table "public"."pricing_plans" to "service_role";

grant insert on table "public"."pricing_plans" to "service_role";

grant references on table "public"."pricing_plans" to "service_role";

grant select on table "public"."pricing_plans" to "service_role";

grant trigger on table "public"."pricing_plans" to "service_role";

grant truncate on table "public"."pricing_plans" to "service_role";

grant update on table "public"."pricing_plans" to "service_role";

grant delete on table "public"."solutions" to "anon";

grant insert on table "public"."solutions" to "anon";

grant references on table "public"."solutions" to "anon";

grant select on table "public"."solutions" to "anon";

grant trigger on table "public"."solutions" to "anon";

grant truncate on table "public"."solutions" to "anon";

grant update on table "public"."solutions" to "anon";

grant delete on table "public"."solutions" to "authenticated";

grant insert on table "public"."solutions" to "authenticated";

grant references on table "public"."solutions" to "authenticated";

grant select on table "public"."solutions" to "authenticated";

grant trigger on table "public"."solutions" to "authenticated";

grant truncate on table "public"."solutions" to "authenticated";

grant update on table "public"."solutions" to "authenticated";

grant delete on table "public"."solutions" to "service_role";

grant insert on table "public"."solutions" to "service_role";

grant references on table "public"."solutions" to "service_role";

grant select on table "public"."solutions" to "service_role";

grant trigger on table "public"."solutions" to "service_role";

grant truncate on table "public"."solutions" to "service_role";

grant update on table "public"."solutions" to "service_role";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant references on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant trigger on table "public"."user_roles" to "anon";

grant truncate on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant references on table "public"."user_roles" to "authenticated";

grant select on table "public"."user_roles" to "authenticated";

grant trigger on table "public"."user_roles" to "authenticated";

grant truncate on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";

grant delete on table "public"."user_roles" to "service_role";

grant insert on table "public"."user_roles" to "service_role";

grant references on table "public"."user_roles" to "service_role";

grant select on table "public"."user_roles" to "service_role";

grant trigger on table "public"."user_roles" to "service_role";

grant truncate on table "public"."user_roles" to "service_role";

grant update on table "public"."user_roles" to "service_role";

create policy "Users can create own activities"
on "public"."activities"
as permissive
for insert
to authenticated
with check ((user_id = auth.uid()));


create policy "Allow admin full access"
on "public"."challenge_features"
as permissive
for all
to public
using ((auth.role() = 'admin'::text));


create policy "Allow public read access"
on "public"."challenge_features"
as permissive
for select
to public
using ((is_active = true));


create policy "Allow admin full access"
on "public"."challenges"
as permissive
for all
to public
using ((auth.role() = 'admin'::text));


create policy "Allow public read access"
on "public"."challenges"
as permissive
for select
to public
using ((is_active = true));


create policy "Allow authenticated read"
on "public"."contacts"
as permissive
for select
to authenticated
using (true);


create policy "Allow admin full access"
on "public"."content"
as permissive
for all
to public
using ((auth.role() = 'admin'::text));


create policy "Allow public read access"
on "public"."content"
as permissive
for select
to public
using ((is_active = true));


create policy "Allow read access for authenticated users"
on "public"."deals"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Delete if auth & owner"
on "public"."deals"
as permissive
for delete
to public
using ((auth.uid() = owner_id));


create policy "Users can delete their own deals"
on "public"."deals"
as permissive
for delete
to public
using ((owner_id = auth.uid()));


create policy "Allow admin full access"
on "public"."pricing_plans"
as permissive
for all
to public
using ((auth.role() = 'admin'::text));


create policy "Allow public read access"
on "public"."pricing_plans"
as permissive
for select
to public
using ((is_active = true));


create policy "Allow users to view own profile and admins to view all"
on "public"."profiles"
as permissive
for select
to authenticated
using (((auth.uid() = id) OR (is_user_admin(auth.uid()) = true)));


create policy "Allow admin full access"
on "public"."solutions"
as permissive
for all
to public
using ((auth.role() = 'admin'::text));


create policy "Allow public read access"
on "public"."solutions"
as permissive
for select
to public
using ((is_active = true));


create policy "Users can manage own targets"
on "public"."targets"
as permissive
for all
to authenticated
using ((user_id = auth.uid()));


create policy "Users can manage own team membership"
on "public"."team_members"
as permissive
for all
to authenticated
using ((user_id = auth.uid()));


create policy "Team leaders can create teams"
on "public"."teams"
as permissive
for insert
to authenticated
with check (true);


create policy "Team leaders can update their teams"
on "public"."teams"
as permissive
for update
to authenticated
using ((id IN ( SELECT team_members.team_id
   FROM team_members
  WHERE ((team_members.user_id = auth.uid()) AND (team_members.role = ANY (ARRAY['leader'::member_role, 'admin'::member_role]))))));


create policy "Users can view teams they belong to"
on "public"."teams"
as permissive
for select
to authenticated
using ((id IN ( SELECT team_members.team_id
   FROM team_members
  WHERE (team_members.user_id = auth.uid()))));


create policy "Allow admin full access"
on "public"."user_roles"
as permissive
for all
to public
using ((auth.role() = 'admin'::text));


CREATE TRIGGER update_challenge_features_updated_at BEFORE UPDATE ON public.challenge_features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON public.challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON public.content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_deal_insert AFTER INSERT ON public.deals FOR EACH ROW EXECUTE FUNCTION handle_deal_insert();

CREATE TRIGGER trigger_deal_stage_change AFTER UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION handle_deal_stage_change();

CREATE TRIGGER update_pricing_plans_updated_at BEFORE UPDATE ON public.pricing_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solutions_updated_at BEFORE UPDATE ON public.solutions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


