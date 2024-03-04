var socket = io();
var first_point = "";
var arrival = "";
var time_today = "";
var exception_user = ["M-NAT", "Charles", "PDFB-001", "PDFB-002", "PDFB-003", "M-FEL","M-RMI"];
var no_display = ["M-CL", "M-NA", "M-TF", "M-SAF"];
var waiting = document.getElementById("waiting");
//When work start 
function senddata1(cu) {
  waiting.style.display = "block";
  a.style.opacity = 0.2;
  l.style.opacity = 0.2;
  w.style.opacity = 0.2;
  info.style.opacity = 0.2;
  ch_heure.style.opacity = 0.2;
  var http = new XMLHttpRequest();
  http.open("POST", "/startwork", true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText == "error") {
        window.location = "/session_end";
      }
      else {
        var response = this.responseText.split(",");
        first_point = response[0];
        arrival = response[1];
        if (first_point == "retard") {
          latepage.style.display = "block";
          statpage.style.display = "none";
          document.getElementById("late").innerHTML = "Vous êtes en retard de " + arrival
        }
        else {
          socket.emit("actuel", "TRAVAILLER" + ',' + cu);
          socket.emit("loc", document.getElementById("locaux").value);
          if (parseInt(document.getElementById("hour").value) == 10) {
            time_today = "Commencer à " + first_point + " => " + "Devrait partir à " + moment(first_point, "HH:mm").add(parseInt(document.getElementById("hour").value) + 1, "hours").format("HH:mm");
          }
          else {
            time_today = "Commencer à " + first_point + " => " + "Devrait partir à " + moment(first_point, "HH:mm").add(parseInt(document.getElementById("hour").value), "hours").format("HH:mm");
          }

          if (exception_user.includes(cu) || no_display.includes(cu)) {
            info.innerHTML = "Votre heure d'entrée habituel : " + arrival + "<br>Lieu de travail : " + chloc.value + " " + hour_today.value + " heures";
          }
          else {
            info.innerHTML = "Votre heure d'entrée aujourd'hui : " + arrival + "<br>Lieu de travail : " + chloc.value + " " + hour_today.value + " heures <br>" + time_today;
          }
        }


      }
      waiting.style.display = "none";
      a.style.opacity = 1;
      l.style.opacity = 1;
      w.style.opacity = 1;
      info.style.opacity = 1;
      ch_heure.style.opacity = 1;
      localStorage.removeItem('clocking');
    }
  };
  http.send("locaux=" + document.getElementById("locaux").value + "&timework=" + document.getElementById("hour").value);
}
//When work finished 
function senddata2(locauxverif, uc) {
  var http = new XMLHttpRequest();
  http.open("POST", "/leftwork", true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText == "error") {
        window.location = "/session_end";
      }
      else {
        socket.emit("actuel", "LEFTING" + ',' + uc);
        window.location = "/exit_u";
      }

    }
  };
  http.send("locaux=" + locauxverif);
}
//When change is choosed 
function senddata2_choice(locauxverif, choice) {
  var http = new XMLHttpRequest();
  http.open("POST", "/handlework", true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText == "error") {
        window.location = "/session_end";
      }
      else {
        window.location = "/";
      }

    }
  };
  http.send("locaux=" + locauxverif + "&choice=" + choice);
}
//When absent
function senddata3(activity) {
  var http = new XMLHttpRequest();
  http.open("POST", "/activity", true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText == "error") {
        window.location = "/session_end";
      }
      else {

      }

    }
  };
  http.send("activity=" + activity);
}
//When hour is changed 
function send_changing_hour(cu) {
  var http = new XMLHttpRequest();
  http.open("POST", "/changing", true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText == "error") {
        window.location = "/session_end";
      }
      else {
        hour_today.value = ch_heure.value;
        if (exception_user.includes(cu) || no_display.includes(cu)) {
          info.innerHTML = "Votre heure d'entrée habituel : " + this.responseText + "<br>Lieu de travail : " + chloc.value + " " + hour_today.value + " heures";
        }
        else {
          if (parseInt(document.getElementById("hour").value) == 10) {
            time_today = "Commencer à " + first_point + " => " + "Devrait partir à " + moment(first_point, "HH:mm").add(parseInt(document.getElementById("hour").value) + 1, "hours").format("HH:mm");
          }
          else {
            time_today = "Commencer à " + first_point + " => " + "Devrait partir à " + moment(first_point, "HH:mm").add(parseInt(document.getElementById("hour").value), "hours").format("HH:mm");
          }

          info.innerHTML = "Votre heure d'entrée aujourd'hui : " + this.responseText + "<br>Lieu de travail : " + chloc.value + " " + hour_today.value + " heures <br>" + time_today;
        }
        ch_heure.value = "";
      }

    }
  };
  http.send("ch_hour=" + ch_heure.value);
}
function sendstatus(loc, stat, uc) {
  var http = new XMLHttpRequest();
  http.open("POST", "/statuschange", true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText == "error") {
        window.location = "/session_end";
      }
      else {

        if (this.responseText.split(",")[0] == "DEJEUNER" || this.responseText.split(",")[0] == "PAUSE" || this.responseText.split(",")[0] == "BREAK") {
          socket.emit("actuel", a.value + ',' + uc); senddata3(a.value);
          var delay = "";
          switch (this.responseText.split(",")[0]) {
            case "DEJEUNER": delay = " <br> Revenez à " + moment(this.responseText.split(",")[1], "HH:mm").add(30, "minutes").format("HH:mm"); break;
            case "PAUSE": delay = " <br> Revenez à " + moment(this.responseText.split(",")[1], "HH:mm").add(15, "minutes").format("HH:mm"); break;
            case "BREAK": delay = " <br> Revenez quand vous allez mieux."; break;
          }
          info.innerHTML = "Vous avez pris votre " + this.responseText.split(",")[0].toLowerCase() + " à " + this.responseText.split(",")[1] + delay;
          if (this.responseText.split(",")[0] == "DEJEUNER") {
            title_break.textContent = "VOTRE HEURE DE PAUSE DEJEUNER SE TERMINE DANS"
            countdown = 30;
            contexte = "déjeuner";
            advice_for_you.textContent = getRandomString(lunch_advice)
            openModal();
          }
          else if (this.responseText.split(",")[0] == "PAUSE") {
            title_break.textContent = "VOTRE HEURE DE PAUSE SE TERMINE DANS"
            countdown = 15;
            contexte = "pause"
            advice_for_you.textContent = getRandomString(break_advice)
            openModal();
          }
        }
      }

    }
  };
  http.send("act_loc=" + loc + "&act_stat=" + stat);
}
//Sending meessage to me
function send_rem(m_code, rem) {
  var http = new XMLHttpRequest();
  http.open("POST", "/rem", true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      thanks();
    }
  };
  http.send("m_code=" + m_code + "&rem=" + rem);
}