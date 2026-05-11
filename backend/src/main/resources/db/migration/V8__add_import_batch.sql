create table import_batch (
    id varchar(64) primary key,
    data_version varchar(128) not null,
    import_type varchar(32) not null,
    source_file_name varchar(255) not null,
    imported_by varchar(128) not null,
    created_at timestamptz not null,
    status varchar(32) not null,
    success_count integer not null,
    failure_count integer not null,
    payload_json text not null
);

create index idx_import_batch_data_version_type_created_at
    on import_batch(data_version, import_type, created_at desc);
