import time
import datetime
from flask import Flask, render_template, send_from_directory
import sys
import os
import json

args = sys.argv
DEBUG = False
SERVER_NAME = "localhost:" + str(5000 + int(sys.argv[1]))
user_name = "user_" + sys.argv[1]

app = Flask(__name__)
app.config.from_object(__name__)


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static/img'), 'stopwatch.png')


@app.route('/')
def index():
    return render_template('index.html', user_name=user_name)


@app.route('/play')
def play():
    return render_template('play.html', user_name=user_name, is_auto=False)


@app.route("/autoplay")
def auto_play():
    return render_template('play.html', user_name=user_name,  is_auto=True)


if __name__ == '__main__':
    app.run()
