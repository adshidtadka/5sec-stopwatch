import time
import datetime
from flask import Flask, render_template, send_from_directory, request
import os
import json

DEBUG = False
SERVER_NAME = "localhost:5000"

app = Flask(__name__)
app.config.from_object(__name__)


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static/img'), 'stopwatch.png')


@app.route('/')
def index():
    user_name = request.args.get("userName")
    return render_template('index.html', user_name=user_name)


@app.route('/play')
def play():
    user_name = request.args.get("userName")
    return render_template('play.html', user_name=user_name, is_auto=False)


@app.route("/autoplay")
def auto_play():
    user_name = request.args.get("userName")
    return render_template('play.html', user_name=user_name,  is_auto=True)


if __name__ == '__main__':
    app.run()
