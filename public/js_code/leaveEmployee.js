var type_leave = document.getElementById("type_leave");
var datestart = document.getElementById("datestart");
var dateend = document.getElementById("dateend");
var remaining_leave = document.getElementById("remaining_leave");
var leave_taked = document.getElementById("leave_taked");
var info = document.getElementById("info");
var profil = document.getElementById("profil");
var ids = "";
var qj = document.getElementById("quart");
var dj = document.getElementById("demi");
var oj = document.getElementById("one");
var motif = document.getElementById("motif");
var btnsave = document.getElementById("save_leave");
var full_name = document.getElementById("full_name");
var post = document.getElementById("poste");
var opens = document.getElementById("open");
var sum = document.getElementById("sum");
var reste_apres_auto = document.getElementById('u-reste-auto');
var employee_id = document.getElementById('u-employee-id');
var droit_rest = document.getElementById('u-droit-rest');
var last = document.getElementById("last");
var upcoming = document.getElementById("upcoming");
var waiting = document.getElementById("waiting");
var waiting_add = document.getElementById("waiting-add");
var hour_absence = document.getElementById("hour_absence");
var begin = document.getElementById("begin");
var number_conge_annuel_normal = document.getElementById("congeNormal")
var number_conge_annuel_weekEnd = document.getElementById("congeWeekEnd")
var end = document.getElementById("end");
const anneeActuelle = new Date().getFullYear();
const buttonConge = document.getElementById("congeNormal");
buttonConge.textContent = `Mis à jours congée ${anneeActuelle}`;
 
var oneDay = false;
waiting.style.opacity = 0;
waiting_add.style.opacity = 0;
var code_selected = ""
var users;
//Number of those in period of vacation for each SHIFT
var shift1_number = 0; var shift2_number = 0; var shift3_number = 0; var shiftw_number = 0; var dev_number = 0; var tl_number = 0; var admin_number = 0;
var sh1_num = 0; var sh2_num = 0; var sh3_num = 0; var shv_num = 0; var dev_num = 0; var tl_num = 0; var adm_num = 0;
var employees = {
  "list1":[],
  "list2":[],
  "list3":[],
  "list4":[],
  "list5":[],
  "list6":[],
  "list7":[]
}
function counting(){
  users = initData;
 shift1_number = 0; shift2_number = 0; shift3_number = 0; shiftw_number = 0; dev_number = 0; tl_number = 0; admin_number = 0;
  sh1_num = 0; sh2_num = 0; sh3_num = 0; shv_num = 0; dev_num = 0; tl_num = 0; adm_num = 0;
  employees = {
    "list1":[],
    "list2":[],
    "list3":[],
    "list4":[],
    "list5":[],
    "list6":[],
    "list7":[]
  }
  for (i = 0; i < initData.length; i++) {
    if (initData[i].shift == "SHIFT 1") {
      shift1_number++;
      if (initData[i].act_stat == "VACATION") {
        if (leave_in_progress.find(item => item.m_code == initData[i].m_code)) {
          employees["list1"].push(leave_in_progress.find(item => item.m_code == initData[i].m_code))
          sh1_num++;
        }
        
      }
    }
    else if (initData[i].shift == "SHIFT 2") {
      shift2_number++;
      if (initData[i].act_stat == "VACATION") {
        if (leave_in_progress.find(item => item.m_code == initData[i].m_code)) {
          employees["list2"].push(leave_in_progress.find(item => item.m_code == initData[i].m_code))
          sh2_num++;
        }
       
      }
    }
    else if (initData[i].shift == "SHIFT 3") {
      shift3_number++;
      if (initData[i].act_stat == "VACATION") {
        if (leave_in_progress.find(item => item.m_code == initData[i].m_code)) {
          employees["list3"].push(leave_in_progress.find(item => item.m_code == initData[i].m_code))
          sh3_num++;
        }
        
      }
    }
    else if (initData[i].shift == "SHIFT WEEKEND") {
      shiftw_number++;
      if (initData[i].act_stat == "VACATION") {
        if (leave_in_progress.find(item => item.m_code == initData[i].m_code)) {
          employees["list4"].push(leave_in_progress.find(item => item.m_code == initData[i].m_code))
          shv_num++;
        }
      }
    }
    else if (initData[i].shift == "DEV") {
      dev_number++;
      if (initData[i].act_stat == "VACATION") {
        if (leave_in_progress.find(item => item.m_code == initData[i].m_code)) {
          employees["list5"].push(leave_in_progress.find(item => item.m_code == initData[i].m_code))
          dev_num++;
        }
       
      }
    }
    else if (initData[i].shift == "TL") {
      tl_number++;
      if (initData[i].act_stat == "VACATION") {
        if (leave_in_progress.find(item => item.m_code == initData[i].m_code)) {
          employees["list6"].push(leave_in_progress.find(item => item.m_code == initData[i].m_code))
          tl_num++;
        }
      
      }
    }
    else {
      admin_number++;
      if (initData[i].act_stat == "VACATION") {
        if (leave_in_progress.find(item => item.m_code == initData[i].m_code)) {
          employees["list7"].push(leave_in_progress.find(item => item.m_code == initData[i].m_code))
          adm_num++;
        }
        
      }
    }
  }
  render_element(employees["list1"], "list1")
  // console.log("list1");
  render_element(employees["list2"], "list2")
  // console.log("list2");
  render_element(employees["list3"], "list3")
  // console.log("list3");
  render_element(employees["list4"], "list4")
  // console.log("list4");
  render_element(employees["list5"], "list5")
  // console.log("list5");
  render_element(employees["list6"], "list6")
  // console.log("list6");
  // console.log(employees["list7"])
  render_element(employees["list7"],"list7")
}
function conger_anuelle() {
  const initialText = updateCongeAnnee.textContent
  buttonConge.textContent = "Chargement...";

  console.log("number_conge_annuel_weekEnd", number_conge_annuel_weekEnd.value);
  console.log("number_conge_annuel_normal", number_conge_annuel_normal.value);
  var http = new XMLHttpRequest()
  http.open("POST", "/api/avance/updateAllCongeAnnee", true)
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      // var data = JSON.parse(this.responseText)
      // initData = data[0];
      buttonConge.textContent = initialText
    }
  };
  http.send(`congeWeekEnd=${number_conge_annuel_weekEnd.value}&congeNormal=${number_conge_annuel_normal.value}`)
}
counting();
set_values();
function set_values() {
  sh1.innerHTML = sh1_num + " / " + shift1_number;
  sh2.innerHTML = sh2_num + " / " + shift2_number;
  sh3.innerHTML = sh3_num + " / " + shift3_number;
  shv.innerHTML = shv_num + " / " + shiftw_number;
  dev.innerHTML = dev_num + " / " + dev_number;
  tl.innerHTML = tl_num + " / " + tl_number;
  adm.innerHTML = adm_num + " / " + admin_number;
}
var search_text = document.getElementById("text");
var list_div = document.getElementById("list_name");
function openModal() {
  document.getElementById("ModalConge").style.display = "block"
}
function closeModal() {
  document.getElementById("ModalConge").style.display = "none"
}
rendu();
change_color(initData[0].m_code);
function change_color(name) {
  var name_element = document.querySelectorAll(".name");
  for (e = 0; e < name_element.length; e++) {
    if (name == name_element[e].textContent) {
      act_number = e;
      name_element[e].className = "clicked2 text-center name";
      getdata(name)
    }
    else {
      name_element[e].className = "list2 text-center name";
    }
  }

}
function search() {
  if (search_text.value == "") {
    users = initData;
    rendu();
    change_color(initData[0].m_code);
  }
  else {
    users = [];
    parcours();
  }
}
function rendu() {
  remove();
  for (i = 0; i < users.length; i++) {
    var h4 = document.createElement("h4");
    var texte = document.createTextNode(users[i].m_code);
    h4.appendChild(texte);
    h4.setAttribute("class", "list2 text-center name");
    h4.setAttribute("onclick", "change_color('" + users[i].m_code + "','" + users[i].m_code + "')");
    list_div.appendChild(h4);
  }
}
function parcours() {
  for (p = 0; p < initData.length; p++) {
    if (initData[p].m_code.toLowerCase().includes(search_text.value.toLowerCase())) {
      users.push(initData[p]);
    }
  }
  remove();
  rendu();
  //change_color(users[0].m_code);
}
function remove() {
  var name_element = document.querySelectorAll(".name");
  for (r = 0; r < name_element.length; r++) {
    name_element[r].remove();
  }
}
// For setting leave
function getdata(code) {
  reloading();
  var http = new XMLHttpRequest();
  http.open("POST", "/getuser_leave", true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      var data = JSON.parse(this.responseText)
      initData = data[0];
      for (d = 0; d < initData.length; d++) {
        if (initData[d].m_code == code) {
          code_selected = code;
          profil.setAttribute("src", `Profil/${initData[d].profil}`)
          full_name.innerHTML = `${initData[d].first_name} ${initData[d].last_name}`;
          post.innerHTML = "POSTE => " + initData[d].project;
          opens.innerHTML = "Droit acquis restant (jours) : 2023: " + initData[d].remaining_leave + " | 2024: "+ (initData[d].leave_taked - initData[d].remaining_leave);
          sum.innerHTML = "Reste après autorisation : ".toUpperCase() + initData[d].leave_taked;
          // update by njato
          employee_id.value =initData[d]._id; 
          reste_apres_auto.value = initData[d].leave_taked - initData[d].remaining_leave; 
          droit_rest.value = initData[d].remaining_leave; 

          if (data[1]) {
            last.innerHTML = `Recement en congé le : ${convert_date(data[1].date_start, data[1].date_end)}`;
          }
          else {
            last.innerHTML = `N'est pas encore parti en congé`;
          }

          if (data[2]) {
            leave_in_progress.push(data[2]);
            upcoming.innerHTML = `Congé en cours ou a venir le : ${convert_date(data[2].date_start, data[2].date_end)}`;
          }
          else {
            upcoming.innerHTML = `Congé en cours ou a venir le : Aucune congé pour l'instant`;
          }

        }
      }
      counting();
      set_values()
    }
  };
  http.send("code=" + code);
}
function convert_date(date1, date2) {
  if (date1 == date2) {
    return moment(date1).format("DD/MM/YYYY");
  }
  else {
    return `${moment(date1).format("DD/MM/YYYY")} au ${moment(date2).format("DD/MM/YYYY")}`;
  }
}
function date_diff(starting, ending) {
  var startings = moment(moment(starting)).format("YYYY-MM-DD");
  var endings = moment(ending, "YYYY-MM-DD");
  var duration = moment.duration(endings.diff(startings));
  var dayl = duration.asDays();
  return parseInt(dayl.toFixed(0));
}
function define_leave() {
  btnsave.disabled = true;
  waiting.style.opacity = 1;
  info.style.display = "none";
  if (qj.checked || oj.checked || dj.checked) {
    
    if (oj.checked) {
      if (type_leave.value == "" || datestart.value == "") {
        info.innerHTML = "Veuillez remplir tous les informations";
        info.style.display = "block";
        btnsave.disabled = false;
        waiting.style.opacity = 0;
      }
      else {
        oneDay = oj.value;
        dateend.value = datestart.value;
        take_leave("/takeleave", type_leave.value, datestart.value, dateend.value, oj.value, motif.value, "", "");
      }
    }
    else if (dj.checked) {
      if (type_leave.value == "" || datestart.value == "") {
        info.innerHTML = "Veuillez remplir tous les informations";
        info.style.display = "block";
        btnsave.disabled = false;
        waiting.style.opacity = 0;
      }
      else {
        oneDay = dj.value;
        dateend.value = datestart.value;
        take_leave("/takeleave", type_leave.value, datestart.value, dateend.value, dj.value, motif.value, "", "");
      }
    }
    else {
      if (type_leave.value == "" || datestart.value == "" || begin.value == "" || end.value == "") {
        info.innerHTML = "Veuillez remplir tous les informations";
        info.style.display = "block";
        btnsave.disabled = false;
        waiting.style.opacity = 0;
      }
      else {
        oneDay = qj.value;
        dateend.value = datestart.value;
        take_leave("/takeleave", type_leave.value, datestart.value, dateend.value, qj.value, motif.value, begin.value, end.value);
      }
    }
  }
  else {
    if (type_leave.value == "" || datestart.value == "" || dateend.value == "") {
      info.innerHTML = "Veuillez remplir correctement tous les informations necessaire";
      info.style.display = "block";
      btnsave.disabled = false;
      waiting.style.opacity = 0;
    }
    else if (date_diff(datestart.value, dateend.value) < 0) {
      info.innerHTML = "Erreur de difference entre la date de début et fin";
      info.style.display = "block";
      btnsave.disabled = false;
      waiting.style.opacity = 0;
    }
    else {
      oneDay = false;
      take_leave("/takeleave", type_leave.value, datestart.value, dateend.value, "n", motif.value, "", "");
    }

  }
}
function null_val(gived, start) {
  if (gived == "" || start == gived) {
    return ""
  }
  else {
    return " au " + moment(gived).format("DD/MM/YYYY");
  }
}
function dissapearq() {
  if (qj.checked) {
    hour_absence.setAttribute("class", "d-flex top_down");
    pde.style.display = "none";
    dateend.value = datestart.value;
    dj.checked = false;
    oj.checked = false;
  }
  else {
    hour_absence.setAttribute("class", "d-flex hiding-hour");
    setTimeout(() => {
      hour_absence.setAttribute("class", "hide top_down");
    }, 2000);
    pde.style.display = "block";
    hour_absence.style.display = "none";
  }
}
function dissapeard() {
  if (dj.checked) {
    dateend.value = datestart.value;
    pde.style.display = "none";
    qj.checked = false;
    oj.checked = false;
  }
  else {
    pde.style.display = "block";
  }
}
function dissapearo() {
  if (oj.checked) {
    dateend.value = datestart.value;
    qj.checked = false;
    dj.checked = false;
    pde.style.display = "none";
  }
  else {
    pde.style.display = "block";
  }
}
function take_leave(url, type, startings, endings, val, mt, begin, end) {
  var http = new XMLHttpRequest();
  http.open("POST", url, true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      var response = JSON.parse(this.response)
      console.log("response", response);
      
      if (response.status == "Ok") {
        var duree = "";
        if (begin == ""){
          duree = " de durée de " + date_diff(startings,endings) + " jour(s)"
        }
        else {
          duree =" de durée de " + calcul_timediff_absencereport(begin,end)
        }
        if (mt == "") {
           info.innerHTML = type +" le " + moment(startings).format("DD/MM/YYYY") + null_val(endings, startings) + duree + " pour " + code_selected + " enregistrés";
        }
        else {
           info.innerHTML = mt +" le " + moment(startings).format("DD/MM/YYYY") + null_val(endings, startings) + duree + " pour " + code_selected + " enregistrés";
        }
       
        info.style.display = "block";
        getdata(code_selected);
        rest_begin_end();
      }
      else if (response.status == "not authorized") {
        info.innerHTML = code_selected + " n'est pas autorisée a prendre ce type de congé";
        info.style.display = "block";
      }
      else if (response.status == "duplicata") {
        info.innerHTML = "Un congé incluant la date choisi existe déja pour " + code_selected;
        info.style.display = "block";
      }
      // else {
      //   window.location = "/session_end";
      // }
      btnsave.disabled = false;
      waiting.style.opacity = 0;

      info.style.display = "block";
    }
    else {
      info.innerHTML = "Congé non enregistrés veuillez réessayer";
      info.style.display = "block";
      btnsave.disabled = false;
      waiting.style.opacity = 0;
    }
  };
  http.send("code=" + code_selected + "&type=" + type + "&leavestart=" + startings + "&leaveend=" + endings + "&court=" + val + "&motif=" + mt + "&begin=" + begin + "&end=" + end);
}
function rest_all() {
  datestart.value = "";
  dateend.value = "";
  pde.style.display = "block";
  type_leave.value = "";
  qj.checked = false;
  dj.checked = false;
  oj.checked = false;
  motif.value = "";
}
function rest_begin_end(){
  begin.value = "";
  end.value = "";
}
function reloading() {
  profil.setAttribute("src", `Profil/avatar.png`)
  full_name.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  post.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  opens.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  sum.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  last.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  upcoming.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
}
function date_diff(starting, ending) {
  if (oneDay == false){
    var startings = moment(moment(starting)).format("YYYY-MM-DD");
    var endings = moment(ending, "YYYY-MM-DD");
    var duration = moment.duration(endings.diff(startings));
    var dayl = duration.asDays();
    return parseInt(dayl.toFixed(0)) + 1;
  }
  else {
    return oneDay
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
    return minutes_fictif + "mn";
  } else if (minutes_fictif == 0) {
    return hours_fictif + "h";
  } else {
    return hours_fictif + "h" + minutes_fictif + "mn";
  }
}
var all_list = ["list1","list2","list3","list4","list5","list6","list7"]
function hoverNumber(list){
  document.getElementById(`${list}_employee`).style.display = "block";
  document.getElementById(`${list}_total`).style.display = "none";
  hideAll(list)
}
function hideAll(active){
  all_list.forEach(element => {
    if (element != active){
      document.getElementById(`${element}_employee`).style.display = "none";
      document.getElementById(`${element}_total`).style.display = "block";
    }
  });
}
function closeList(list){
  document.getElementById(`${list}_employee`).style.display = "none";
  document.getElementById(`${list}_total`).style.display = "block";
}
function render_element(array,list){
  var rendu = "";
  rendu = '<div onclick="closeList('+"'"+list+"'"+')" class=""><h3 class="close-tag">X</h3></div><div class="row d-flex align-items-center justify-content-center">';
  for (let index = 0; index < array.length; index++) {
    const element = array[index];
    rendu += `
    <div class="col-sm-4">
                            <h6 class="text-code2 mt-1 text-center">${element.m_code}<br>${Abreviation(element.type)} de ${element.duration} jour(s)</h6>
                        </div>
    `;
  }
  rendu += '</div>'
  document.getElementById(`${list}_employee`).innerHTML = rendu;
}
function Abreviation(given){
  var all_types = ["Congé Payé", "Congé sans solde","Permission exceptionelle","Repos Maladie","Absent","Congé de maternité","Mise a Pied"];
  var abreviations = ["CP", "CSS", "PE", "RM", "ABS", "CDM", "M P"]
  for (let index = 0; index < all_types.length; index++) {
    const element = all_types[index];
    if (given.includes(element)){
      return abreviations[index]
    }
    
  }
}

async function edit_solde() {
  let empId = employee_id.value;
  let droitRest = droit_rest.value;
  // let restAuto = reste_apres_auto.value + droitRest;

  const res = await fetch('/api/solde/' + empId, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      remaining_leave: droitRest,
      // leave_taked: restAuto
    })
  })

  const { ok, data } = await res.json();

  if (ok) {
    
  }

  console.log(data)
}