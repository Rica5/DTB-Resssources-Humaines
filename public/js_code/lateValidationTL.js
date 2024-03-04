var Items = [];
var loading_all = document.getElementById("loading_all");
var loading_single = document.getElementById("loading_single");
var valide_all = document.getElementById("valide_all");
var denie_all = document.getElementById("denie_all");
var exception_all = document.getElementById("exception_all");
//Valide if true
function validate_true(validate) {
  sendRequest_true('/validate', validate);
}
//Denied if false
function validate_false(ids) {
  sendRequest_false('/denied', ids);
}
function reinitialise(exc_id) {
  sendRequest_exception("/exception", exc_id)
}
function sendRequest_true(url, id) {
  var http = new XMLHttpRequest();
  http.open("POST", url, true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText != "retour") {
        document.getElementById("notif").setAttribute("style", "background-color:green");
        reloading("Demande traiter avec succès");
      }

    }
  };
  http.send("id=" + id);
}
function sendRequest_exception(url, id) {
  var http = new XMLHttpRequest();
  http.open("POST", url, true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText != "retour") {
        document.getElementById("notif").setAttribute("style", "background-color:green");
        reloading("Demande traiter avec succès");
      }

    }
  };
  http.send("id=" + id);
}
function sendRequest_false(url, id) {

  var http = new XMLHttpRequest();
  http.open("POST", url, true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText != "retour") {
        document.getElementById("notif").setAttribute("style", "background-color:green");
        reloading("Demande traiter avec succès");
      }
    }
  };
  http.send("id=" + id);
}

function showNotif(text) {
  const notif = document.querySelector('.notification');
  notif.innerHTML = text;
  notif.style.display = 'block';
  setTimeout(() => {
    notif.style.display = 'none';
  }, 5000);
}
function get_selectedItems() {
  Items = [];

  var all_items = document.querySelectorAll(".checking");
  all_items.forEach(box => {
    if (box.checked) {
      Items.push(box.value);
    }
  });
  if (Items.length != 0) {
    valide_all.disabled = false;
    denie_all.disabled = false;
    exception_all.disabled = false;
  }
  else {
    exception_all.disabled = true;
    valide_all.disabled = true;
    denie_all.disabled = true;
  }
}
function remove_selectedElements(url) {
  loading_all.style.display = "block";
  valide_all.style.display = "none";
  denie_all.style.display = "none";
  exception_all.style.display = "none";
  var http = new XMLHttpRequest();
  http.open("POST", url, true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText != "retour") {
        document.getElementById("notif").setAttribute("style", "background-color:green");
        reloading("Demande traiter avec succès");
        loading_all.style.display = "none";
        valide_all.disabled = true;
        denie_all.disabled = true;
        exception_all.disabled = true;
        exception_all.style.display = "block";
        valide_all.style.display = "block";
        denie_all.style.display = "block";
      }
    }
  };
  http.send("items=" + Items);
}
function reloading(notif) {
  var http = new XMLHttpRequest();
  http.open("POST", "/lates", true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText != "retour") {
        reload_table(this.responseText)
        showNotif(notif);
      }

    }
  };
  http.send();
}
var table = $('#zero_config').DataTable(); // Replace 'yourDataTable' with the actual ID of your DataTable
function reload_table(data) {
  data = JSON.parse(data);
  var newData = []; // Array to hold the new data for DataTable
  var options = ["Annuler", "Confirmer", "Exception"]
  // Assuming the server returns data as an array of objects with three properties: col1, col2, col3
  for (var i = 0; i < data.length; i++) {
    var reason = data[i].late_entry.split(" ");
    if (options.includes(reason[reason.length - 1]) === false) {
      newData.push([render_id(data[i]._id), data[i].m_code, convert_date(data[i].date), data[i].locaux, data[i].entry, data[i].time_start, data[i].late_entry, render_action(data[i]._id)])
    }
    // Push each row to newData array
  }
  table.clear().rows.add(newData).draw(); // Set the new HTML content with three columns and redraw the DataTable

}
function convert_date(date) {
  return moment(date).format("DD/MM/YYYY");
}
function render_id(id) {
  return `<input type="checkbox" class="checking" value="${id}" onchange="get_selectedItems()">`
}
function render_action(id) {
  return `
    <div class="row" style="width: 450px;">
                                <img id="loading_single" src="assets/images1/loading.gif" style="width: 40%;height: 40%;display: none;" alt="loading">
                                <div class="col-sm-4 text-left ${id}">
                                  <button type="button" class="btn btn-success btn-circle btn-sm"
                                    onclick="validate_true('${id}')"><i class="fas fa-check"></i> confirmer</button>
                                </div>
                                <div class="col-sm-4 text-left ${id}">
                                  <button type="button" class="btn btn-primary btn-circle btn-sm"
                                    onclick="reinitialise('${id}')"><i class="fas fa-times-circle"></i> exception</button>
                                </div>
                                <div class="col-sm-4 text-right ${id}">
                                  <button type="button" class="btn btn-danger btn-circle btn-sm text-right"
                                    onclick='validate_false("${id}")'><i class="fas fa-ban"></i> annuler</button></a>
                                </div>
                              </div>
    `
}
reloading("Les retards a valider sont prêts");