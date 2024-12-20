var leaves;
var users;
var userActive;
var content = ""
var classes = ["header-standby", "header-standby", "header-standby"];
var row_activated = "en cours";
var indice_row = 0;
var month_value = "";
var year = document.getElementById("annuel");
year.value = moment().format("YYYY");
var rows = [];
var navigation_point;
var search_div;
var search_text = "";
var search_nom = ""
var type_conge = "";
var nothing = "none";
var behavior = "left";
var loading = document.getElementById("loading");
var download = document.getElementById("download");
var getfile = document.getElementById("getfile");
var waiting = document.getElementById("waiting");
var waiting_edit = document.getElementById("waiting_edit");
var waiting_delete = document.getElementById("waiting_delete");
download.disabled = true;
var onFile = "";
var year_month = document.getElementById("year_month");
var container_conge = document.getElementById("container_conge");
var active_month = ["TOUT", "JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"];
function get_all_leave() {
  var http = new XMLHttpRequest();
  http.open("POST", "/list_leave", true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText == "error") {
        window.location = "/";
      }
      else {
        var data = JSON.parse(this.responseText);
        leaves = data[0];
        users = data[1];
        
        // console.log("data", data);
        

        // change_content(row_activated);
        change_content();

      }
    }
  };
  http.send();
}
function change_content() {//val
  content = "";
  rows = [];
  navigation_point = "";
  content += rendu_header();//val
  content += `<div  class="row container-list-${behavior}" >`
  content += empty_search();
  rendu_body();//val
  if (rows.length > 0) {
    nothing = "none";
    rows[indice_row].forEach(element => {
      content += element
    });
  }
  else {
    nothing = "block"
  }
  content += rendu_footer();
  container_conge.innerHTML = content;
  document.getElementById("search_div").style.display = search_div;
  document.getElementById("searching").value = search_text;
  document.getElementById("searchingNom").value = search_nom
  document.getElementById("type").value = type_conge;
  document.getElementById("nothing").style.display = nothing;
  verify_navigation();
  hideShowElement("block");
  loading.style.display = "none";
}
get_all_leave();
function rendu_header() { //active
  classes = ["header-standby", "header-standby", "header-standby"];
  // switch (active) {
  //   case "en cours": classes[0] = "header-active"; reset(); break;
  //   case "en attente": classes[1] = "header-active"; search_div = "block"; year_month.setAttribute("class", "col-md-2 text-center book"); break;
  //   case "Terminée": classes[2] = "header-active"; search_div = "block"; year_month.setAttribute("class", "col-md-2 text-center book"); break;
  // }
  return `
    <div class="text-center d-flex justify-content-center align-items-center mb-3" >
    <div onclick="active_row('en cours')" class="text-center mx-1 ${classes[0]}"hidden>
      EN COURS
    </div>
    <div onclick="active_row('en attente')" class="text-center mx-1 ${classes[1]}" hidden>
      EN ATTENTE
    </div>
    <div onclick="active_row('Terminée')" class="text-center mx-1 ${classes[2]}" hidden >
      TERMINER
    </div>
    <div>
    <select class="sheet-choice2 mx-2" id="type" onchange="set_type()">
      <option value="">Tout type</option>
      <option value="Congé Payé">Congé Payé</option>
      <option value="Congé sans solde">Congé sans solde</option>
      <option value="Permission exceptionelle">Permission exceptionelle</option>
      <option value="Repos Maladie">Repos Maladie</option>
      <option value="Consultation médicale">Consultation médicale</option>
      <option value="Assistance maternelle">Assistance maternelle</option>
      <option value="Absent">Absent ou retart</option>
      <option value="Congé de maternité">Congé de maternité</option>
      <option value="Mise a Pied">Mise à pied</option>
      <option value="Récupération">Récupération</option>
    </select>
    </div>
    <div>
      <input id="searchingNom" class="input-choice2 mx-2" onkeyup="set_text()" type="text" placeholder="Prénom ici..." >
    </div>
    <div id="search_div">
      <input id="searching" class="input-choice2 mx-2" onkeyup="set_text()" type="text" placeholder="M-CODE ici..." >
      <button onclick="searching()"  class="btn-circle btn-md btn-primary text-white">
        <i class="fas fa-search"></i>
      </button>
    </div>
  </div>
    `
}
function empty_search() {
  return `<div id="nothing" style="display:none;" class="loading"  >
  <i class="fa-regular fa-folder-open fa-shake" style="font-size:35px"></i>
  <span class=" ms-3" style="font-size:35px">
    <!-- dark Logo text -->
    <b>AUCUN CONGE CORRESPONDANT AUX CRITERES</b>
  </span>
</div>
<div id="maj" class="loading" style="display: none;"  >
                        <i class="fa-solid fa-rotate fa-spin" style="font-size:35px"></i>
                        <span class=" ms-3" style="font-size:35px">
                          <!-- dark Logo text -->
                          <b>MISE A JOUR DES DONNEES ...</b>
                          <p class="info-text text-center">La mise a jour peut être plus long, veuillez patienter</p>
                        </span>
                      </div>`
}
function reset() {
  search_div = "block"//"none";
  year_month.setAttribute("class", "col-md-2 text-center disabled");
  year.value = moment().format("YYYY")
}

function beauty(str) {
  if (str === 'Absent ( a déduire sur salaire )')
    return "Absent ou retard ( à déduire sur salaire)";
  
}

function rendu_conge(temp_conge) {
  return `<div class="col-md-6 leavelist  mb-3">
                                <div class="row hovered">
                                  <div class="col-sm-6 text-center person" >
                                    <img class="img_contain"
                                src="Profil/${retrieve_profil(temp_conge.m_code)}" id="my_profil"  alt="IMG">
                                <p class="title-text mt-3"><i class="fa-solid fa-star"></i>${temp_conge.m_code}</p>
                                  </div>
                                  <div class="col-sm-6">
                                      <p class="title-text" style="text-transform: uppercase !important; font-weight: 600">${temp_conge.type === "Absent ( a déduire sur salaire )" ? "Absent ou retard ( à déduire sur salaire)": temp_conge.type}</p>
                                      <div class="info-text">
                                      <p class="info-text"><i class="fa-solid fa-calendar mx-3"></i> Début: ${temp_conge.duration == 0.25 ? date_conversion(temp_conge.date_start) + " à " + temp_conge.hour_begin : date_conversion(temp_conge.date_start)}</p>
                                      <p class="info-text"><i class="fa-solid fa-calendar mx-3"></i> Fin : ${temp_conge.duration == 0.25 ? date_conversion(temp_conge.date_end) + " à " + temp_conge.hour_end : date_conversion(temp_conge.date_end)}</p>
                                      ${give_motif(temp_conge.motif)}
                                      <p class="info-text text-center">Durée : ${temp_conge.duration == 0.25 ? calcul_timediff_absencetl(temp_conge.hour_begin, temp_conge.hour_end) : temp_conge.duration.toString().replace(".",",") + " jour(s)"}
                                        | 2024: ${(temp_conge.acc - temp_conge.rest).toString().replace(".",",")} | 2023: ${itCount(temp_conge.type) ? (temp_conge.rest /* - temp_conge.duration */).toString().replace(".",",") :  temp_conge.rest.toString().replace(".",",")} |</p>
                                      <p class="info-text text-center">Reste aprés autorisation | ${(temp_conge.acc.toString().replace(".",","))}</p>
                                      </div>
                                      <div class="checkbox-group decision">
                                        ${temp_conge.conge_payer !== 0 ? `<p class="text-center">A déduire s/ congés payés : ${temp_conge.conge_payer} jours</p>` : ''}
                                        ${temp_conge.deduire_sur_salaire !== 0 ? `<p>A déduire s/ salaire : ${temp_conge.deduire_sur_salaire} jours</p>` : ''}
                                        ${temp_conge.permission_exceptionnelle !== 0 ? `<p>Permission exceptionnelle : ${temp_conge.permission_exceptionnelle} jours</p>` : ''}
                                        ${temp_conge.rien_a_deduire !== 0 ? `<p>Rien à déduire : ${temp_conge.rien_a_deduire} jours</p>` : ''}
                                      </div>
                                      <div class="text-center">
                                        ${render_button(temp_conge)}
                                      </div>
                                  </div>
                                </div>
                              </div>`
}
function itCount(theType){
  if (theType.includes("Congé Payé")){
      return true
  }
  else {
      return false
  }
}
function calcul_timediff_absencetl_old(startTime, endTime) {
  if (startTime != "") {
    startTime = moment(startTime, "HH:mm:ss a");
    endTime = moment(endTime, "HH:mm:ss a");
    var duration = moment.duration(endTime.diff(startTime));
    //duration in hours
    var hours_fictif = 0;
    var minutes_fictif = 0;
    hours_fictif += parseInt(duration.asHours());

    // duration in minutes
    minutes_fictif += parseInt(duration.asMinutes()) % 60;
    if (minutes_fictif < 0) {
      hours_fictif = hours_fictif - 1;
      minutes_fictif = 60 + minutes_fictif;
    }
    while (minutes_fictif > 60) {
      hours_fictif += 1;
      minutes_fictif = minutes_fictif - 60;
    }
    if (hours_fictif < 0) {
      hours_fictif = hours_fictif + 24;
    }
    if (hours_fictif == 0) {
      return minutes_fictif + " minutes";
    }
    else if (minutes_fictif == 0) {
      return hours_fictif + " heures";
    }
    else {
      return hours_fictif + " heures " + minutes_fictif + " mn";
    }
  }
  else {
    return "heure non défini"
  }
}

function calcul_timediff_absencetl(startTime, endTime) {
  if (startTime != "") {
    startTime = moment(startTime, "HH:mm:ss a");
    endTime = moment(endTime, "HH:mm:ss a");
    
    // Calculate the duration between the two times
    var duration = moment.duration(endTime.diff(startTime));
    
    // Get the duration in hours and minutes separately
    var hours_fictif = parseInt(duration.asHours());
    var minutes_fictif = parseInt(duration.asMinutes()) % 60;
    
    // Adjust minutes_fictif to be converted to hours
    var additional_hours = minutes_fictif / 60;
    
    // Add the additional hours to the hours_fictif
    hours_fictif += additional_hours;

    // If the hours are negative (indicating crossing midnight), adjust by adding 24 hours
    if (hours_fictif < 0) {
      hours_fictif += 24;
    }

    // Return the total hours, rounded to two decimal places if desired
    return hours_fictif.toFixed(2) + " heures";
  } else {
    return "heure non défini";
  }
}



function render_button(temp_c) {
  
  var btn = "";
  btn += `<button onclick="printLeave('${temp_c._id}')" class="btn btn-sm btn-outline-secondary mx-3 mb-3 print-btn">Imprimer <i class="fa-solid fa-print"></i></button>`;
  // switch (row_activated) {
  //   case "en cours": btn += `
  //   <button onclick="edit('${temp_c._id}','${temp_c.m_code}','${temp_c.piece}')" class="btn btn-sm btn-success mx-3 mb-3"> MODIFIER <i class="fa-solid fa-pen-to-square"></i></button>
  //   <button onclick="select_delete('${temp_c._id}','${temp_c.m_code}','${temp_c.date_start}','${temp_c.date_end}','${temp_c.duration}',)" class="btn btn-sm btn-danger mb-3"> ANNULER <i class="fa-solid fa-ban"></i></button>`; break;
  //   case "en attente": btn += `
  //   <button onclick="edit('${temp_c._id}','${temp_c.m_code}','${temp_c.piece}')" class="btn btn-sm btn-success mx-3 mb-3"> MODIFIER <i class="fa-solid fa-pen-to-square"></i></button>
  //   <button onclick="select_delete('${temp_c._id}','${temp_c.m_code}','${temp_c.date_start}','${temp_c.date_end}','${temp_c.duration}',)" class="btn btn-sm btn-danger mb-3"> ANNULER <i class="fa-solid fa-ban"></i></button>`; break;
  //   case "Terminée": btn += `
  //   <button onclick="edit('${temp_c._id}','${temp_c.m_code}','${temp_c.piece}')" class="btn btn-sm btn-success mx-3 mb-3"> MODIFIER <i class="fa-solid fa-pen-to-square"></i></button>

  //   <button onclick="select_delete('${temp_c._id}','${temp_c.m_code}','${temp_c.date_start}','${temp_c.date_end}','${temp_c.duration}',)" class="btn btn-sm btn-danger mb-3"> SUPPRIMER <i class="fa-solid fa-ban"></i></button>`; break;
  // } 
  btn += `
  <button onclick="edit('${temp_c._id}','${temp_c.m_code}','${temp_c.piece}')" class="btn btn-sm btn-success mx-3 mb-3"> MODIFIER <i class="fa-solid fa-pen-to-square"></i></button>

  <button onclick="select_delete('${temp_c._id}','${temp_c.m_code}','${temp_c.date_start}','${temp_c.date_end}','${temp_c.duration}',)" class="btn btn-sm btn-danger mb-3"> SUPPRIMER <i class="fa-solid fa-ban"></i></button>`; 

  return btn
}

function printLeave(id) {
  $.ajax({
    url: '/print_leave/' + id,
    method: 'POST',
    success: (res) => {
      if (res.ok) {
        window.open(res.file, '__blank')
      }
    },
    error:  (err) => {
      console.log('Not ok: ',  err)
    }
  })
}
function give_motif(motif) {
  if (motif == "") {
    return `<p class="info-text text-center"> Aucune motif</p>`
  }
  else {
    return `<p class="info-text text-center">${motif}</p>`
  }
}
function retrieve_profil(code) {
  var profil = "";
  users.forEach(user => {
    if (user.m_code == code) {
      profil = user.profil
    }
  });
  return profil
}
function hideShowElement(option) {
  var all_element = document.querySelectorAll(".leavelist");
  all_element.forEach(element => {
    element.style.display = option;
  });
}
function rendu_footer() {
  return `
    </div>
    <div class="row mt-3" id="footer">
                                <div class="col-md-2 text-center">
                                  <button class="navigation" id="previous" onclick="prev()"><i  class="fa-solid fa-circle-chevron-left"></i></button>
                                </div>
                                <div class="col-md-8 d-flex justify-content-center align-items-center" style="cursor: pointer;">
                                  ${navigation_point}
                                </div>
                                <div class="col-md-2 text-center">
                                  <button class="navigation" id="nextin" onclick="next()"><i  class="fa-solid fa-circle-chevron-right"></i></button>
                                </div>
                                 </div>
                                 
    `
}
function rendu_body() {
  var temp_row = [];
  
  // var don = data[0].filter(m => m.m_code == "M-SE" && m.date_start == "2024-09-30")
  // console.log("done", don);
  leaves.forEach(conge => {
    // if (conge.status == opt && search_year(conge.date_start, conge.date_end) && search_month(conge.date_start, conge.date_end) && search_texting(conge.m_code) && search_type(type_conge, conge.type)) {
    if (search_year(conge.date_start, conge.date_end) && search_month(conge.date_start, conge.date_end) && search_texting(conge.m_code) && search_textingNom(conge.nom) && search_type(type_conge, conge.type)) {
        temp_row.push(rendu_conge(conge))
      if (temp_row.length == 4) {
        rows.push(temp_row);
        navigation_point += `<div class="indicator mx-1" onmouseover="hover_navigation('${rows.length - 1}')"></div>`;
        temp_row = [];
      }
    }
  });
  if (temp_row.length > 0) {
    rows.push(temp_row);
    navigation_point += `<div class="indicator mx-1" onmouseover="hover_navigation('${rows.length - 1}')"></div>`;
  }
  return rows;
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
function verify_navigation() {
  if (indice_row == 0) {
    document.getElementById("previous").disabled = true;
  }
  else {
    document.getElementById("previous").disabled = false;
  }
  if (rows.length == indice_row + 1) {
    document.getElementById("nextin").disabled = true;
  }
  else {
    document.getElementById("nextin").disabled = false;
  }
  activate_indication();
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
function next() {
  indice_row++;
  behavior = "right";
  change_content();//row_activated
}
function prev() {
  indice_row--;
  behavior = "left";
  change_content();//row_activated
}
function active_row(value) {
  row_activated = value;
  indice_row = 0;
  behavior = "left";
  change_content();//row_activated
}
function date_conversion(date) {
  return moment(date).format("DD/MM/YYYY")
}
function searching() {
  indice_row = 0;
  change_content();//row_activated
}
function search_texting(code) {  

  if (search_text.trim() != "") { //&& row_activated != "en cours") {
    if (code.includes(search_text.toUpperCase())) {
      return true
    }
    else {
      return false;
    }
  }
  else {
    return true;
  }
}

function search_textingNom(nom) {
  const upperSearchNom = search_nom.toUpperCase(); 
  if (search_nom.trim() != "") { //&& row_activated != "en cours") {
    // console.log("nom", nom);
    if (nom.toUpperCase().includes(upperSearchNom)) {      
      return true
    }
    else {
      return false;
    }
  }
  else {
    return true;
  }
}
function set_type() {
  type_conge = document.getElementById("type").value;
  searching();
}
function set_text() {
  search_text = document.getElementById("searching").value.trim();
  search_nom = document.getElementById("searchingNom").value.trim();
  if (search_text == "" && search_nom == "") {
    searching();
  }
}
function search_year(temp1, temp2) {
  
  var date1 = date_conversion(temp1).split("/");
  var date2 = date_conversion(temp2).split("/");
  if (year.value != ""){// && row_activated != "en cours") {
    if (date1[2] == year.value) {
      return true;
    }
    else if (date2[2] == year.value) {
      return true;
    }
    else {
      return false;
    }
  }
  else {
    return true;
  }
}
function search_type(type, actual) {
  if (type != "") {
    if (actual.includes(type)) {
      return true
    }
    else {
      return false;
    }
  }
  else {
    return true;
  }
}
function set_month(val, ind) {
  ind = parseInt(ind);
  month_value = val;
  behavior = "left";
  indice_row = 0;
  console.log('val,', val);
  console.log('ind,', ind);
  
  if (ind == 0) { // || row_activated == "en cours"
    download.innerHTML = `<i class="fa-solid fa-download"></i> INDISPONIBLE`
    download.disabled = true;
  }
  else {
    download.innerHTML = `<i class="fa-solid fa-download"></i> CONGE ${moment(val).locale("Fr").format("MMMM").toUpperCase()}`
    download.disabled = false;
  }

  for (let index = 0; index < active_month.length; index++) {
    if (ind == index) {
      var elements = document.getElementById(active_month[ind]);
      elements.innerHTML = `<p class="month-text">${active_month[ind]} <i class="fa-solid fa-arrow-right fa-beat mx-2"></i></p>`;
      elements.setAttribute("class", "month-active mb-1");
    }
    else {
      var element = document.getElementById(active_month[index])
      element.innerHTML = `<p class="month-text">${active_month[index]}</p>`;
      element.setAttribute("class", "month-standby mb-1");
    }
  }
  change_content()
}
function search_month(temp1, temp2) {
  var date1 = date_conversion(temp1).split("/");
  var date2 = date_conversion(temp2).split("/");
  if (month_value != "") {// && row_activated != "en cours") {
    if (date1[1] == month_value && date1[2] == year.value) {
      return true;
    }
    else if (date2[1] == month_value && date1[2] == date2[2]) {
      return true;
    }
    else {
      return false;
    }
  }
  else {
    return true;
  }
}
function generate() {
  waiting.style.display = "block";
  var http = new XMLHttpRequest();
  http.open("POST", "/leave_report", true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {

      if (this.responseText == "error") {
        window.location = "/"
      }
      else {
        waiting.style.display = "none";
        getfile.click();
      }

    }
  };
  http.send(`month=${month_value}&year=${year.value}`);
}
//Editing
var update_type_leave = document.getElementById("type_leave");
var update_motif = document.getElementById("motif");
var update_quart = document.getElementById("quart");
var update_demi = document.getElementById("demi");
var update_one = document.getElementById("one");
var update_datestart = document.getElementById("datestart");
var update_dateend = document.getElementById("dateend");
var update_profil = document.getElementById("profil");
var update_code = document.getElementById("code");
var update_id = "";
var checking = "n";
var code_selected;
var hour_absence = document.getElementById("hour_absence");
var begin = document.getElementById("begin");
var end = document.getElementById("end");
var info = document.getElementById("info");

var conge_payer = document.getElementById("conge_payer")
var input_conger_payer = document.getElementById("input_conger_payer")
var deduire_salaire = document.getElementById("deduire_salaire")
var input_deduire_salaire = document.getElementById("input_deduire_salaire")
var permission_exceptionnelle = document.getElementById("permission_exceptionnelle")
var input_permission_except = document.getElementById("input_permission_except")
var rien_a_deduire = document.getElementById("rien_a_deduire")
var input_rien_a_deduire = document.getElementById("input_rien_a_deduire")

var nombreDeJours = document.getElementById("nombreDeJours")
var nombreDeJoursInitial = document.getElementById("nombreDeJoursInitial")
var btnsave = document.getElementById("save_leave");
function dissapearq() {
  conge_payer.checked = false
  deduire_salaire.checked = false
  permission_exceptionnelle.checked = false
  rien_a_deduire.checked = false
  input_conger_payer.value = ""
  input_deduire_salaire.value = ""
  input_permission_except.value = ""
  input_rien_a_deduire.value = ""
  if (update_quart.checked) {
    hour_absence.setAttribute("class", "d-flex top_down");
    update_dateend.style.display = "none";
    update_demi.checked = false;
    update_one.checked = false;
    nombreDeJours.value = 0.25
    checking = 0.25;
  }
  else {
    hour_absence.setAttribute("class", "d-flex hiding-hour");
    setTimeout(() => {
      hour_absence.setAttribute("class", "hide top_down");
    }, 2000);
    update_dateend.style.display = "block";
    checking = "n";
    if (!update_quart.checked && !update_demi.checked && !update_one.checked) {
      
      nombreDeJours.value = nombreDeJoursInitial.value
    }
  }
}
function dissapeard() {
  if (update_demi.checked) {
    update_dateend.style.display = "none";
    update_quart.checked = false;
    update_one.checked = false;
    checking = 0.5;
    nombreDeJours.value = 0.5
  }
  else {
    update_dateend.style.display = "block";
    checking = "n";
    if (!update_quart.checked && !update_demi.checked && !update_one.checked) {
      
      nombreDeJours.value = nombreDeJoursInitial.value
    }
  }
}
function dissapearo() {
  if (update_one.checked) {
    update_quart.checked = false;
    update_demi.checked = false;
    update_dateend.style.display = "none";
    checking = 1;
    nombreDeJours.value = 1
  }
  else {
    update_dateend.style.display = "block";
    checking = "n";
    if (!update_quart.checked && !update_demi.checked && !update_one.checked) {
      
      nombreDeJours.value = nombreDeJoursInitial.value
    }
    
  }
}
//Modal
function openModal() {
  document.getElementById("ModalConge").style.display = "block"

}

function edit(id, code, pieceJointe) {
  update_id = id;
  code_selected = code;
  userActive = users.filter(us => us.m_code == code);
  activateCp(false);
  activatePermission(false);
  activateRm(false);
  setNumberPermission(code)
  congeAuth(userActive.leave_stat,userActive.save_at)
  waiting_edit.style.opacity = 0;
  openModal();
  leaves.forEach(act_leave => {
    
    if (act_leave._id == id) {
    console.log("act_leave", act_leave);
      switch (act_leave.duration) {
        case 0.25:
          update_quart.checked = true;
          begin.value = act_leave.hour_begin;
          end.value = act_leave.hour_end;
          dissapearq();
          update_dateend.value = act_leave.date_end;

          break;
        case 0.5:
          update_demi.checked = true;
          dissapeard();
          update_dateend.value = act_leave.date_end;;
          break;
        case 1:
          update_one.checked = true;
          dissapearo();
          update_dateend.value = act_leave.date_end;;
          break;
        default:
          update_dateend.value = act_leave.date_end;
          update_quart.checked = false;
          update_demi.checked = false;
          update_one.checked = false;
          dissapearq();
          dissapeard();
          dissapearo();
          break;
      }
      update_type_leave.value = act_leave.type //.split("(")[0].trim();
      update_motif.value = act_leave.motif;
      update_datestart.value = act_leave.date_start;
      update_profil.setAttribute("src", `Profil/${retrieve_profil(act_leave.m_code)}`);
      update_code.innerHTML = `<i class="fa-solid fa-star"></i>${act_leave.m_code}`
      changinType()
      pieceJointe == "" || pieceJointe.toString() == "undefined" ? onFile = "" : onFile = pieceJointe
      onFile != "" ? $('#fileOk').css("display","block")  :  $('#fileOk').css("display","none")

      if(act_leave.conge_payer>0){
        $('#conge_payer').prop('checked', true);
        input_conger_payer.value = act_leave.conge_payer
      }
      if(act_leave.deduire_sur_salaire>0){
        $('#deduire_salaire').prop('checked', true);
        input_deduire_salaire.value = act_leave.deduire_sur_salaire
      }
      if(act_leave.permission_exceptionnelle>0){
        $('#permission_exceptionnelle').prop('checked', true);
        input_permission_except.value = act_leave.permission_exceptionnelle
      }
      if(act_leave.rien_a_deduire>0){
        $('#rien_a_deduire').prop('checked', true);
        input_rien_a_deduire.value = act_leave.rien_a_deduire
      }
      nombreDeJours.value = act_leave.duration
      nombreDeJoursInitial.value = act_leave.duration

      // conge_payer
      // const result = {};

      // // Récupérer les valeurs des checkboxes et des inputs
      // result['conge_payer'] = $('#conger_payer').is(':checked') ? parseFloat($('#input_conger_payer').val()) : 0;
      // result['deduire_salaire'] = $('#deduire_salaire').is(':checked') ? parseFloat($('#input_deduire_salaire').val()) : 0;
      // result['permission_exceptionnelle'] = $('#permission_exceptionnelle').is(':checked') ? parseFloat($('#input_permission_except').val()) : 0;
      // result['rien_a_deduire'] = $('#rien_a_deduire').is(':checked') ? parseFloat($('#input_rien_a_deduire').val()) : 0;

      // console.log("res", result);
      }
  });
}


function closeModal() {
  document.getElementById("ModalConge").style.display = "none"
}
function date_diff(starting, ending) {
  var startings = moment(moment(starting)).format("YYYY-MM-DD");
  var endings = moment(ending, "YYYY-MM-DD");
  var duration = moment.duration(endings.diff(startings));
  var dayl = duration.asDays();
  return parseInt(dayl.toFixed(0));
}
function Editing() {
  var totalNbreConge = Number(input_conger_payer.value) + Number(input_deduire_salaire.value) + Number(input_permission_except.value) + Number(input_rien_a_deduire.value)
  
  console.log("nombreDeJours.value",totalNbreConge, nombreDeJours.value, input_conger_payer.value, input_rien_a_deduire.value);
  
  if (checking != "n") { 
    
    if (checking == 0.25 && totalNbreConge == 0.25  ) {
      
      if (update_type_leave.value == "" || update_datestart.value == "" || update_dateend.value == "" || begin.value == "" || end.value == "") {
        info.innerHTML = "Veuillez remplir correctement tout les informations necessaires";
        info.style.display = "block";
        waiting_edit.style.opacity = 0;
        btnsave.disabled = false;
      }
      else {
        btnsave.disabled = true;
        console.log("editLeave 1", input_conger_payer.value, input_deduire_salaire.value, input_permission_except.value, input_rien_a_deduire.value);
        
        edit_leave("/editleave", update_type_leave.value, update_datestart.value, update_datestart.value, checking, update_motif.value, update_id, begin.value, end.value,permissionValue, input_conger_payer.value, input_deduire_salaire.value, input_permission_except.value, input_rien_a_deduire.value);
      }
    }
    else if(totalNbreConge !== Number(nombreDeJours.value)) {
      console.log("nbre different");
      
      info.innerHTML = "Veuillez vérifier le nombre du décision et le nombre du jours";
      info.style.display = "block";
      waiting_edit.style.opacity = 0;
      btnsave.disabled = false;

    }else{
      if (update_type_leave.value == "" || update_datestart.value == "" || update_dateend.value == "" ) {
        info.innerHTML = "Veuillez remplir correctement tout les informations necessaires";
        info.style.display = "block";
        waiting_edit.style.opacity = 0;
        btnsave.disabled = false;
      }
      else {
        btnsave.disabled = true;        
        console.log("editLeave 2", input_conger_payer.value, input_deduire_salaire.value, input_permission_except.value, input_rien_a_deduire.value);

        edit_leave("/editleave", update_type_leave.value, update_datestart.value, update_datestart.value, checking, update_motif.value, update_id, "", "",permissionValue,  input_conger_payer.value, input_deduire_salaire.value, input_permission_except.value, input_rien_a_deduire.value);
      }
    }

  }
  else {
   if(totalNbreConge !== Number(nombreDeJours.value)) {
      console.log("nbre different");
      
      info.innerHTML = "Veuillez vérifier le nombre du décision et le nombre du jours";
      info.style.display = "block";
      waiting_edit.style.opacity = 0;
      btnsave.disabled = false;

    }
    else if (update_type_leave.value == "" && update_datestart.value == "") {
      info.innerHTML = "Veuillez remplir tout les informations necessaires";
      info.style.display = "block";
      waiting_edit.style.opacity = 0;
      btnsave.disabled = false;
    }
    else if (date_diff(update_datestart.value, update_dateend.value) < 0) {
      info.innerHTML = "Erreur de difference entre la date de début et fin";
      info.style.display = "block";
      waiting_edit.style.opacity = 0;
      btnsave.disabled = false;
    }
    else {
      btnsave.disabled = true;
      console.log("editLeave 3", input_conger_payer.value, input_deduire_salaire.value, input_permission_except.value, input_rien_a_deduire);

      edit_leave("/editleave", update_type_leave.value, update_datestart.value, update_dateend.value, "n", update_motif.value, update_id, "", "",permissionValue,  input_conger_payer.value, input_deduire_salaire.value, input_permission_except.value, input_rien_a_deduire.value);
    }
  }

}
function edit_leave(url, type, startings, endings, val, mt, id, begin, end,exceptType, conger_payer, deduire_salaire, permission_except, rien_a_deduire) {
  waiting_edit.style.opacity = 1;
  var http = new XMLHttpRequest();
  http.open("POST", url, true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText == "Ok") {
        var duree = "";
        if (begin == ""){
          duree = " de durée de " + date_diff(startings,endings) + " jour(s) "
        }
        else {
          duree =" de durée de " + calcul_timediff_absencereport(begin,end)
        }
        if (mt == ""){
          info.innerHTML ="Modification en "+  type + " le " + moment(startings).format("DD/MM/YYYY") + null_val(endings, startings) + duree + " pour " + code_selected + " terminée";
        }
        {
          info.innerHTML = "Modification en "+ mt + " le " + moment(startings).format("DD/MM/YYYY") + null_val(endings, startings) + duree + " pour " + code_selected + " terminée";
        }
        info.style.display = "block";
        waiting_edit.style.opacity = 0;
        document.getElementById("maj").style.display = "block";
        hideShowElement("none");
        closeModal();
        setTimeout(() => {
          get_all_leave();
          document.getElementById("maj").style.display = "none";
        }, 3000);
      }
      else if (this.responseText == "not authorized") {
        info.innerHTML = code_selected + " n'est pas autorisée a prendre ce type de congé";
        info.style.display = "block";
      }
      else if (this.responseText == "duplicata") {
        info.innerHTML = "Un congé incluant la date choisi existe déja pour " + code_selected;
        info.style.display = "block";
      }
      else {
        window.location = "/session_end";
      }
      btnsave.disabled = false;
      waiting_edit.style.opacity = 0;
      info.style.display = "block";
    }
    else {
      info.innerHTML = "Congé non enregistrés veuillez réessayer";
      info.style.display = "block";
      waiting_edit.style.opacity = 0;
      btnsave.disabled = false;
    }
  };
  http.send("id=" + id + "&code=" + code_selected + "&type=" + type + "&leavestart=" + startings + "&leaveend=" + endings + "&court=" + val + "&motif=" + mt 
  + "&begin=" + begin + "&end=" + end + "&exceptType=" + exceptType + "&conger_payer=" + conger_payer + "&deduire_salaire=" + deduire_salaire 
  + "&permission_except=" + permission_except + "&rien_a_deduire=" + rien_a_deduire );
}
function null_val(gived, start) {
  if (gived == "" || start == gived) {
    return ""
  }
  else {
    return " au " + moment(gived).format("DD/MM/YYYY");
  }
}
var id_delete;
var code_delete;
function select_delete(id, code, debut, fin, duree) {
  document.getElementById("ModalSuppr").style.display = "block";
  document.getElementById("code_delete").innerHTML = "Voulez vous annuler le congé de " + code;
  document.getElementById("begin_delete").innerHTML = "Début : " + moment(debut).format("DD/MM/YYYY");
  document.getElementById("end_delete").innerHTML = "Fin : " + moment(fin).format("DD/MM/YYYY");
  document.getElementById("duration").innerHTML = "Durée : " + duree + " jour";
  id_delete = id;
  code_delete = code;
  waiting_delete.style.opacity = 0;
  document.getElementById("ModalSuppr").style.display = "block";
}
function abort_delete() {
  document.getElementById("ModalSuppr").style.display = "none";
  document.getElementById("code_delete").setAttribute("class", "warn-text mt-4");
}
function delete_leave() {
  waiting_delete.style.opacity = 1;
  var http = new XMLHttpRequest();
  http.open("POST", "/delete_leave", true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      if (this.responseText == "Ok") {
        waiting_delete.style.opacity = 0;
        showNotif("Succès")
      }
      else {
        waiting_delete.style.opacity = 0;
        showNotif("Erreur");
      }
    };
  }
  http.send("id=" + id_delete + "&code=" + code_delete);
}
function showNotif(text) {
  const notif = document.querySelector('.notification_suppr');
  document.getElementById("code_delete").setAttribute("class", "warn-text");
  notif.innerHTML = text;
  notif.style.display = 'block';
  setTimeout(() => {
    notif.style.display = 'none';
    document.getElementById("maj").style.display = "block";
    hideShowElement("none");
    abort_delete();
    setTimeout(() => {
      get_all_leave();
      document.getElementById("maj").style.display = "none";
    }, 3000);
  }, 3000);
}
function rest_begin_end(){
  begin.value = "";
  end.value = "";
}
function date_diff(starting, ending) {
  if(checking == "n"){
    var startings = moment(moment(starting)).format("YYYY-MM-DD");
    var endings = moment(ending, "YYYY-MM-DD");
    var duration = moment.duration(endings.diff(startings));
    var dayl = duration.asDays();
    return parseInt(dayl.toFixed(0)) + 1;
  }
  else {
    return checking
  }
  
}
function calcul_timediff_absencereport(startTime, endTime) {
  startTime = moment(startTime, "HH:mm:ss a");
  endTime = moment(endTime, "HH:mm:ss a");
  var duration = moment.duration(endTime.diff(startTime));
  //duration in hours
  var hours_fictif = 0;
  var minutes_fictif = 0;
  hours_fictif += parseInt(duration.asHours());

  // duration in minutes
  minutes_fictif += parseInt(duration.asMinutes()) % 60;
  if (minutes_fictif < 0) {
    hours_fictif = hours_fictif - 1;
    minutes_fictif = 60 + minutes_fictif;
  }
  while (minutes_fictif > 60) {
    hours_fictif += 1;
    minutes_fictif = minutes_fictif - 60;
  }
  if (hours_fictif < 0) {
    hours_fictif = hours_fictif + 24;
  }
  if (hours_fictif == 0) {
    return minutes_fictif + "mn ";
  } else if (minutes_fictif == 0) {
    return hours_fictif + "h ";
  } else {
    return hours_fictif + "h " + minutes_fictif + "mn ";
  }
}
$('#type_leave').on('change', function () {
  changinType();
})
function changinType(){
  if ($('#type_leave').val() == "Permission exceptionelle"){
    permissionValue = $("#exceptType").val();
      activatePermission(true)
      activateCp(false)
      activateRm(false)
  }
  else if ($('#type_leave').val() == "Repos Maladie"){
    permissionValue = "";
      activatePermission(false)
      activateCp(false)
      activateRm(true)
  } else if ($('#type_leave').val() == "Congé Payé"){
    permissionValue = "";
      activatePermission(false)
      activateCp(true)
      activateRm(false)
  }
  else {
    permissionValue = "";
      activateCp(false)
      activatePermission(false)
      activateRm(false)
  }
}
var permissionValue = "";
$("#exceptType").on('change' ,function (){
  permissionValue = $("#exceptType").val();
  if ($("#exceptType").val() != "Férié"){
      permissionExist($("#exceptType").val(),code_selected)
  }
  else {
      $("#alertPermission").attr("class","d-none")
  }
})
$("#rmType").on('change' ,function (){
    motif.value = $("#rmType").val()
})
function permissionExist(choice,code){
  const found = allPermission.find(perm => perm.exceptType == choice && perm.m_code == code);
  if (found){
      $("#alertPermission").attr("class","alert alert-danger mt-2")
  }
  else {
      $("#alertPermission").attr("class","d-none")
  }
}
function setNumberPermission(code){
  $('#thisYearPerm').text(moment().format("YYYY"));
  var myPermission = allPermission.filter(permission => permission.m_code == code);
  var cumulPermission = 0;
  for (let index = 0; index < myPermission.length; index++) {
      const element = myPermission[index];
      if (element.exceptType != "Férié"){
          cumulPermission = cumulPermission + element.duration;
      }
  }
  $("#numberPermission").text(cumulPermission)
}
function activatePermission(choice){
  if (choice){
      permissionType = true;
      $("#typeGranted").attr("class","d-flex justify-content-between")
  }
  else {
      permissionType = false;
      $("#typeGranted").attr("class","d-none")
  }
}
// Répos maladie
function activateRm(choice){
  if (choice){
      $("#typeRm").attr("class","d-flex justify-content-between")
  }
  else {
      $("#typeRm").attr("class","d-none")
  }
}
// congé late
var showAlertConge = false;
function congeAuth(auth,save){
  if (auth == "n"){
    showAlertConge = true;
    $("#alertConge").text(`${code_selected} n'est autorisée a prendre ce type de congé qu'en ${moment(save).add(1,"years").locale("Fr").format("MMMM YYYY")}`)
  }
  else {
    showAlertConge = false;
  }
}
function activateCp(choice){
  if (choice && showAlertConge){
    $('#alertConge').attr("class","alert alert-danger mt-2")
  }
  else {
    $('#alertConge').attr("class","d-none")
  }
}
function seePiece(file){
  $("#ModalPiece").show();
  $('#who').text(`Piece jointe selectioner`)
    renderPiece(file);
    $("#fileOk").css("display","block")
 
}
function closePiece(){
  $("#ModalPiece").hide();
  $("#PieceContent").html("")
}
function renderPiece(file){
  const imagePath = `../PieceJointe/${file}`;
fetch(imagePath)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch image');
        }
        return response.blob();
    })
    .then(blob => {
         $("#PieceContent").html(`<object class="object-content mt-3 overflow-auto" data=${ URL.createObjectURL(blob)}>
         </object>`)
    })
    .catch(error => {
        console.error('Error fetching image:', error);
    });
}
function addPiece(){
  if (onFile){
    seePiece(onFile)
  }
  else {
    $("#join").click();
  }
  
}
$('#join').on('change', function (event) {
  var selectedFile = event.target.files[0];
  if (selectedFile){
      piece = selectedFile;
      var joinPiece = new FormData();
          joinPiece.append("join",piece);
          joinPiece.append("idLeave",update_id);
          $.ajax({
              url: "/joinFileLeaveAnother",
              method: "POST",
              cache: false,
              contentType: false,
              processData: false,
              data: joinPiece,
              success: function (res) {
                  if (res.status == "Success"){
                     $("#fileOk").css("display",'block')
                     info.innerHTML = "La pièce jointe a été attaché";
                     info.style.display = "block";
                     closePiece();
                     seePiece(res.fileName)
                  }
                  else {
                    info.innerHTML = "La pièce jointe n'a pas été attaché";
                    info.style.display = "block";
                  }
              }
          })
  }
  else {
    piece = "";
    $("#fileOk").css("display","block")
  }
})
function replacePiece(){
  $("#join").click();
}
