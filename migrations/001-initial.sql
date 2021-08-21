--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

create table sys (
    key varchar(255) primary key,
    value text not null
);

create table plans (
    id varchar(128) primary key,
    name varchar(255) not null,
    version integer not null default 0,
    deleted boolean not null default false
);

create table words (
    plan_id varchar(128) not null,
    word varchar(128),
    time integer not null,
    paraphrase text not null default '',
    show_paraphrase bool,
    color varchar(32),
    status integer not null default 0,
    version integer not null default 0,
    deleted boolean not null default false,
    primary key (plan_id, word)
);

create index words_plan_id on words(plan_id);

create table settings (
    key varchar(255) primary key,
    value text not null
);

create table sync (
    plan_id varchar(128) primary key,
    version varchar(255),
    sequence integer not null
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

drop table sys;
drop table plans;
drop table words;
drop table settings;
drop table sync;
