create table schedule_changeover (
    id bigserial primary key,
    version_id varchar(64) not null references schedule_version(id) on delete cascade,
    changeover_code varchar(128) not null,
    row_code varchar(64) not null,
    from_task_code varchar(128) not null,
    to_task_code varchar(128) not null,
    start_ms bigint not null,
    end_ms bigint not null,
    duration_minutes integer not null
);

create index idx_schedule_changeover_version on schedule_changeover(version_id);
