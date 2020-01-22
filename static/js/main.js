const INF = 999999;
const COUNTDOWN = 3;
const TIMER = 5;
const userName = $("#user-name").text();
let isAuto;
let gameId;
let endLoadingTime, endTimerTime;
let timerTimeOut, getPlayersTimeOut;
let fetchedPlayers;
let serverUrl = "http://localhost:4001";

$(function() {
  if ($("#value-is-auto").text() == "True") {
    isAuto = true;

    $("#stop").text("Auto Play");
    $("#table-thead").remove();
    $("#table-tbody").remove();
    $("#message").text("Searching game...");

    joinGame();
  } else {
    isAuto = false;
    $("#stop").on("click", { isStop: true }, stopTimer);
    createGame();
  }
});

const getServerUrl = function() {
  $.ajax({
    url: serverUrl + "/server_url",
    type: "GET",
    data: {
      userName: userName
    }
  }).done(res => {
    serverUrl = "http://" + res.server_url;
  });
};

const joinGame = function() {
  getServerUrl();
  $.ajax({
    url: serverUrl + "/game",
    type: "GET"
  }).done(res => {
    if (res.game.id == null) {
      setTimeout(joinGame, 1000);
    } else {
      gameId = res.game.id;
      endLoadingTime = new Date(res.game.start_time);
      createPlayer();
    }
  });
};

const generateRandomScore = function() {
  const randomTime = Math.round(gaussian(50, 50)());
  const intervalTime =
    getRemainTime(endLoadingTime).time +
    (COUNTDOWN + TIMER) * 1000 -
    randomTime * 10;
  let randomScore;
  randomScore = randomTime == 0 ? INF : randomTime;
  setTimeout(postScore, intervalTime, randomScore);
};

const createGame = function() {
  getServerUrl();
  $.ajax({
    url: serverUrl + "/game",
    type: "POST"
  }).done(res => {
    endLoadingTime = new Date(res.game.start_time);
    gameId = res.game.id;
    createPlayer();
  });
};

const createPlayer = function() {
  $.ajax({
    url: serverUrl + "/player",
    type: "POST",
    data: {
      userName: userName,
      gameId: gameId
    }
  }).done(() => {
    if (isAuto == true) {
      generateRandomScore();
    } else {
      loading();
      fetchedPlayers = [];
      getPlayers();
    }
  });
};

const getPlayers = function() {
  $.ajax({
    url: serverUrl + "/player",
    type: "GET",
    data: {
      gameId: gameId
    }
  }).done(res => {
    let tbody;
    res.players.forEach((row, index) => {
      if (fetchedPlayers.includes(row["user_name"]) == false) {
        row["user_name"] == userName
          ? (tbody += "<tr class='bg-primary'>")
          : (tbody += "<tr>");
        tbody +=
          "<th scope='row'>" +
          String(parseInt(index) + 1) +
          "</th><td>" +
          row["user_name"] +
          "</td></tr>";
        fetchedPlayers.push(row["user_name"]);
      }
    });
    $("#table-tbody").append(tbody);
  });
  getPlayersTimeOut = setTimeout(getPlayers, 200);
};

const loading = function() {
  const remainTime = getRemainTime(endLoadingTime);
  if (remainTime.time >= 0) {
    $("#message").text(
      "Recruiting participants..." + String(remainTime.sec) + "s"
    );
    setTimeout(loading, 1000);
  } else {
    $("#message").text("");
    $("#message").removeClass("loading");

    clearTimeout(getPlayersTimeOut);

    countdown(COUNTDOWN);
  }
};

const countdown = function(sec) {
  if (sec > 0) {
    $("#countdown").text($("#countdown").text() + " " + String(sec));
    sec--;
    setTimeout(countdown, 1000, sec--);
  } else if (sec == 0) {
    $("#countdown").text($("#countdown").text() + " START!");
    $("#timer").removeClass("show");
    $("#countdown").removeClass("show");
    $("#stop").prop("disabled", false);

    const nowTime = new Date();
    endTimerTime = nowTime.setSeconds(nowTime.getSeconds() + TIMER);
    timer();
  }
};

const timer = function() {
  const remainTime = getRemainTime(endTimerTime);

  if (remainTime.time >= 0) {
    $("#timer").text(
      zeroPadding(remainTime.sec, 2) + ":" + zeroPadding(remainTime.ms, 2)
    );
    timerTimeOut = setTimeout(timer, 10);
  } else {
    stopTimer({ data: { isStop: false } });
  }
};

const stopTimer = function(e) {
  let score;
  if (e.data.isStop) {
    clearTimeout(timerTimeOut);
    const score_str = $("#timer").text();
    score =
      parseInt(score_str.substr(0, 2)) * 100 + parseInt(score_str.substr(3, 2));
  } else {
    $("#timer").text("--:--");
    score = INF;
  }

  $("#timer").addClass("show");
  $("#stop").remove();
  $("#table-thead").text("");
  $("#table-tbody").text("");

  postScore(score);
};

const postRandomScore = function() {
  $.ajax({
    url: serverUrl + "/result",
    type: "POST",
    data: {
      userName: userName,
      gameId: gameId,
      score: randomScore
    }
  }).done(() => {
    joinGame();
  });
};

const postScore = function(score) {
  $.ajax({
    url: serverUrl + "/result",
    type: "POST",
    data: {
      userName: userName,
      gameId: gameId,
      score: score
    }
  }).done(() => {
    if (isAuto == true) {
      joinGame();
    } else {
      $("#table-thead").append(
        "<tr><th scope='col'>#</th><th scope='col'>user</th><th scope='col'>score</th></tr>"
      );
      getResults();
    }
  });
};

const getResults = function() {
  $.ajax({
    url: serverUrl + "/result",
    type: "GET",
    data: {
      gameId: gameId
    }
  }).done(data => {
    let tbody;
    data["players"].forEach((row, index) => {
      row["user_name"] == userName
        ? (tbody += "<tr class='bg-primary'>")
        : (tbody += "<tr>");
      tbody +=
        "<th scope='row'>" +
        String(parseInt(index) + 1) +
        "</th > <td>" +
        row["user_name"] +
        "</td><td>" +
        parseScore(row["score"]) +
        "</td></tr>";
    });
    $("#table-tbody").text("");
    $("#table-tbody").append(tbody);

    if (data["players"].length < fetchedPlayers.length) {
      setTimeout(getResults, 1000);
    }
  });
};

const parseScore = function(score) {
  if (score == INF) return "--:--";
  const sec_str = zeroPadding(Math.floor(score / 100), 2);
  const ms_str = zeroPadding(score % 100, 2);
  return sec_str + ":" + ms_str;
};

const zeroPadding = function(num, length) {
  return ("0000000" + num).slice(-length);
};

const gaussian = function(mean, stdev) {
  var y2;
  var use_last = false;
  return () => {
    var y1;
    if (use_last) {
      y1 = y2;
      use_last = false;
    } else {
      var x1, x2, w;
      do {
        x1 = 2.0 * Math.random() - 1.0;
        x2 = 2.0 * Math.random() - 1.0;
        w = x1 * x1 + x2 * x2;
      } while (w >= 1.0);
      w = Math.sqrt((-2.0 * Math.log(w)) / w);
      y1 = x1 * w;
      y2 = x2 * w;
      use_last = true;
    }

    const val = mean + stdev * y1;
    return val >= 0 ? val : 0;
  };
};

const getRemainTime = function(endTime) {
  const nowTime = new Date();
  const diff = endTime - nowTime;
  const times = 24 * 60 * 60 * 1000;
  const sec = (Math.floor((diff % times) / 1000) % 60) % 60;
  const ms = Math.floor((diff % times) / 10) % 100;
  return { time: diff, sec: sec, ms: ms };
};
