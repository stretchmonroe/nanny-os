-- LOCAL TEST FIXTURE ONLY. Generated from reviewed schema metadata; contains no family rows.
-- Omits foreign keys, triggers and unseen functions; not a production baseline/backup.
create extension if not exists "uuid-ossp" with schema extensions;
set search_path=public,extensions;
create table public."activity_completions" (
  "id" text not null,
  "schedule_item_id" text not null,
  "child_id" text not null,
  "completion_date" date not null,
  "status" text not null,
  "replaced_with" text,
  "duration_actual_min" integer,
  "energy_level_actual" text,
  "mood_before" text,
  "mood_after" text,
  "notes" text,
  "logged_by" text not null,
  "created_at" timestamp with time zone not null
);
alter table public."activity_completions" add constraint "activity_completions_energy_level_actual_check" check ((energy_level_actual = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])));
alter table public."activity_completions" add constraint "activity_completions_status_check" check ((status = ANY (ARRAY['completed'::text, 'skipped'::text, 'replaced'::text])));
alter table public."activity_completions" enable row level security;
create table public."activity_library" (
  "id" text not null,
  "name" text not null,
  "category" text not null,
  "montessori_area" text,
  "description" text,
  "developmental_focus" text[] default '{}'::text[],
  "age_min_months" integer,
  "age_max_months" integer,
  "duration_min_min" integer,
  "duration_max_min" integer,
  "materials" text[] default '{}'::text[],
  "indoor_outdoor" text,
  "energy_level" text,
  "setup_effort" text,
  "sensory_systems" text[] default '{}'::text[],
  "tips" text,
  "created_at" timestamp with time zone default now()
);
alter table public."activity_library" add constraint "activity_library_energy_level_check" check ((energy_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])));
alter table public."activity_library" add constraint "activity_library_indoor_outdoor_check" check ((indoor_outdoor = ANY (ARRAY['indoor'::text, 'outdoor'::text, 'both'::text])));
alter table public."activity_library" add constraint "activity_library_setup_effort_check" check ((setup_effort = ANY (ARRAY['none'::text, 'low'::text, 'medium'::text, 'high'::text])));
alter table public."activity_library" enable row level security;
create table public."activity_logs" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" text,
  "child_id" text not null,
  "description" text not null,
  "source_type" text not null,
  "status" text default 'completed'::text not null,
  "category" text,
  "local_date" text not null,
  "started_at" timestamp with time zone,
  "ended_at" timestamp with time zone,
  "logged_at" timestamp with time zone default now() not null,
  "created_by" text,
  "related_suggestion_id" text,
  "related_schedule_item_id" text,
  "created_at" timestamp with time zone default now() not null
);
alter table public."activity_logs" add constraint "activity_logs_source_type_check" check ((source_type = ANY (ARRAY['suggestion'::text, 'routine'::text, 'manual'::text, 'voice'::text])));
alter table public."activity_logs" add constraint "activity_logs_status_check" check ((status = ANY (ARRAY['completed'::text, 'skipped'::text, 'replaced'::text])));
alter table public."activity_logs" enable row level security;
create table public."activity_recommendations" (
  "id" text default (gen_random_uuid())::text not null,
  "child_id" text not null,
  "recommended_date" date not null,
  "activity_library_id" text,
  "activity_name" text,
  "time_of_day" text,
  "priority" text default 'secondary'::text,
  "developmental_reason" text,
  "caregiver_notes" text,
  "generated_by" text default 'ai'::text,
  "was_completed" boolean,
  "created_at" timestamp with time zone default now()
);
alter table public."activity_recommendations" add constraint "activity_recommendations_priority_check" check ((priority = ANY (ARRAY['primary'::text, 'secondary'::text, 'optional'::text])));
alter table public."activity_recommendations" add constraint "activity_recommendations_time_of_day_check" check ((time_of_day = ANY (ARRAY['morning'::text, 'mid-morning'::text, 'post-nap'::text, 'afternoon'::text, 'any'::text])));
alter table public."activity_recommendations" enable row level security;
create table public."ai_events" (
  "id" uuid default uuid_generate_v4() not null,
  "child_id" uuid,
  "type" text,
  "content" text,
  "image_url" text,
  "linked_plan_item_id" uuid,
  "created_by" text,
  "created_at" timestamp without time zone default now()
);
alter table public."ai_events" enable row level security;
create table public."ai_generations" (
  "id" uuid default uuid_generate_v4() not null,
  "child_id" uuid,
  "type" text,
  "input" jsonb,
  "output" jsonb,
  "model" text,
  "model_version" text,
  "prompt_version" text,
  "created_at" timestamp without time zone default now()
);
alter table public."ai_generations" enable row level security;
create table public."ai_insights" (
  "id" text not null,
  "child_id" text not null,
  "insight_date" date not null,
  "insight_type" text not null,
  "title" text not null,
  "body" text not null,
  "confidence" text,
  "data_window_days" integer,
  "tags" text[] default '{}'::text[],
  "source_types" text[] default '{}'::text[],
  "is_dismissed" boolean default false,
  "is_saved" boolean default false,
  "created_at" timestamp with time zone not null
);
alter table public."ai_insights" add constraint "ai_insights_confidence_check" check ((confidence = ANY (ARRAY['emerging'::text, 'consistent'::text, 'well-established'::text])));
alter table public."ai_insights" add constraint "ai_insights_insight_type_check" check ((insight_type = ANY (ARRAY['pattern'::text, 'correlation'::text, 'developmental-observation'::text, 'language'::text, 'sleep'::text, 'mood'::text, 'feeding'::text, 'recommendation'::text])));
alter table public."ai_insights" enable row level security;
create table public."ai_plan_items" (
  "id" uuid default uuid_generate_v4() not null,
  "plan_id" uuid,
  "child_id" uuid,
  "time" text,
  "activity" text,
  "type" text,
  "status" text default 'pending'::text,
  "created_at" timestamp without time zone default now()
);
alter table public."ai_plan_items" enable row level security;
create table public."ai_plans" (
  "id" uuid default uuid_generate_v4() not null,
  "child_id" uuid,
  "ai_generation_id" uuid,
  "date" date,
  "summary" text,
  "status" text default 'active'::text,
  "created_at" timestamp without time zone default now()
);
alter table public."ai_plans" enable row level security;
create table public."ai_summaries" (
  "id" text default (gen_random_uuid())::text not null,
  "child_id" text,
  "summary_date" date not null,
  "headline" text not null,
  "summary" text not null,
  "highlights" jsonb,
  "created_at" timestamp with time zone default now()
);
alter table public."ai_summaries" enable row level security;
create table public."approval_requests" (
  "id" text not null,
  "child_id" text not null,
  "request_type" text not null,
  "body" text not null,
  "requested_by" text not null,
  "requested_by_type" text not null,
  "status" text default 'pending'::text not null,
  "response_body" text,
  "responded_by" text,
  "created_at" timestamp with time zone not null,
  "responded_at" timestamp with time zone
);
alter table public."approval_requests" add constraint "approval_requests_request_type_check" check ((request_type = ANY (ARRAY['activity-change'::text, 'food-introduction'::text, 'schedule-shift'::text, 'milestone-confirm'::text])));
alter table public."approval_requests" add constraint "approval_requests_requested_by_type_check" check ((requested_by_type = ANY (ARRAY['nanny'::text, 'parent'::text])));
alter table public."approval_requests" add constraint "approval_requests_status_check" check ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'dismissed'::text])));
alter table public."approval_requests" enable row level security;
create table public."child_activity_preferences" (
  "id" text default (gen_random_uuid())::text not null,
  "child_id" text not null,
  "category" text not null,
  "activity" text not null,
  "preference_level" text not null,
  "notes" text,
  "created_at" timestamp with time zone default now()
);
alter table public."child_activity_preferences" add constraint "child_activity_preferences_preference_level_check" check ((preference_level = ANY (ARRAY['loves'::text, 'likes'::text, 'neutral'::text, 'dislikes'::text])));
alter table public."child_activity_preferences" enable row level security;
create table public."child_developmental_snapshots" (
  "id" text default (gen_random_uuid())::text not null,
  "child_id" text not null,
  "assessed_at" date not null,
  "gross_motor" text,
  "fine_motor" text,
  "language_receptive" text,
  "language_expressive" text,
  "social_emotional" text,
  "cognitive" text,
  "sensitive_periods" text[] default '{}'::text[],
  "focus_areas" text[] default '{}'::text[],
  "assessor_notes" text,
  "created_at" timestamp with time zone default now()
);
alter table public."child_developmental_snapshots" add constraint "child_developmental_snapshots_cognitive_check" check ((cognitive = ANY (ARRAY['emerging'::text, 'on-track'::text, 'advanced'::text])));
alter table public."child_developmental_snapshots" add constraint "child_developmental_snapshots_fine_motor_check" check ((fine_motor = ANY (ARRAY['emerging'::text, 'on-track'::text, 'advanced'::text])));
alter table public."child_developmental_snapshots" add constraint "child_developmental_snapshots_gross_motor_check" check ((gross_motor = ANY (ARRAY['emerging'::text, 'on-track'::text, 'advanced'::text])));
alter table public."child_developmental_snapshots" add constraint "child_developmental_snapshots_language_expressive_check" check ((language_expressive = ANY (ARRAY['emerging'::text, 'on-track'::text, 'advanced'::text])));
alter table public."child_developmental_snapshots" add constraint "child_developmental_snapshots_language_receptive_check" check ((language_receptive = ANY (ARRAY['emerging'::text, 'on-track'::text, 'advanced'::text])));
alter table public."child_developmental_snapshots" add constraint "child_developmental_snapshots_social_emotional_check" check ((social_emotional = ANY (ARRAY['emerging'::text, 'on-track'::text, 'advanced'::text])));
alter table public."child_developmental_snapshots" enable row level security;
create table public."child_feeding_preferences" (
  "child_id" text not null,
  "feeding_method" text default 'self-feeding'::text,
  "cup_type" text,
  "accepted_textures" text[] default '{}'::text[],
  "rejected_textures" text[] default '{}'::text[],
  "favorite_foods" text[] default '{}'::text[],
  "foods_to_introduce" text[] default '{}'::text[],
  "allergy_watch" text[] default '{}'::text[],
  "meal_pace" text,
  "self_feeds" boolean default true,
  "notes" text,
  "updated_at" timestamp with time zone default now()
);
alter table public."child_feeding_preferences" add constraint "child_feeding_preferences_meal_pace_check" check ((meal_pace = ANY (ARRAY['slow'::text, 'typical'::text, 'fast'::text])));
alter table public."child_feeding_preferences" enable row level security;
create table public."child_language_snapshots" (
  "id" text default (gen_random_uuid())::text not null,
  "child_id" text not null,
  "assessed_at" date not null,
  "receptive_vocab_count" integer,
  "expressive_vocab_count" integer,
  "known_words" text[] default '{}'::text[],
  "uses_signs" boolean default false,
  "known_signs" text[] default '{}'::text[],
  "gesture_types" text[] default '{}'::text[],
  "babbling_complexity" text,
  "communication_style" text,
  "notes" text,
  "created_at" timestamp with time zone default now()
);
alter table public."child_language_snapshots" add constraint "child_language_snapshots_babbling_complexity_check" check ((babbling_complexity = ANY (ARRAY['single'::text, 'varied'::text, 'sentence-like'::text])));
alter table public."child_language_snapshots" enable row level security;
create table public."child_profiles" (
  "child_id" text not null,
  "temperament" text,
  "montessori_plane" text default 'first'::text,
  "primary_focus" text,
  "allergies" text[] default '{}'::text[],
  "medical_notes" text,
  "pediatrician_name" text,
  "last_checkup_date" date,
  "next_checkup_date" date,
  "weight_kg" numeric,
  "height_cm" numeric,
  "notes" text,
  "updated_at" timestamp with time zone default now()
);
alter table public."child_profiles" add constraint "child_profiles_temperament_check" check ((temperament = ANY (ARRAY['easy'::text, 'slow-to-warm'::text, 'spirited'::text])));
alter table public."child_profiles" enable row level security;
create table public."child_sensory_preferences" (
  "id" text default (gen_random_uuid())::text not null,
  "child_id" text not null,
  "domain" text not null,
  "sensitivity_level" text not null,
  "notes" text,
  "created_at" timestamp with time zone default now()
);
alter table public."child_sensory_preferences" add constraint "child_sensory_preferences_domain_check" check ((domain = ANY (ARRAY['tactile'::text, 'auditory'::text, 'visual'::text, 'vestibular'::text, 'proprioceptive'::text, 'oral'::text, 'olfactory'::text])));
alter table public."child_sensory_preferences" add constraint "child_sensory_preferences_sensitivity_level_check" check ((sensitivity_level = ANY (ARRAY['seeking'::text, 'typical'::text, 'sensitive'::text, 'avoidant'::text])));
alter table public."child_sensory_preferences" enable row level security;
create table public."child_sleep_profiles" (
  "child_id" text not null,
  "typical_wake_time" time without time zone,
  "nap_count_per_day" integer default 1,
  "typical_nap_start" time without time zone,
  "typical_nap_duration_min" integer,
  "typical_bedtime" time without time zone,
  "white_noise" boolean default false,
  "blackout_curtains" boolean default false,
  "sleep_cues" text[] default '{}'::text[],
  "wind_down_routine" text,
  "avg_overnight_wake_count" integer default 0,
  "notes" text,
  "updated_at" timestamp with time zone default now()
);
alter table public."child_sleep_profiles" enable row level security;
create table public."children" (
  "id" text not null,
  "name" text not null,
  "full_name" text,
  "birth_date" date,
  "emoji" text default '🧒'::text,
  "focus" text,
  "mood" text,
  "mood_label" text,
  "household_id" uuid,
  "created_at" timestamp with time zone default now()
);
alter table public."children" enable row level security;
create table public."feedback" (
  "id" uuid default gen_random_uuid() not null,
  "created_at" timestamp with time zone default now(),
  "user_id" uuid,
  "household_id" uuid,
  "feedback_type" text not null,
  "title" text,
  "message" text not null,
  "page" text,
  "status" text default 'new'::text,
  "app_version" text,
  "metadata" jsonb default '{}'::jsonb
);
alter table public."feedback" enable row level security;
create table public."grocery_items" (
  "id" text default (gen_random_uuid())::text not null,
  "child_id" text,
  "name" text not null,
  "completed" boolean default false,
  "created_by" text default 'parent'::text,
  "created_at" timestamp with time zone default now()
);
alter table public."grocery_items" enable row level security;
create table public."grocery_list_items" (
  "id" text not null,
  "list_id" text not null,
  "child_id" text,
  "name" text not null,
  "category" text,
  "quantity" text,
  "priority" text default 'routine'::text not null,
  "is_recurring" boolean default false,
  "completed" boolean default false,
  "completed_by" text,
  "completed_at" timestamp with time zone,
  "added_by" text not null,
  "notes" text,
  "created_at" timestamp with time zone not null
);
alter table public."grocery_list_items" add constraint "grocery_list_items_category_check" check ((category = ANY (ARRAY['produce'::text, 'dairy'::text, 'protein'::text, 'snacks'::text, 'grains'::text, 'baby'::text, 'household'::text, 'pharmacy'::text, 'frozen'::text, 'beverages'::text])));
alter table public."grocery_list_items" add constraint "grocery_list_items_priority_check" check ((priority = ANY (ARRAY['urgent'::text, 'routine'::text, 'whenever'::text])));
alter table public."grocery_list_items" enable row level security;
create table public."grocery_lists" (
  "id" text not null,
  "household_id" uuid,
  "name" text not null,
  "list_type" text not null,
  "week_of" date,
  "created_by" text not null,
  "is_archived" boolean default false,
  "created_at" timestamp with time zone not null
);
alter table public."grocery_lists" add constraint "grocery_lists_list_type_check" check ((list_type = ANY (ARRAY['groceries'::text, 'household'::text, 'pharmacy'::text, 'baby'::text])));
alter table public."grocery_lists" enable row level security;
create table public."household_members" (
  "user_id" uuid not null,
  "household_id" uuid not null,
  "role" text not null,
  "created_at" timestamp with time zone default now(),
  "status" text default 'active'::text not null
);
alter table public."household_members" add constraint "household_members_role_check" check ((role = ANY (ARRAY['parent'::text, 'nanny'::text])));
alter table public."household_members" add constraint "household_members_status_check" check ((status = ANY (ARRAY['active'::text, 'invited'::text, 'removed'::text])));
alter table public."household_members" enable row level security;
create table public."household_notes" (
  "id" text not null,
  "household_id" uuid,
  "child_id" text,
  "note_type" text not null,
  "body" text not null,
  "created_by" text not null,
  "is_resolved" boolean default false,
  "resolved_at" timestamp with time zone,
  "created_at" timestamp with time zone not null
);
alter table public."household_notes" add constraint "household_notes_note_type_check" check ((note_type = ANY (ARRAY['reminder'::text, 'handoff'::text, 'supply-low'::text, 'routine-update'::text, 'schedule-change'::text])));
alter table public."household_notes" enable row level security;
create table public."households" (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "created_at" timestamp with time zone default now()
);
alter table public."households" enable row level security;
create table public."journal_entries" (
  "id" text not null,
  "child_id" text not null,
  "entry_date" date not null,
  "author_type" text not null,
  "author_name" text not null,
  "title" text not null,
  "body" text not null,
  "mood_emoji" text,
  "tags" text[] default '{}'::text[],
  "photos" jsonb default '[]'::jsonb,
  "is_favorite" boolean default false,
  "created_at" timestamp with time zone not null
);
alter table public."journal_entries" add constraint "journal_entries_author_type_check" check ((author_type = ANY (ARRAY['parent'::text, 'nanny'::text])));
alter table public."journal_entries" enable row level security;
create table public."memory_events" (
  "id" text default (gen_random_uuid())::text not null,
  "child_id" text,
  "type" text,
  "content" text not null,
  "category" text,
  "image_url" text,
  "created_by" text default 'nanny'::text,
  "is_favorite" boolean default false,
  "created_at" timestamp with time zone not null
);
alter table public."memory_events" add constraint "memory_events_category_check" check ((category = ANY (ARRAY['meal'::text, 'outdoor'::text, 'play'::text, 'nap'::text, 'learning'::text])));
alter table public."memory_events" add constraint "memory_events_type_check" check ((type = ANY (ARRAY['photo'::text, 'note'::text, 'milestone'::text])));
alter table public."memory_events" enable row level security;
create table public."memory_reactions" (
  "id" text not null,
  "target_type" text not null,
  "target_id" text not null,
  "emoji" text not null,
  "author_type" text not null,
  "author_name" text not null,
  "created_at" timestamp with time zone not null
);
alter table public."memory_reactions" add constraint "memory_reactions_author_type_check" check ((author_type = ANY (ARRAY['parent'::text, 'nanny'::text])));
alter table public."memory_reactions" add constraint "memory_reactions_target_type_check" check ((target_type = ANY (ARRAY['memory_event'::text, 'journal_entry'::text, 'ai_summary'::text, 'household_note'::text])));
alter table public."memory_reactions" enable row level security;
create table public."nanny_child_relationships" (
  "id" text default (gen_random_uuid())::text not null,
  "nanny_user_id" uuid not null,
  "child_id" text not null,
  "start_date" date not null,
  "schedule_days" text[] default '{}'::text[],
  "schedule_start_time" time without time zone,
  "schedule_end_time" time without time zone,
  "caregiving_philosophy" text,
  "special_skills" text,
  "bond_description" text,
  "communication_style" text,
  "created_at" timestamp with time zone default now()
);
alter table public."nanny_child_relationships" enable row level security;
create table public."parent_child_relationships" (
  "id" text default (gen_random_uuid())::text not null,
  "parent_user_id" uuid not null,
  "child_id" text not null,
  "relationship_label" text not null,
  "is_primary_caregiver" boolean default false,
  "caregiving_days" text[] default '{}'::text[],
  "bonding_activities" text[] default '{}'::text[],
  "parenting_notes" text,
  "created_at" timestamp with time zone default now()
);
alter table public."parent_child_relationships" add constraint "parent_child_relationships_relationship_label_check" check ((relationship_label = ANY (ARRAY['mother'::text, 'father'::text, 'guardian'::text, 'grandparent'::text, 'other'::text])));
alter table public."parent_child_relationships" enable row level security;
create table public."profiles" (
  "id" uuid not null,
  "email" text,
  "full_name" text,
  "avatar_url" text,
  "default_household_id" uuid,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);
alter table public."profiles" enable row level security;
create table public."push_subscriptions" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "household_id" uuid not null,
  "subscription" jsonb not null,
  "role" text not null,
  "created_at" timestamp with time zone default now()
);
alter table public."push_subscriptions" enable row level security;
create table public."schedule_blocks" (
  "id" text not null,
  "template_id" text not null,
  "sort_order" integer not null,
  "label" text not null,
  "start_time" time without time zone not null,
  "end_time" time without time zone not null,
  "block_type" text not null,
  "activity_category" text,
  "notes" text
);
alter table public."schedule_blocks" add constraint "schedule_blocks_block_type_check" check ((block_type = ANY (ARRAY['fixed'::text, 'flexible'::text, 'nap_window'::text, 'transition'::text])));
alter table public."schedule_blocks" enable row level security;
create table public."schedule_items" (
  "id" text not null,
  "child_id" text,
  "time" text not null,
  "title" text not null,
  "type" text,
  "done" boolean default false,
  "active" boolean default false,
  "notes" text,
  "scheduled_date" date not null,
  "created_at" timestamp with time zone default now()
);
alter table public."schedule_items" add constraint "schedule_items_type_check" check ((type = ANY (ARRAY['meal'::text, 'outdoor'::text, 'play'::text, 'nap'::text, 'learning'::text])));
alter table public."schedule_items" enable row level security;
create table public."schedule_templates" (
  "id" text not null,
  "name" text not null,
  "day_type" text not null,
  "description" text,
  "suitable_for" text,
  "created_at" timestamp with time zone default now()
);
alter table public."schedule_templates" enable row level security;
create table public."threaded_replies" (
  "id" text not null,
  "target_type" text not null,
  "target_id" text not null,
  "body" text not null,
  "author_type" text not null,
  "author_name" text not null,
  "created_at" timestamp with time zone not null
);
alter table public."threaded_replies" add constraint "threaded_replies_author_type_check" check ((author_type = ANY (ARRAY['parent'::text, 'nanny'::text])));
alter table public."threaded_replies" add constraint "threaded_replies_target_type_check" check ((target_type = ANY (ARRAY['memory_event'::text, 'journal_entry'::text, 'ai_summary'::text, 'household_note'::text, 'ai_insight'::text])));
alter table public."threaded_replies" enable row level security;
create table public."voice_notes" (
  "id" text not null,
  "child_id" text not null,
  "target_type" text,
  "target_id" text,
  "duration_sec" integer not null,
  "storage_url" text,
  "transcript" text,
  "author_type" text not null,
  "author_name" text not null,
  "created_at" timestamp with time zone not null
);
alter table public."voice_notes" add constraint "voice_notes_author_type_check" check ((author_type = ANY (ARRAY['parent'::text, 'nanny'::text])));
alter table public."voice_notes" add constraint "voice_notes_target_type_check" check ((target_type = ANY (ARRAY['journal_entry'::text, 'memory_event'::text, 'schedule_item'::text, 'standalone'::text])));
alter table public."voice_notes" enable row level security;
CREATE UNIQUE INDEX activity_completions_pkey ON public.activity_completions USING btree (id);
CREATE UNIQUE INDEX activity_library_pkey ON public.activity_library USING btree (id);
CREATE UNIQUE INDEX activity_logs_pkey ON public.activity_logs USING btree (id);
CREATE INDEX idx_activity_logs_child_date ON public.activity_logs USING btree (child_id, local_date);
CREATE UNIQUE INDEX activity_recommendations_pkey ON public.activity_recommendations USING btree (id);
CREATE UNIQUE INDEX ai_events_pkey ON public.ai_events USING btree (id);
CREATE UNIQUE INDEX ai_generations_pkey ON public.ai_generations USING btree (id);
CREATE UNIQUE INDEX ai_insights_pkey ON public.ai_insights USING btree (id);
CREATE UNIQUE INDEX ai_plan_items_pkey ON public.ai_plan_items USING btree (id);
CREATE UNIQUE INDEX ai_plans_pkey ON public.ai_plans USING btree (id);
CREATE UNIQUE INDEX ai_summaries_pkey ON public.ai_summaries USING btree (id);
CREATE UNIQUE INDEX approval_requests_pkey ON public.approval_requests USING btree (id);
CREATE UNIQUE INDEX child_activity_preferences_child_id_activity_key ON public.child_activity_preferences USING btree (child_id, activity);
CREATE UNIQUE INDEX child_activity_preferences_pkey ON public.child_activity_preferences USING btree (id);
CREATE UNIQUE INDEX child_developmental_snapshots_pkey ON public.child_developmental_snapshots USING btree (id);
CREATE UNIQUE INDEX child_feeding_preferences_pkey ON public.child_feeding_preferences USING btree (child_id);
CREATE UNIQUE INDEX child_language_snapshots_pkey ON public.child_language_snapshots USING btree (id);
CREATE UNIQUE INDEX child_profiles_pkey ON public.child_profiles USING btree (child_id);
CREATE UNIQUE INDEX child_sensory_preferences_child_id_domain_key ON public.child_sensory_preferences USING btree (child_id, domain);
CREATE UNIQUE INDEX child_sensory_preferences_pkey ON public.child_sensory_preferences USING btree (id);
CREATE UNIQUE INDEX child_sleep_profiles_pkey ON public.child_sleep_profiles USING btree (child_id);
CREATE UNIQUE INDEX children_pkey ON public.children USING btree (id);
CREATE UNIQUE INDEX feedback_pkey ON public.feedback USING btree (id);
CREATE UNIQUE INDEX grocery_items_pkey ON public.grocery_items USING btree (id);
CREATE UNIQUE INDEX grocery_list_items_pkey ON public.grocery_list_items USING btree (id);
CREATE UNIQUE INDEX grocery_lists_pkey ON public.grocery_lists USING btree (id);
CREATE UNIQUE INDEX household_members_pkey ON public.household_members USING btree (user_id, household_id);
CREATE INDEX idx_household_members_user_status ON public.household_members USING btree (user_id, status);
CREATE UNIQUE INDEX household_notes_pkey ON public.household_notes USING btree (id);
CREATE UNIQUE INDEX households_pkey ON public.households USING btree (id);
CREATE UNIQUE INDEX journal_entries_pkey ON public.journal_entries USING btree (id);
CREATE UNIQUE INDEX memory_events_pkey ON public.memory_events USING btree (id);
CREATE UNIQUE INDEX memory_reactions_pkey ON public.memory_reactions USING btree (id);
CREATE UNIQUE INDEX nanny_child_relationships_nanny_user_id_child_id_key ON public.nanny_child_relationships USING btree (nanny_user_id, child_id);
CREATE UNIQUE INDEX nanny_child_relationships_pkey ON public.nanny_child_relationships USING btree (id);
CREATE UNIQUE INDEX parent_child_relationships_parent_user_id_child_id_key ON public.parent_child_relationships USING btree (parent_user_id, child_id);
CREATE UNIQUE INDEX parent_child_relationships_pkey ON public.parent_child_relationships USING btree (id);
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);
CREATE UNIQUE INDEX push_subscriptions_pkey ON public.push_subscriptions USING btree (id);
CREATE UNIQUE INDEX schedule_blocks_pkey ON public.schedule_blocks USING btree (id);
CREATE UNIQUE INDEX schedule_items_pkey ON public.schedule_items USING btree (id);
CREATE UNIQUE INDEX schedule_templates_pkey ON public.schedule_templates USING btree (id);
CREATE UNIQUE INDEX threaded_replies_pkey ON public.threaded_replies USING btree (id);
CREATE UNIQUE INDEX voice_notes_pkey ON public.voice_notes USING btree (id);
CREATE OR REPLACE FUNCTION public.my_household_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT household_id FROM household_members WHERE user_id = auth.uid() LIMIT 1
$function$
;
CREATE OR REPLACE FUNCTION public.in_my_household(p_child_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM children
    WHERE id = p_child_id AND household_id = my_household_id()
  )
$function$
;
CREATE OR REPLACE FUNCTION public.my_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM household_members WHERE user_id = auth.uid() LIMIT 1
$function$
;
create policy "household members can delete activity_logs" on "public"."activity_logs" as PERMISSIVE for DELETE to public using ((child_id IN ( SELECT c.id
   FROM (children c
     JOIN household_members hm ON ((hm.household_id = c.household_id)))
  WHERE (hm.user_id = auth.uid()))));
create policy "household members can insert activity_logs" on "public"."activity_logs" as PERMISSIVE for INSERT to public with check ((child_id IN ( SELECT c.id
   FROM (children c
     JOIN household_members hm ON ((hm.household_id = c.household_id)))
  WHERE (hm.user_id = auth.uid()))));
create policy "household members can read activity_logs" on "public"."activity_logs" as PERMISSIVE for SELECT to public using ((child_id IN ( SELECT c.id
   FROM (children c
     JOIN household_members hm ON ((hm.household_id = c.household_id)))
  WHERE (hm.user_id = auth.uid()))));
create policy "allow authenticated insert" on "public"."ai_plans" as PERMISSIVE for INSERT to "authenticated" with check (true);
create policy "allow authenticated read" on "public"."ai_plans" as PERMISSIVE for SELECT to "authenticated" using (true);
create policy "ai:delete" on "public"."ai_summaries" as PERMISSIVE for DELETE to public using ((in_my_household(child_id) AND (my_role() = 'parent'::text)));
create policy "ai:insert" on "public"."ai_summaries" as PERMISSIVE for INSERT to public with check ((in_my_household(child_id) AND (my_role() = 'parent'::text)));
create policy "ai:select" on "public"."ai_summaries" as PERMISSIVE for SELECT to public using (in_my_household(child_id));
create policy "children:delete" on "public"."children" as PERMISSIVE for DELETE to public using (((household_id = my_household_id()) AND (my_role() = 'parent'::text)));
create policy "children:insert" on "public"."children" as PERMISSIVE for INSERT to public with check (((household_id = my_household_id()) AND (my_role() = 'parent'::text)));
create policy "children:select" on "public"."children" as PERMISSIVE for SELECT to public using ((household_id = my_household_id()));
create policy "children:update" on "public"."children" as PERMISSIVE for UPDATE to public using (((household_id = my_household_id()) AND (my_role() = 'parent'::text)));
create policy "grocery:delete" on "public"."grocery_items" as PERMISSIVE for DELETE to public using ((in_my_household(child_id) AND (my_role() = 'parent'::text)));
create policy "grocery:insert" on "public"."grocery_items" as PERMISSIVE for INSERT to public with check (in_my_household(child_id));
create policy "grocery:select" on "public"."grocery_items" as PERMISSIVE for SELECT to public using (in_my_household(child_id));
create policy "grocery:update" on "public"."grocery_items" as PERMISSIVE for UPDATE to public using (in_my_household(child_id));
create policy "members:delete" on "public"."household_members" as PERMISSIVE for DELETE to public using (((household_id = my_household_id()) AND (my_role() = 'parent'::text)));
create policy "members:insert" on "public"."household_members" as PERMISSIVE for INSERT to public with check (((household_id = my_household_id()) AND (my_role() = 'parent'::text)));
create policy "members:select" on "public"."household_members" as PERMISSIVE for SELECT to public using ((household_id = my_household_id()));
create policy "households:select" on "public"."households" as PERMISSIVE for SELECT to public using ((id = my_household_id()));
create policy "memory:delete" on "public"."memory_events" as PERMISSIVE for DELETE to public using ((in_my_household(child_id) AND (my_role() = 'parent'::text)));
create policy "memory:insert" on "public"."memory_events" as PERMISSIVE for INSERT to public with check (in_my_household(child_id));
create policy "memory:select" on "public"."memory_events" as PERMISSIVE for SELECT to public using (in_my_household(child_id));
create policy "memory:update" on "public"."memory_events" as PERMISSIVE for UPDATE to public using ((in_my_household(child_id) AND (my_role() = 'parent'::text)));
create policy "photos:delete" on "storage"."objects" as PERMISSIVE for DELETE to "authenticated" using (((bucket_id = 'photos'::text) AND (auth.uid() = owner)));
create policy "photos:insert" on "storage"."objects" as PERMISSIVE for INSERT to "authenticated" with check ((bucket_id = 'photos'::text));
create policy "photos:select" on "storage"."objects" as PERMISSIVE for SELECT to public using ((bucket_id = 'photos'::text));
create policy "Users can insert their own profile" on "public"."profiles" as PERMISSIVE for INSERT to "authenticated" with check ((auth.uid() = id));
create policy "Users can update their own profile" on "public"."profiles" as PERMISSIVE for UPDATE to "authenticated" using ((auth.uid() = id)) with check ((auth.uid() = id));
create policy "Users can view their own profile" on "public"."profiles" as PERMISSIVE for SELECT to "authenticated" using ((auth.uid() = id));
create policy "users manage own subscriptions" on "public"."push_subscriptions" as PERMISSIVE for ALL to "authenticated" using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
create policy "schedule:delete" on "public"."schedule_items" as PERMISSIVE for DELETE to public using ((in_my_household(child_id) AND (my_role() = 'parent'::text)));
create policy "schedule:insert" on "public"."schedule_items" as PERMISSIVE for INSERT to public with check ((in_my_household(child_id) AND (my_role() = 'parent'::text)));
create policy "schedule:select" on "public"."schedule_items" as PERMISSIVE for SELECT to public using (in_my_household(child_id));
create policy "schedule:update" on "public"."schedule_items" as PERMISSIVE for UPDATE to public using (in_my_household(child_id));
grant select,insert,update,delete on all tables in schema public to anon,authenticated;
grant all on all tables in schema public to service_role;
insert into storage.buckets(id,name,public) values ('photos','photos',true),('memories','memories',false);
