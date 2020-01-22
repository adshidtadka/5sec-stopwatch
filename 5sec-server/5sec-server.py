from flask import Flask, request, g, redirect, url_for
from flask_cors import CORS, cross_origin
from contextlib import closing
import sqlite3
import json
import sys
import os
import requests

args = sys.argv
SERVER_NAME = "localhost:" + str(4000 + int(sys.argv[1]))
DEBUG = False
DATABASE = "models/5sec-server_" + sys.argv[1] + ".db"

app = Flask(__name__)
app.config.from_object(__name__)
CORS(app)


def connect_db():
    return sqlite3.connect(app.config['DATABASE'])


def init_db():
    with closing(connect_db()) as db:
        with app.open_resource('models/schema.sql') as f:
            db.cursor().executescript(f.read().decode('utf-8'))
        db.commit()


@app.route("/server_url", methods=["GET"])
@cross_origin()
def get_server_url():
    user_name = request.args.get("userName")
    with open("./allocation.json") as f:
        server_url = json.load(f)[user_name]
        return {"status": 200, "server_url": server_url}


@app.route("/game", methods=["GET"])
@cross_origin()
def get_game():
    game_tuple = g.db.execute("SELECT id, max(start_time) FROM games WHERE start_time >= (SELECT DATETIME('NOW', 'LOCALTIME'))").fetchone()
    game_dict = dict(id=game_tuple[0], start_time=game_tuple[1])
    return {"status": 200, "game": game_dict}


@app.route("/game", methods=["POST"])
@cross_origin()
def create_game():
    g.db.execute("INSERT INTO games(start_time) VALUES ((SELECT DATETIME(DATETIME('NOW', 'LOCALTIME'), '+5 SECONDS')))")
    g.db.commit()
    game_tuple = g.db.execute("SELECT id, max(start_time) FROM games").fetchone()
    game_dict = dict(id=game_tuple[0], start_time=game_tuple[1])

    # multicast
    with open("./allocation.json") as f:
        for server in json.load(f)["server_" + sys.argv[1]]:
            url = "http://" + server + "/sync_game"
            requests.post(url, data=game_dict)

    return {"status": 200, "game": game_dict}


@app.route("/sync_game", methods=["POST"])
@cross_origin()
def sync_game():
    g.db.execute("INSERT INTO games(id, start_time) VALUES (?, ?)", [request.form["id"], request.form["start_time"]])
    g.db.commit()
    return {"status": 200}


@app.route("/player", methods=["GET"])
@cross_origin()
def get_player():
    game_id = request.args.get("gameId")
    players = g.db.execute("SELECT id, user_name FROM players WHERE game_id = ?", [game_id])
    players_list = [dict(id=row[0], user_name=row[1]) for row in players.fetchall()]
    return {"status": 200, "players": players_list}


@app.route("/player", methods=["POST"])
@cross_origin()
def create_player():
    user_name = request.form["userName"]
    game_id = request.form["gameId"]
    g.db.execute("INSERT INTO players(game_id, user_name) VALUES (?, ?)", [game_id, user_name])
    g.db.commit()

    # multicast
    with open("./allocation.json") as f:
        for server in json.load(f)["server_" + sys.argv[1]]:
            url = "http://" + server + "/sync_player"
            requests.post(url, data=request.form)

    return {"status": 200}


@app.route("/sync_player", methods=["POST"])
@cross_origin()
def sync_player():
    user_name = request.form["userName"]
    game_id = request.form["gameId"]
    g.db.execute("INSERT INTO players(game_id, user_name) VALUES (?, ?)", [game_id, user_name])
    g.db.commit()
    return {"status": 200}


@app.route('/result', methods=["POST"])
@cross_origin()
def update_result():
    user_name = request.form["userName"]
    game_id = request.form["gameId"]
    score = request.form["score"]
    g.db.execute("UPDATE players SET score = ? WHERE game_id = ? AND user_name = ?", [score, game_id, user_name])
    g.db.commit()

    # multicast
    with open("./allocation.json") as f:
        for server in json.load(f)["server_" + sys.argv[1]]:
            url = "http://" + server + "/sync_result"
            requests.post(url, data=request.form)

    return {"status": 200}


@app.route('/sync_result', methods=["POST"])
@cross_origin()
def sync_result():
    user_name = request.form["userName"]
    game_id = request.form["gameId"]
    score = request.form["score"]
    g.db.execute("UPDATE players SET score = ? WHERE game_id = ? AND user_name = ?", [score, game_id, user_name])
    g.db.commit()
    return {"status": 200}


@app.route("/result", methods=["GET"])
@cross_origin()
def get_result():
    game_id = request.args.get("gameId")
    players = g.db.execute("SELECT id, user_name, score FROM players WHERE game_id = ? AND score NOT NULL ORDER BY score", [game_id])
    players_list = [dict(id=row[0], user_name=row[1], score=row[2]) for row in players.fetchall()]
    return {"status": 200, "players": players_list}


@app.before_request
def before_request():
    g.db = connect_db()


@app.after_request
def after_request(response):
    g.db.close()
    return response


if __name__ == '__main__':
    init_db()
    app.run()
