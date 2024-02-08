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
            advice_for_you.textContent = getRandomString(lunch_advice)
            openModal();
          }
          else if (this.responseText.split(",")[0] == "PAUSE") {
            title_break.textContent = "VOTRE HEURE DE PAUSE SE TERMINE DANS"
            countdown = 15;
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
var profil_input = document.getElementById("file-upload")
function profil_click() {
  profil_input.click();
}
var imageUrl = "";

// (function () {
//   function Init() {
//     var fileSelect = document.getElementById('file-upload');
//     fileSelect.addEventListener('change', fileSelectHandler, false);

//   }

//   function fileSelectHandler(e) {
//     // Fetch FileList object
//     var files = e.target.files || e.dataTransfer.files;

//     // Process all File objects
//     for (var i = 0, f; f = files[i]; i++) {
//       resizeImage(f, 640 * 480, function (blob) {

//         // Do something with the resized image blob.
//         imageUrl = URL.createObjectURL(blob);
//         uploadFile(blob, files[0].name);
//       });

//     }
//   }
//   function resizeImage(file, maxSize, callback) {
//     const reader = new FileReader();
//     reader.onload = function () {
//       const image = new Image();
//       image.onload = function () {
//         const canvas = document.createElement('canvas');
//         const ctx = canvas.getContext('2d');
//         let width = image.width;
//         let height = image.height;
//         let scale = 1;

//         // Scale the image down to fit within the maximum file size.
//         while ((width * height * scale * scale) > maxSize) {
//           scale -= 0.1;
//         }

//         // Resize the image using the canvas element.
//         canvas.width = width * scale;
//         canvas.height = height * scale;
//         ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

//         // Convert the canvas back to a Blob and pass it to the callback function.
//         canvas.toBlob(function (blob) {
//           callback(blob);
//         }, file.type, 0.8);
//       }
//       image.src = reader.result;
//     }
//     reader.readAsDataURL(file);
//   }



//   function uploadFile(file, name) {

//     var xhr = new XMLHttpRequest();

//     // File received / failed
//     xhr.onreadystatechange = function (e) {
//       if (xhr.readyState == 4) {
//         if (xhr.responseText == "Ok") {
//           document.getElementById("my_profil").setAttribute("src", imageUrl);
//           document.getElementById("profil_status").style.display = "block";
//           document.getElementById("profil_status").setAttribute("class", "alert alert-success")
//           document.getElementById("profil_status").textContent = "Profil changé avec succés";
//           setTimeout(() => {
//             document.getElementById("profil_status").style.display = "none";
//           }, 3000);
//         }
//         else {
//           document.getElementById("profil_status").setAttribute("class", "alert alert-danger")
//           document.getElementById("profil_status").style.display = "block";
//           document.getElementById("profil_status").textContent = "Erreur, veuillez entrer un image valide";
//           setTimeout(() => {
//             document.getElementById("profil_status").style.display = "none";
//           }, 3000);
//         }

//       }
//     };

//     // Start upload
//     xhr.open('POST', "profil", true);
//     var filedata = new FormData();
//     filedata.append("fileup", file);
//     filedata.append("names", name);
//     xhr.send(filedata);
//   }

//   // Check for the various File API support.
//   if (window.File && window.FileList && window.FileReader) {
//     Init();
//   } else {

//   }
// })();