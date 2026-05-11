alter table schedule_version
    add column release_note text;

alter table version_audit_event
    add column actor_username varchar(255) not null default 'unknown';

alter table version_audit_event
    add column comment_text text not null default '';
