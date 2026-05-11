create table schedule_scenario (
    id varchar(64) primary key,
    scenario_name varchar(255) not null,
    data_version varchar(128),
    schedule_start_at timestamptz not null,
    horizon_minutes integer not null,
    created_at timestamptz not null,
    payload_json text not null
);

create index idx_schedule_scenario_created_at
    on schedule_scenario(created_at desc);
