DROP TABLE IF EXISTS games;
CREATE TABLE games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time DATETIME NOT NULL
);

DROP TABLE IF EXISTS players;
CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INT NOT NULL,
    user_name STRING NOT NULL,
    score INT,
    determined_time DATETIME,
    UNIQUE (game_id, user_name)
);
