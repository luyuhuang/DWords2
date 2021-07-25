--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

create table sys (
    key varchar(255) primary key,
    value text not null
);

create table plans (
    id integer primary key autoincrement,
    name varchar(255) not null
);

create table words (
    plan_id integer not null,
    word varchar(128),
    time integer not null,
    paraphrase text not null default '',
    show_paraphrase bool,
    color varchar(32),
    status integer not null default 0,
    primary key (plan_id, word)
);

create index words_plan_id on words(plan_id);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

drop table sys;
drop table plans;
drop table words;
