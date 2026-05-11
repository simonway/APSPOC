alter table auth_user drop constraint if exists chk_auth_user_singleton;

alter table auth_user alter column id type bigint;

create sequence if not exists auth_user_id_seq;
select setval('auth_user_id_seq', coalesce((select max(id) from auth_user), 1), true);
alter table auth_user alter column id set default nextval('auth_user_id_seq');
alter sequence auth_user_id_seq owned by auth_user.id;

alter table auth_user add column if not exists role varchar(32);
update auth_user set role = 'ADMIN' where role is null;
alter table auth_user alter column role set not null;

alter table schedule_job add column if not exists actor_username varchar(64);
alter table schedule_job add column if not exists source_request_json text;
alter table schedule_job add column if not exists failure_reason varchar(64);
update schedule_job set actor_username = 'system' where actor_username is null;
alter table schedule_job alter column actor_username set not null;

alter table schedule_version add column if not exists created_by varchar(64);
update schedule_version set created_by = 'system' where created_by is null;
alter table schedule_version alter column created_by set not null;
