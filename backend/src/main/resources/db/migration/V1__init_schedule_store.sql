create table schedule_job (
    id varchar(64) primary key,
    scenario_name varchar(255) not null,
    status varchar(32) not null,
    solver_status varchar(64) not null,
    version_id varchar(64),
    error_message text,
    created_at timestamptz not null,
    completed_at timestamptz
);

create table schedule_version (
    id varchar(64) primary key,
    version_name varchar(255) not null,
    status varchar(32) not null,
    trigger_type varchar(32) not null,
    scenario_description varchar(255) not null,
    created_at timestamptz not null,
    published_at timestamptz,
    total_weighted_tardiness integer not null,
    total_makespan integer not null,
    late_task_count integer not null,
    average_utilization double precision not null
);

create table schedule_row (
    id bigserial primary key,
    version_id varchar(64) not null references schedule_version(id) on delete cascade,
    row_code varchar(64) not null,
    label varchar(255) not null,
    resource_type varchar(32) not null,
    sort_order integer not null
);

create index idx_schedule_row_version on schedule_row(version_id);

create table schedule_bar (
    id bigserial primary key,
    version_id varchar(64) not null references schedule_version(id) on delete cascade,
    bar_code varchar(64) not null,
    row_code varchar(64) not null,
    start_ms bigint not null,
    end_ms bigint not null,
    label varchar(255) not null,
    product_code varchar(64) not null,
    priority integer not null,
    due_date_ms bigint not null,
    late boolean not null,
    tardiness_minutes integer not null,
    pinned boolean not null
);

create index idx_schedule_bar_version on schedule_bar(version_id);
