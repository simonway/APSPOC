create table version_audit_event (
    id bigserial primary key,
    target_version_id varchar(64) not null references schedule_version(id) on delete cascade,
    previous_published_version_id varchar(64) references schedule_version(id) on delete set null,
    event_type varchar(32) not null,
    created_at timestamptz not null
);

create index idx_version_audit_event_target_created
    on version_audit_event(target_version_id, created_at desc);

create index idx_version_audit_event_created
    on version_audit_event(created_at desc);
