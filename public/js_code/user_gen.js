//Add User
var add_email = document.getElementById("add_email");
var add_name = document.getElementById("add_nom");
var add_last_name = document.getElementById("add_prenom");
var add_usuel = document.getElementById("add_usuel");
var add_mcode = document.getElementById("add_mcode");
var add_num_agent = document.getElementById("add_num_agent");
var add_matricule = document.getElementById("add_matricule");
var add_function = document.getElementById("add_fonction");
var add_occupation = document.getElementById("add_occup");
var add_cin = document.getElementById("add_cin");
var add_sexe = document.getElementById("add_sexe");
var add_situation = document.getElementById("add_situation");
var add_adresse = document.getElementById("add_adresse");
var add_cnaps = document.getElementById("add_cnaps");
var add_class = document.getElementById("add_class");
var add_contrat = document.getElementById("add_contrat");
var add_date_fin = document.getElementById("add_date_fin");
var add_embauche = document.getElementById("add_embauche");
var btn_add = document.getElementById("btn_add");
var add_element = document.querySelectorAll(".add_user");
var del = "";
// New Code for userlist
var loading = document.getElementById("loading");
var content = document.getElementById("content");
var nothing = document.getElementById("nothing");
var users;
var rows = [];
var indice_row = 0;
var type_choice = document.getElementById("type");
var exclude = ["MANAGER", "RH", "IT", "English", "REPORTING OPERATIONNEL", "DEVELOPPEUR", "COURSIER", "TL"];
var admin_type = ["Admin", "Surveillant", "Opération"]
function get_all_employee(opt) {
  hideShowLoading(1)
  var http = new XMLHttpRequest();
  http.open("POST", "/list_employee", true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText == "error") {
        window.location = "/";
      }
      else {
        users = JSON.parse(this.responseText);
        initial_value(opt);
      }
    }
  };
  http.send();
}
get_all_employee("Actif");
function initial_value(option) {
  var count_row = 0;
  var temp_row = []
  for (i = 0; i < users.length; i++) {
    if ((users[i].status == option && users[i].occupation == "User") || ("Admin" == option && admin_type.includes(users[i].occupation))) {
      if (count_row < 5) {
        temp_row.push(users[i]);
        count_row++;
      }
      else {
        temp_row.push(users[i]);
        rows.push(temp_row);
        document.getElementById("row_number").innerHTML += `<div class="indicator mx-1" onmouseover="hover_navigation('${rows.length - 1}')"></div>`;
        count_row = 0;
        temp_row = [];
      }
    }

  }
  if (count_row != 0) {
    rows.push(temp_row);
    document.getElementById("row_number").innerHTML += `<div class="indicator mx-1" onmouseover="hover_navigation('${rows.length - 1}')"></div>`;
  }
  navigation("right");
  verify_navigation();
  activate_indication();
  hideShowLoading(2)
}
function activate_indication() {
  var all_indication = document.querySelectorAll(".indicator");
  for (i = 0; i < all_indication.length; i++) {
    if (i == indice_row) {
      all_indication[i].setAttribute("class", "indicator active mx-1");
    }
    else {
      all_indication[i].setAttribute("class", "indicator mx-1");
    }
  }
}

function verify_navigation() {

  if (indice_row == 0) {
    document.getElementById("previous").disabled = true;
  }
  else {
    document.getElementById("previous").disabled = false;
  }
  if (rows.length == indice_row) {
    document.getElementById("nextin").disabled = true;
  }
  else {
    document.getElementById("nextin").disabled = false;
  }
  activate_indication();
}
function hover_navigation(indice) {
  indice = parseInt(indice);
  if (indice < indice_row) {
    indice_row = indice + 1;
    prev();
  }
  else if (indice > indice_row) {
    indice_row = indice - 1;
    next();
  }
}
function next() {
  indice_row++;
  navigation("right");
  verify_navigation();
}
function prev() {
  indice_row--;
  navigation("left");
  verify_navigation();
}
function hideShowLoading(val) {
  if (val == 1) {
    loading.style.display = "block";
    content.style.display = "none";
    nothing.style.display = "none";
  }
  else if (val == 2) {
    loading.style.display = "none";
    content.style.display = "block";
    nothing.style.display = "none";
  }
  else {
    loading.style.display = "none";
    content.style.display = "none";
    nothing.style.display = "block";
  }
}
function searching() {
  rows = [];
  indice_row = 0;
  document.getElementById("row_number").innerHTML = "";
  var count_row = 0;
  var temp_row = [];
  var keywords = document.getElementById("searching").value.toLowerCase().trim();
  if (keywords == "") {
    initial_value(type_choice.value)
  }
  else {
    users.forEach(element => {
      var temp_data = [element.first_name, element.last_name, element.usuel, element.m_code, element.contrat, element.project];
      if ((element.status == type_choice.value && element.occupation == "User") || ("Admin" == type_choice.value && admin_type.includes(element.occupation))) {
        var find = false;
        temp_data.forEach(datas => {
          if (datas.toLowerCase().includes(keywords)) {
            find = true;
          }
        });
        if (find) {
          if (count_row < 5) {
            temp_row.push(element);
            count_row++;
          }
          else {
            temp_row.push(element);
            rows.push(temp_row);
            document.getElementById("row_number").innerHTML += `<div class="indicator mx-1" onmouseover="hover_navigation('${rows.length - 1}')"></div>`;
            count_row = 0;
            temp_row = [];
          }
        }
      }

    });
    if (count_row != 0) {
      rows.push(temp_row);
      document.getElementById("row_number").innerHTML += `<div class="indicator mx-1" onmouseover="hover_navigation('${rows.length - 1}')"></div>`;
    }
    if (rows.length != 0) {
      navigation("right");
      verify_navigation();
      activate_indication();
      hideShowLoading(2);
    }
    else {
      hideShowLoading(0);
    }

  }
}
function navigation(opt) {
  var elem = `
      <div class="row container-employee-${opt}">
        ${put_element(rows[indice_row], type_choice.value)}
        </div>
      `
  document.getElementById("content").innerHTML = elem;
}
function put_element(rows_user, option) {
  var content_elem = "";
  if (rows_user) {
    rows_user.forEach(el => {
      content_elem += `
          <div class="col-md-4  mb-3">
                      <div class="row hovered">
                        <div class="col-md-6 text-center" >
                          <img class="img_contain"
                      src="Profil/${el.profil}" id="my_profil"  alt="IMG">
                      <p class="title-text mt-3"><i class="fa-solid fa-computer"></i> ${project(el.project, el.occupation)} </p>
                        </div>
                        <div class="col-md-6">
                            <p class="title-text">${el.first_name} ${el.last_name}</p>
                            <div class="info-text">
                            <p class="info-text"><i class="fa-solid fa-star mx-3"></i>CODE: ${el.m_code}</p>
                            <p class="info-text"><i class="fa-solid fa-list-ol mx-3"></i></i>NUMERO: ${el.num_agent}</p>
                            <p class="info-text"> <i class="fa-solid fa-file-signature mx-3"></i>CONTRAT : ${el.contrat}</p>
                            </div>
                            <div class="text-center">
                              ${button_render(option, el._id, el.first_name, el.last_name, el.m_code)}
                            </div>
                        </div>
                      </div>
                    </div>
          `
    });
  }
  else {
    hideShowLoading(0)
  }

  function project(pr, occ) {
    if (exclude.includes(pr)) {
      if (pr == "RH") {
        return "RESSOURCES HUMAINES"
      }
      else {
        return pr;
      }
    }
    else {
      if (admin_type.includes(occ)) {
        return "ADMIN"
      }
      else {
        return "AGENT"
      }
    }
  }
  return content_elem;
}
function button_render(opt, id, first, last, code) {
  var btn;
  switch (opt) {
    case "Actif": btn = `<button class="btn btn-primary btn-sm mb-3 info-text mx-2" onclick="getdata('getuser','${id}')"><i class="fa-solid fa-user-pen"></i> DETAILS</button>
                              <button class="btn btn-danger btn-sm info-text mb-3" onclick="delete_user('dropuser','${id}','${code}')"><i class="fa-solid fa-xmark"></i> ARCHIVER</button>`; break;
    case "Quitter": btn = `<button class="btn btn-primary btn-sm mb-3 info-text mx-2" onclick="getdata('getuser','${id}')"><i class="fa-solid fa-user-pen"></i> DETAILS</button>
                              <button class="btn btn-info btn-sm info-text mb-3" onclick="delete_user('reactivate','${id}','${code}')"><i class="fa-solid fa-xmark"></i>ACTIVER</button>`; break;
    default: btn = `<button class="btn btn-danger btn-sm info-text mb-3" onclick="delete_user('dropuser','${id}','${first} ${last}')"><i class="fa-solid fa-xmark"></i> SUPPRIMER</button>`; break;
  }
  return btn;
}
function refresh(opt) {
  var last_indice = indice_row;
  var length = rows[last_indice].length;
  rows = [];
  indice_row = 0;
  document.getElementById("row_number").innerHTML = "";
  get_all_employee(opt);
  if (length == 1 && rows.length < last_indice) {
    indice_row = last_indice;
    hover_navigation(last_indice - 1);
  }
  else if (length == 6 && last_indice < rows.length) {
    indice_row = last_indice;
    hover_navigation(last_indice + 1);
  }
  else {
    indice_row = last_indice;
    hover_navigation(last_indice);
  }

}
function set_index(actual) {
  switch (actual) {
    case "Actif": type_choice.selectedIndex = "0"; break;
    case "Quitter": type_choice.selectedIndex = "1"; break;
    case "Admin": type_choice.selectedIndex = "2"; break;
  }
}

//End new code
function verify_add_input() {
  var deactivate = 0;
  for (ae = 0; ae < add_element.length; ae++) {
    if (add_element[ae].value == "") {
      deactivate++;
      add_element[ae].style = "border-color:red";
    }
    else {
      add_element[ae].style = "";
    }
  }
  if (deactivate != 0) {
    btn_add.disabled = true;
  }
  else {
    btn_add.disabled = false;
  }
}
function typing(opt) {
  if (opt == "n") {
    document.getElementById("new_name").innerHTML = document.getElementById("add_nom").value + " " + document.getElementById("add_prenom").value;
  }
  else {
    document.getElementById("updated_name").innerHTML = document.getElementById("up_nom").value + " " + document.getElementById("up_prenom").value;
  }

}
function enregistrer() {
  sendRequest("/addemp",
    add_email.value,
    add_name.value,
    add_last_name.value,
    add_usuel.value,
    add_mcode.value,
    add_num_agent.value,
    add_matricule.value,
    add_function.value,
    add_occupation.value,
    add_embauche.value,
    add_cin.value,
    add_sexe.value,
    add_situation.value,
    add_adresse.value,
    add_cnaps.value,
    add_class.value,
    add_contrat.value,
    add_date_fin.value
  )
}
function default_valueadd() {
  if (add_occupation.value != "User") {
    add_mcode.value = "N/A";
    add_num_agent.value = "N/A"
    add_matricule.value = "N/A"
    add_function.value = "N/A"
    let today = new Date();
    let day = today.getDate().toString().padStart(2, '0');
    let month = (today.getMonth() + 1).toString().padStart(2, '0');
    let year = today.getFullYear().toString();

    let formattedDate = `${year}-${month}-${day}`;
    add_embauche.value = formattedDate
    add_cin.value = "N/A"
    add_sexe.value = ""
    add_function.value = "MANAGER"
    add_situation.value = "N/A"
    add_adresse.value = "N/A"
    add_cnaps.value = "N/A"
    add_class.value = "N/A"
    add_contrat.value = "CDI"
    btn_add.disabled = false;
  }

}
function sendRequest(url, email, nom, prenom, usuel, mcode, num_agent, matricule, fonction, occ, embauche, cin, sexe, situation, adresse, cnapsnum, classify, contrat, date_fin) {
  var http = new XMLHttpRequest();
  http.open("POST", url, true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      var response = this.responseText.split(",");
      if (response[0].includes("already")) {
        document.getElementById("notif").setAttribute("style", "background-color:red");
        showNotif("Utilisateur déja enregistrés avec le même M-code/numéro agent/matricule");
      }
      else if (response[0] == "error") {
        showNotif("Une erreur s'est produite dans le serveur, reesayez ou contacter un technicien");
      }
      else {
        document.getElementById("notif").setAttribute("style", "background-color:limeagreen");
        showNotif("Utilisateur " + response[0] + " enregistré");
        if (response[1] == "User") {
          set_index(type_choice.value)
          refresh(type_choice.value);
        }
        else {
          set_index(type_choice.value)
          refresh(type_choice.value);
        }
      }
    }
  };
  http.send("email=" + email +
    "&name=" + nom +
    "&last_name=" + prenom
    + "&usuel=" + usuel +
    "&mcode=" + mcode +
    "&num_agent=" + num_agent +
    "&matricule=" + matricule +
    "&function_choosed=" + fonction +
    "&occupation=" + occ +
    "&enter_date=" + embauche +
    "&cin=" + cin +
    "&gender=" + sexe +
    "&situation=" + situation +
    "&location=" + adresse +
    "&num_cnaps=" + cnapsnum +
    "&classification=" + classify +
    "&contrat=" + contrat +
    "&datefin=" + date_fin);
}

//Updating _user
var up_email = document.getElementById("up_email");
var up_name = document.getElementById("up_nom");
var up_last_name = document.getElementById("up_prenom");
var up_usuel = document.getElementById("up_usuel");
var up_mcode = document.getElementById("up_mcode");
var up_num_agent = document.getElementById("up_num_agent");
var up_matricule = document.getElementById("up_matricule");
var up_function = document.getElementById("up_fonction");
var up_occupation = document.getElementById("up_occup");
var up_cin = document.getElementById("up_cin");
var up_sexe = document.getElementById("up_sexe");
var up_situation = document.getElementById("up_situation");
var up_adresse = document.getElementById("up_adresse");
var up_cnaps = document.getElementById("up_cnaps");
var up_class = document.getElementById("up_class");
var up_contrat = document.getElementById("up_contrat");
var up_date_fin = document.getElementById("up_date_fin");
var up_embauche = document.getElementById("up_embauche");
var btn_up = document.getElementById("btn_up");
var up_element = document.querySelectorAll(".up_user");

var all_id = ["up_email", "up_nom", "up_prenom", "up_usuel", "up_mcode", "up_num_agent", "up_matricule", "up_fonction", "up_occup", "up_embauche", "up_cin",
  "up_sexe", "up_situation", "up_adresse", "up_cnaps", "up_class", "up_contrat"];
var select_field = ["up_fonction", "up_occup", "up_sexe", "up_situation"];
var ids = "";
var url_action = "";
function default_valueup() {
  if (up_occupation.value != "User") {
    all_id.forEach(element => {
      if (element == "up_email" || element == "up_nom" || element == "up_prenom" || element == "up_usuel" || element == "up_embauche") {

      }
      else {
        document.getElementById(element).value = "N/A";
      }
    });
    let today = new Date();
    let day = today.getDate().toString().padStart(2, '0');
    let month = (today.getMonth() + 1).toString().padStart(2, '0');
    let year = today.getFullYear().toString();

    let formattedDate = `${year}-${month}-${day}`;
    up_embauche.value = formattedDate;
  }

}
function verify_up_input() {
  var deactivate = 0;
  for (up = 0; up < up_element.length; up++) {
    if (up_element[up].value == "") {
      deactivate++;
      up_element[up].style = "border-color:red";
    }
    else {
      up_element[up].style = "";
    }
  }
  if (deactivate != 0) {
    btn_up.disabled = true;
  }
  else {
    btn_up.disabled = false;
  }
}
function change_identifiant() {
  up_mcode.value = "N/A";
  up_num_agent.value = "N/A";
  up_matricule.value = "N/A";
}
function getdata(url, id) {
  document.getElementById("editing").click();
  var http = new XMLHttpRequest();
  http.open("POST", "/" + url, true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      var data = this.responseText.split(",");
      for (put = 0; put < data.length - 4; put++) {
        if (select_field.includes(all_id[put])) {
          document.getElementById(all_id[put]).value = data[put];
        }
        else {
          document.getElementById(all_id[put]).value = data[put];
        }
      }
      if (data[data.length - 4]) {
        document.getElementById("up_date_fin").value = data[data.length - 4];
      }
      typing("u");
      document.getElementById("my_profil").setAttribute("src", "Profil/" + data[data.length - 3]);
      document.getElementById("project_user").innerHTML = data[data.length - 2];
      document.getElementById("time_passed").innerHTML = anciennity(data[9], data[data.length - 4]);
      document.getElementById("phone").value = data[data.length - 1]
      ids = id;
    }
  };
  http.send("id=" + id);
}
function anciennity(begin, end) {
  if (end != "") {
    return `Membre depuis ${time_passed(begin)} (Fin contrat ${end})`;
  }
  else {
    return `Membre depuis ${time_passed(begin)}`;
  }
}
function time_passed(starting) {
  var startings = moment(starting).format("YYYY-MM-DD");
  var nows = moment(moment().format("YYYY-MM-DD"), "YYYY-MM-DD");
  var duration = moment.duration(nows.diff(startings));
  var years = duration.years();
  var months = duration.months();
  var days = duration.days();
  while (days > 30) {
    days = days - 30
  }
  var tp = "";
  if (years != 0) {
    tp += years + " an(s) ";
  }
  if (months != 0) {
    tp += months + " mois ";
  }
  tp += days + " jour(s)"
  return tp;
}

function modifier() {
  update_user("/updateuser"
    , ids,
    up_email.value,
    up_name.value,
    up_last_name.value,
    up_usuel.value,
    up_mcode.value,
    up_num_agent.value,
    up_matricule.value,
    up_function.value,
    up_occupation.value,
    up_embauche.value,
    up_cin.value,
    up_sexe.value,
    up_situation.value,
    up_adresse.value,
    up_cnaps.value,
    up_class.value,
    up_contrat.value,
    up_date_fin.value
  );
}
function update_user(url, id, email, nom, prenom, usuel, mcode, num_agent, matricule, fonction, occ, embauche, cin, sexe, situation, adresse, cnapsnum, classify, contrat, date_fin) {
  var http = new XMLHttpRequest();
  http.open("POST", url, true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText.includes("already")) {
        document.getElementById("notif").setAttribute("style", "background-color:red");
        showNotif("L'utilisateur existe déja  (m-code/numbering agent/matricule)");
      }
      else if (this.responseText == "error") {
        showNotif("Erreur dans le modification");
      }
      else {
        document.getElementById("notif").setAttribute("style", "background-color:limeagreen");
        showNotif("La modification s'est fait avec succés");
      }
    }
  };
  http.send("id=" + id +
    "&email=" + email +
    "&name=" + nom +
    "&last_name=" + prenom
    + "&usuel=" + usuel +
    "&mcode=" + mcode +
    "&num_agent=" + num_agent +
    "&matricule=" + matricule +
    "&function_choosed=" + fonction +
    "&occupation=" + occ +
    "&enter_date=" + embauche +
    "&cin=" + cin +
    "&gender=" + sexe +
    "&situation=" + situation +
    "&location=" + adresse +
    "&num_cnaps=" + cnapsnum +
    "&classification=" + classify +
    "&contrat=" + contrat +
    "&datefin=" + date_fin);
}
function showNotif(text) {
  const notif = document.querySelector('.notification');
  notif.innerHTML = text;
  notif.style.display = 'block';
  setTimeout(() => {
    notif.style.display = 'none';
  }, 5000);
}

function delete_user(url, user, name) {
  url_action = "/" + url;
  if (url == "dropuser") {
    textwarn.innerHTML = "Vous êtes sur d'archiver l'utilisateur <b>" + name + "</b>";
  }
  else {
    textwarn.innerHTML = "Vous êtes sur de réintegré l'utilisateur <b>" + name + "</b>";
  }
  textwarn.setAttribute("style", "color:aliceblue");
  document.getElementById("deleting").click();
  del = user;
}
function confirm_del() {
  drop_user(url_action, del);
}
function drop_user(url, fname) {
  var http = new XMLHttpRequest();
  http.open("POST", url, true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText == "error") {
        window.location = "/";
      }
      else {
        showNotif(this.responseText);
        set_index(type_choice.value)
        refresh(type_choice.value);
      }
    }
  };
  http.send("fname=" + fname);
}
