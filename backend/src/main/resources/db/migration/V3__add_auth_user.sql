create table auth_user (
    id smallint primary key,
    username varchar(64) not null unique,
    password_hash varchar(255) not null,
    updated_at timestamptz not null,
    constraint chk_auth_user_singleton check (id = 1)
);
