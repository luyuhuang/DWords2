--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

create table words (
    plan_id integer not null,
    word varchar(128),
    time integer not null default
        (cast((julianday('now') - 2440587.5) * 86400000 as integer)),
    paraphrase text not null default '',
    show_paraphrase bool,
    color varchar(32),
    status integer not null default 0,
    primary key (plan_id, word)
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

drop table words;
