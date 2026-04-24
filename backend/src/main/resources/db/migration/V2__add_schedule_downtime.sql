create table schedule_downtime (
    id bigserial primary key,
    version_id varchar(64) not null references schedule_version(id) on delete cascade,
    downtime_code varchar(64) not null,
    row_code varchar(64) not null,
    start_ms bigint not null,
    end_ms bigint not null,
    downtime_type varchar(64) not null,
    source varchar(64) not null,
    description text not null
);

create index idx_schedule_downtime_version on schedule_downtime(version_id);
