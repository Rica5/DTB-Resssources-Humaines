var Items = [];
var loading_all = document.getElementById("loading_all");
var loading_single = document.getElementById("loading_single");
var valide_all = document.getElementById("valide_all");
var denie_all = document.getElementById("denie_all");
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
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const search = urlParams.get('search');
//listener filter
setTimeout(() => {
  filter = document.querySelector("input[type='search']");
  var table = $('#zero_config').DataTable();
  if (search != null) {
    table.search(search).draw();
  }

}, 1000)
function sendRequest_true(url, id) {
  var http = new XMLHttpRequest();
  http.open("POST", url, true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText != "retour") {
        document.getElementById(id).remove();
        document.getElementById("notif").setAttribute("style", "background-color:green");
        showNotif(this.responseText);
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
        document.getElementById(id).remove();
        document.getElementById("notif").setAttribute("style", "background-color:green");
        showNotif(this.responseText);
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
        document.getElementById(id).remove();
        document.getElementById("notif").setAttribute("style", "background-color:green");
        showNotif(this.responseText);
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
  }, 1000);
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
  }
  else {
    valide_all.disabled = true;
    denie_all.disabled = true;
  }
}
function remove_selectedElements(url) {
  loading_all.style.display = "block";
  valide_all.style.display = "none";
  denie_all.style.display = "none";
  var http = new XMLHttpRequest();
  http.open("POST", url, true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText != "retour") {
        document.getElementById("notif").setAttribute("style", "background-color:green");
        showNotif(this.responseText);
        Items.forEach(item => {
          document.getElementById(item).remove();
        });
        loading_all.style.display = "none";
        valide_all.disabled = true;
        denie_all.disabled = true;
        valide_all.style.display = "block";
        denie_all.style.display = "block";
      }
    }
  };
  http.send("items=" + Items);
}