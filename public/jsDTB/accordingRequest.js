const GerantId = "645a417e9d34ed8965caea9e"; // Navalona
// const GerantId = "6673ecbf0f644c29f7a997f7";
const leaveModeValue = {
    'congé': 'Congé',
    'régularisation': "Régularisation d'absence",
    'récupération': "Récupération"
}
var myRequestContent = "";
var idActive = "";
var allRequest = [];
var emergencyRequest = [];
var normalRequest = [];
var order = false;
var seeFile = true;
var idForFile = "";
var permissionType = false;
var changeMotif = true;
var userActive;
function UpdateRequest(){
    $.ajax({
        url:"/allRequest",
        method:"POST",
        data:{},
        success: function(res) {
            myRequestContent = ""
            allRequest = res;
            emergencyRequest = res.filter(leave => leave.priority  === true);
            normalRequest = res.filter(leave => leave.priority === false);
            // render high priority requests
            const hightRequests = allRequest.filter((lr) => lr.leavePriority === 3);
            $('#highRequest').html(renderAllRequest(hightRequests));
            $('button[data-target="#highRequest"] > span').text(hightRequests.length);
            // render medium priority requests
            const mediumRequests = allRequest.filter((lr) => lr.leavePriority === 2);
            $('#mediumRequest').html(renderAllRequest(sortedAsc(mediumRequests)));
            $('button[data-target="#mediumRequest"] > span').text(mediumRequests.length)
            // render low priority requests
            const lowRequests = allRequest.filter((lr) => lr.leavePriority === 1)
            
            $('#lowRequest').html(renderAllRequest(lowRequests));
            $('button[data-target="#lowRequest"] > span').text(lowRequests.length);
            $('#allRequest').html(renderAllRequest(allRequest));

            // console.log(sortedAsc(mediumRequests))
        }   
   })
}

function getListGerantDemand() {
    $.ajax({
        url: "/getDemandeGerant",
        method: "GET",
        data: {},
        success: function (res) {
            var dataGerant = res.data
            // const gerantRequests = res.data.filter((lr) => lr.leavePriority === 3);
            $('#gerantList').html(renderAllRequest(dataGerant));

            $('button[data-target="#listeGerant"] > span').text(dataGerant.length);
            
        }
    })
}
getListGerantDemand()

if (USERID == GerantId) {
    $("#btnListGerant").attr('style', 'display: none')
}
// sort requests by date
const sortedAsc = data => data.slice().sort((a, b) => {
    // Compare dates
    return b._id - a._id;
});

function getShift(code){
    var shift = ["SHIFT 1","SHIFT 2","SHIFT 3"];
    var value = ""
    var theUser = users.filter(employe => employe.m_code == code);
    shift.includes(theUser.shift) ? value = theUser.shift : value = "08 heures";
    return value
}


// methode pour afficher le shift (ex: 08:00 -> 08 heures)
function formatShift(hours = 8) {
    // let [hours] = value.split(':');
    return hours;
    return `${hours} heures`;
}

function uniqValidation(array) {
    let seen = new Set();
    let uniqueArray = array.filter(item => {
        if (seen.has(item.user._id)) {
            return false;
        } else {
            seen.add(item.user._id);
            return true;
        }
    });
    return uniqueArray;
}

function chercherDemande(input) {
    const key = input.value.toUpperCase()
    let element = input.parentElement
    // console.log("par", element);
    
    // Get the parent of the element
    const parent = element.parentNode;

    // Get all children of the parent
    const allChildren = Array.from(parent.children);

    // Filter out the element itself
    const siblings = allChildren.filter(child => child !== element);

    siblings.forEach(arr=>{
        if (arr.getAttribute("key").includes(key)) {
            arr.removeAttribute("hidden")
        }else{
            arr.setAttribute("hidden","")
        }
    } )
    
}



function renderAllRequest(Leave){
    
    var search = `
            <div class="row  d-flex align-items-center" style="grid-column: span 2; position : relative; display: none !important">
                <input type="search" placeholder="cherher m-code" oninput="chercherDemande(this)" class="form-control recherche-mcode"/>
                <span class="mdi mdi-magnify" style="width: 20px; font-size: 20px; position: absolute; left: 4px; "></span>
            </div>`
    let mappedLeave = Leave.map(leave => {
        userActive = users.find(user => user.m_code == leave.m_code)
    
    // unique validation
    leave.validation = uniqValidation(leave.validation)

    let code = leave.m_code;
    let acc = userActive.leave_taked;
    let rest = userActive.remaining_leave
    let duration = leave.duration;

    // rien a deduire 
    let deduction = ["Congé Payé"].includes(Leave.type) ? acc - duration : acc;
    let auth = userActive.leave_stat
    let save = userActive.save_at
    return `
    <div id="${leave._id}" class="content-leave" key="${leave.m_code}">
            <div class="code-person p_${leave.leavePriority}">
                <div>
                    <p id="codeUser" class="code-text">${leave.m_code}</p>
                    <p class='text-duration'>${leave.duration} ${leave.duration > 1 ? "jours" : "jour"}</p>
                    <div>
                    <p class="priority">${leave.priorityValue}</p>
                </div>
            </div>
            </div>
            <div class="leave-infos">
                <small id="since" class="text-end"><b>${dateDiffers(leave.datetime,moment().format("DD/MM/YYYY HH:mm:ss"))}</b></small>
                <p id="motif" class="text-center">
                    <b>Demande:</b> ${leaveModeValue[leave.mode]} <span class="mx-2">|</span> <b>Motif:</b>  ${(leave.recovery !== "" && leave.motif === "") ? leave.recovery : leave.motif}
                </p>
                <div class="date-heure">
                    <div class="ask-content">
                        <h1>
                            <i class="fa-solid fa-calendar"></i>
                            Demandeur
                        </h1>
                        <div class="ask">
                            <span>Nom: ${leave.nom}</span>
                            <span>Shift: ${formatShift(leave.shift)}</span>
                            <span>Matricule: ${leave.matr}</span>
                        </div>
                    </div>
                </div>
                <div class="date-heure">
                    <div class="d">
                        <h1>
                            <i class="fa-solid fa-calendar"></i>
                            Date
                        </h1>
                        <div>
                            <span>Début:</span>
                            <span>${convertDate(leave.date_start)}</span>
                        </div>
                        <div>
                            <span>Fin:</span>
                            <span>${convertDate(leave.date_end)}</span>
                        </div>
                    </div>
                    <div class="h">
                        <h1>
                            <i class="fa-solid fa-clock"></i>
                            Heure
                        </h1>
                        <div>
                            <span>Début:</span>
                            <span> ${leave.hour_begin}</span>
                        </div>
                        <div>
                            <span>Fin:</span>
                            <span> ${leave.hour_end}</span>
                        </div>
                    </div>
                </div>
                ${                                
                    (role == "Gerant") ?
                    `
                    
                    <div class="date-heure">
                            <div class="ask-content">
                                <h1>
                                    <i class="fa-solid fa-calendar"></i>
                                    Status / solde de ${code}
                                </h1>
                                <div class="ask">
                                    <span>${moment().add(-1,"years").format("YYYY")}: ${rest}</span>
                                    <span>${moment().format("YYYY")}: ${(acc - rest)}</span>
                                    <span>Reste après autorisation: ${(deduction)}</span>
                                </div>
                            </div>
                    </div> `
                        : ""
                }
                ${approvingList(leave.validation, leave._id)}
                ${
                    leave.validation.filter(v => !v.approbation).length > 0 ?
                    `<div>
                        <p style="text-decoration:underline;">Commentaires:</p>
                        <ul>
                        ${leave.validation.map(v => (
                            !v.approbation ?
                                `<li>${v.user.usuel}: <span class="text-danger">${v.comment}</span></li>`
                            : ""
                        )).join('')}
                        </ul>
                    </div>`
                    :
                    ""
                }
                <div class="d-flex justify-content-end">
                    ${
                        // code mila commentena
                        (
                            // jerena raha efa misy Id an'ny RH ao sady non validé
                            leave.validation.find(v => RH_IDs.includes(v.user._id) && !v.approbation)
                            &&
                            // ==!jerena raha misy Id gérant ao sady validé (approbation = true)
                            !leave.validation.find(v => v.user._id === GerantId && v.approbation)
                            &&
                            // de tsy pagen'ny gérant
                            USERID !== GerantId
                        ) ?
                        "<div>En attende de la validation du gérant...</div>"
                        : // else

                        (
                            leave.validation.find(v => v.user._id === GerantId && v.approbation)
                            &&
                            USERID !== GerantId
                        )
                        ?
                        renderButtonNoDenied(role,leave)
                        :
                        renderButton(role,leave)
                        
                    }
                </div>
            </div>
        </div>
    `
    });

    return search + mappedLeave.join('');
}
UpdateRequest();

function isFloat(num) {
    // Check if the number has a fractional part
    return num % 1 !== 0;
}
const escapedMotif = (str) => new String(str)
  .replace(/'/g, "\\'")
  .replace(/"/g, '\\"')
  .replace(/\n/g, ' ');

function renderButton(role,leave){
    var button = ""
    switch(role){
        case "Surveillant" : button = `<button onclick="According('${leave._id}','${leave.m_code}','${leave.type}','${leave.duration}', \`${escapedMotif(leave.motif)}\`, '${leave.date_start}', '${leave.date_end}', '${leave.hour_begin}', '${leave.hour_end}')" class="btn btn-sm btn-success btn-response  mx-3">Aperçu <i class="fa-solid fa-thumbs-up"></i></button>`;break;
        case "Opération" : button = `<button onclick="According('${leave._id}','${leave.m_code}','${leave.type}','${leave.duration}', \`${escapedMotif(leave.motif)}\`, '${leave.date_start}', '${leave.date_end}', '${leave.hour_begin}', '${leave.hour_end}')" class="btn btn-sm btn-success btn-response  mx-3">Acceptée <i class="fa-solid fa-thumbs-up"></i></button>
                                     <button onclick="Declined('${leave._id}','${leave.m_code}')" class="btn btn-sm btn-danger btn-response">Refusée <i class="fa-solid fa-ban"></i></button>`;break;
        case "Opération" : button = `<button onclick="According('${leave._id}','${leave.m_code}','${leave.type}','${leave.duration}', \`${escapedMotif(leave.motif)}\`, '${leave.date_start}', '${leave.date_end}', '${leave.hour_begin}', '${leave.hour_end}')" class="btn btn-sm btn-success btn-response  mx-3">Acceptée <i class="fa-solid fa-thumbs-up"></i></button>
                                     <button onclick="Declined('${leave._id}','${leave.m_code}')" class="btn btn-sm btn-danger btn-response">Refusée <i class="fa-solid fa-ban"></i></button>`;break;
        case "Admin": case "Gerant": button = `${renderPiece(leave)}
                                 <button onclick="According('${leave._id}','${leave.m_code}','${leave.type}','${leave.duration}', \`${escapedMotif(leave.motif)}\`, '${leave.date_start}', '${leave.date_end}', '${leave.hour_begin}', '${leave.hour_end}')" class="btn btn-sm btn-success btn-response  mx-3">Acceptée <i class="fa-solid fa-thumbs-up"></i></button>
                                 <button onclick="Declined('${leave._id}','${leave.m_code}')" class="btn btn-sm btn-danger btn-response">Refusée <i class="fa-solid fa-ban"></i></button>`;break;
        case "Gerant" : button = `<button onclick="According('${leave._id}','${leave.m_code}','${leave.type}','${leave.duration}', \`${escapedMotif(leave.motif)}\`, '${leave.date_start}', '${leave.date_end}', '${leave.hour_begin}', '${leave.hour_end}')" class="btn btn-sm btn-success btn-response  mx-3">Acceptée <i class="fa-solid fa-thumbs-up"></i></button>`;break;
        default : "" 
    }
    return button

    function renderPiece(leave){
        if (leave.piece == ""){
            return `<button onclick="addPiece('${leave._id}')" class="btn btn-sm btn-secondary btn-response">Pièce Justificative <i class="fa-solid fa-paperclip"></i></button>`
        }
        else {
            
            return `<i id="fileOk"  class="fa-solid fa-file-circle-check fa-xl file-ok mx-1 mt-3"></i><button onclick="seePiece('${leave._id}','${leave.piece}','${leave.m_code}','${leave.date_start}','${leave.date_end}')" class="btn btn-sm btn-secondary btn-response">Pièce Justificative <i class="fa-solid fa-paperclip"></i></button>`;
        }
    }
}

function renderButtonNoDenied(role,leave){
    var button = ""
    switch(role){
        case "Surveillant" : button = `<button onclick="According('${leave._id}','${leave.m_code}','${leave.type}','${leave.duration}', \`${escapedMotif(leave.motif)}\`, '${leave.date_start}', '${leave.date_end}', '${leave.hour_begin}', '${leave.hour_end}')" class="btn btn-sm btn-success btn-response  mx-3">Aperçu <i class="fa-solid fa-thumbs-up"></i></button>`;break;
        case "Opération" : button = `<button onclick="According('${leave._id}','${leave.m_code}','${leave.type}','${leave.duration}', \`${escapedMotif(leave.motif)}\`, '${leave.date_start}', '${leave.date_end}', '${leave.hour_begin}', '${leave.hour_end}')" class="btn btn-sm btn-success btn-response  mx-3">OK pour moi <i class="fa-solid fa-thumbs-up"></i></button>
                                     <button onclick="Declined('${leave._id}','${leave.m_code}')" class="btn btn-sm btn-danger btn-response">Réfuser <i class="fa-solid fa-ban"></i></button>`;break;
        case "Admin": case "Gerant": button = `${renderPiece(leave)}
                                 <button onclick="According('${leave._id}','${leave.m_code}','${leave.type}','${leave.duration}', \`${escapedMotif(leave.motif)}\`, '${leave.date_start}', '${leave.date_end}', '${leave.hour_begin}', '${leave.hour_end}')" class="btn btn-sm btn-success btn-response  mx-3">Approuver <i class="fa-solid fa-thumbs-up"></i></button>
                                 <button disabled onclick="Declined('${leave._id}','${leave.m_code}')" class="btn btn-sm btn-danger btn-response">Réfuser <i class="fa-solid fa-ban"></i></button>`;break;
        case "Gerant" : button = `<button onclick="According('${leave._id}','${leave.m_code}','${leave.type}','${leave.duration}', \`${escapedMotif(leave.motif)}\`, '${leave.date_start}', '${leave.date_end}', '${leave.hour_begin}', '${leave.hour_end}')" class="btn btn-sm btn-success btn-response  mx-3">OK pour moi <i class="fa-solid fa-thumbs-up"></i></button>`;break;
        default : "" 
    }
    return button

    function renderPiece(leave){
        if (leave.piece == ""){
            return `<button onclick="addPiece('${leave._id}')" class="btn btn-sm btn-secondary btn-response">Pièce Justificative <i class="fa-solid fa-paperclip"></i></button>`
        }
        else {
            
            return `<i id="fileOk"  class="fa-solid fa-file-circle-check fa-xl file-ok mx-1 mt-3"></i><button onclick="seePiece('${leave._id}','${leave.piece}','${leave.m_code}','${leave.date_start}','${leave.date_end}')" class="btn btn-sm btn-secondary btn-response">Pièce Justificative <i class="fa-solid fa-paperclip"></i></button>`;
        }
    }
}
function convertDate(given){
    return moment(given).format("DD/MM/YYYY")
}
function calcul_timediff_absencetl(startTime, endTime) {
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
        return hours_fictif + "h " + minutes_fictif + " mn";
      }
    }
    else {
      return "heure non défini"
    }
  }
function dateDiffers(created, now) {
        created = moment(created,"DD/MM/YYYY HH:mm:ss");
        var endings = moment(now, "DD/MM/YYYY HH:mm:ss");
        var duration = moment.duration(endings.diff(created));
        var hoursFictif = duration.asHours();
        var dayNumber = 0
        var stringTime = ""
        if (hoursFictif > 24){
            while(hoursFictif > 24){
                dayNumber ++;
                hoursFictif = hoursFictif - 24
            }
            if (hoursFictif > 0){
                return stringTime = parseInt(dayNumber) + " jour(s) " + parseInt(hoursFictif) + " heure(s)"
            }
            else {
                return stringTime = parseInt(dayNumber) + " jour(s) "
            }
        }
        else if(hoursFictif < 1){
           return stringTime = parseInt(duration.asMinutes()) + " minute(s)"
        }
        else {
            return stringTime = parseInt(hoursFictif) + " heure(s)"
        }
  }

function According(id,code,type,duration, motif, datestart, dateend, hourBegin, hourEnd){
    // method to disable field in array
    const disable = arr => arr.map(id => $(`#${id}`).prop('disabled', true));
    const appr = $(`#val-${id}`).val();
    const misyGerant = appr.split('|').includes(GerantId);

    userActive = users.find(user => user.m_code == code);
    if (role == 'Gerant' ){
        $("#typeLeave").val(type);
        $("#orderCheck").hide();
        $("#title").text("Le type de congé décidé par la ressource humaine est:");

        if(+duration === 0.25) {
            $('#quart').prop('checked', true);
            $('#begin').val(hourBegin);
            $('#end').val(hourEnd);
            $('#hour_absence').attr('class', 'd-flex top_down');
        } else if (+duration === 0.5) {
            $('#demi').prop('checked', true);
        } else if (+duration === 1) {
            $('#one').prop('checked', true);
        }
        $('#datestart').val(datestart);
        $('#dateend').val(dateend);
        $("#nbr-day").val(duration);
        $("#motif-input").val(motif);
        // disable fields
        disable(['one', 'demi', 'quart', 'datestart', 'dateend', 'motif-input', 'typeLeave', 'end', 'begin', 'nbr-day']);
        
    }
    else {
        $('#typeLeave').val("");
        $("#motif-input").val(motif);
        $("#datestart").val(datestart);
        $("#dateend").val(dateend);
        $("#default-nbr-day").val(duration);
        $("#nbr-day").val(duration);
        
        var typeL = $('#typeLeave').val();
        console.log("typeL", typeL);
        $('#nbr-day').on('change', () => {
            let nDuration = parseFloat($('#nbr-day').val())
            console.log('ato', userActive.leave_stat)
            if ($('#typeLeave').val() == "Congé Payé" || $('#typeLeave').val() == ""){
                renderSolde(code,userActive.leave_taked,userActive.remaining_leave,nDuration,userActive.leave_stat,userActive.save_at,typeL);
            }
    
        });
    }
    idActive = id;
    // userActive = users.find(user => user.m_code == code);
    $("#codeAccept").text(`Voulez vous vraiment accepter l'absence de ${code}`)
    $("#project").html(renderProject(userActive.project));
    duration = parseFloat(duration)
    var typeL = $('#typeLeave').val();
    console.log("typeL", typeL);
    if (role == "Admin"){
        reset()
        renderSolde(code,userActive.leave_taked,userActive.remaining_leave,duration,userActive.leave_stat,userActive.save_at,typeL);
        setNumberPermission(code)
    }
    $("#ModalAccord").show();
    $('#modal-duration').val(duration);

    
    if (misyGerant) {
        $("#orderCheck").attr('hidden', '');
        $("#sayYes").prop('checked', true);
    } else {
        $("#orderCheck").removeAttr('hidden', '');
        $("#sayYes").prop('checked', false);
    }

}
function Declined(id,code){
    idActive = id;
    $("#codeDecline").text(`Veuilez ecrire en dessous la raison du refus d'absence de ${code}`);
    $("#reason").val('');
    $("#ModalDecline").show();
}
function closeModal(){
    $("#ModalAccord").hide();
    $("#ModalDecline").hide();
}
function renderProject(given){
    var string  = "";
    given = given.split("/")
    given.sort(function(a, b) {
        return a.localeCompare(b);
    });
    if (given.length <= 1 ){
        string += `<div class="project mb-1">
        ${given}
    </div>`
    }
    else {
        given.forEach(element => {
            string += `<div class="col-md-6"><div class="project mb-1">
        ${element}
      </div></div>`
        });
    }
    return string
}
function Approve(){
    $("#waitingApprove").css('opacity','1')

    let start = $('#datestart').val();
    let end = $('#dateend').val();

    $.ajax({
        url:"/requestAnswer",
        method:"POST",
        data:{id:idActive,response:true,reason:"", datestart: start, dateend: end},
        success: function(res) {
            UpdateRequest();
            $("#waitingApprove").css('opacity','0')
            closeModal();
            $('#notification').text("Requête accepter avec success");
            $("#notification").attr("class","notice-success")
            $('#notification').show();
            setTimeout(() => {
                $('#notification').hide();
            }, 5000);
        }   
    })
}


function date_diff(starting, ending) {
    var startings = moment(moment(starting)).format("YYYY-MM-DD");
    var endings = moment(ending, "YYYY-MM-DD");
    var duration = moment.duration(endings.diff(startings));
    var dayl = duration.asDays();
    return parseInt(dayl.toFixed(0));
}

function ApproveLast(){
    order = $('#sayYes').is(":checked");
    var checking = 'n';
    let rmType = $('#rmType').val();
    // quart
    checking = $('#quart').is(':checked') ? 0.25 : checking;
    let begin = $('#begin').val();
    let end = $('#end').val();
    //demi
    checking = $('#demi').is(':checked') ? 0.5 : checking;
    checking = $('#one').is(':checked') ? 1 : checking;

    let newMotif = $('#motif-input').val();

    let startDate = $('#datestart').val();
    let endDate = $('#dateend').val();
    let leaveType = $('#typeLeave').val();

    // leave duration
    let lDuration = parseFloat($('#nbr-day').val());

    console.log(checking)
    // condition
    if (checking !== 'n') {
        if (checking === 0.25) {
            // required infos
            if (startDate === '' || endDate === '' ||
                begin === '' || end === ''
            ) {
                return alert("Veuillez remplir correctement toutes les informations nécessaires!");
            } else {
                // do the update
            }
        } else {
            // required infos
            if (startDate === '' || endDate === '') {
                return alert("Veuillez remplir correctement toutes les informations nécessaires!");
            } else {
                // do the update
            }
        }
        // calcul duration
        // lDuration -= checking;

    } else { // checking value eq "n"
        if (startDate === '') {
            return alert("Veuillez remplir correctement toutes les informations nécessaires!");
        } else if (date_diff(startDate, endDate) < 0) {
            return alert("Erreur de différence entre la date de début et celle de fin!");
        } else {
            // do the update
            
        }
    }
    // nouvelles start et end dates
    var newStartDate = $('#datestart').val();
    var newEndDate = $('#dateend').val();



    if (role == "Admin"){
        if ($('#typeLeave').val() != ""){
            $("#waitingApprove").css('opacity','1')
            var data = {
                id:idActive,
                response:true,
                checking: checking,
                newduration: lDuration,
                newStartTime: begin,
                newEndTime: end,
                newStartDate: newStartDate,
                newEndDate: newEndDate,
                newStartDate: newStartDate,
                newEndDate: newEndDate,
                reason:"",
                typeleave: $('#typeLeave').val(),
                order:order,
                exceptType: permissionType ? $("#exceptType").val(): "",
                motif: changeMotif && rmType !== '' ?  rmType :  newMotif
            };

            // changeMotif ? "" : delete data.motif;
                $.ajax({
                    url:"/requestAnswer",
                    method:"POST",
                    data:data,
                    success: function(data) {
                        if (data.type.includes("Congé Payé")){
                            let indexUser = users.findIndex(element => element.m_code == data.m_code);
                            if (indexUser !== -1) {
                                users[indexUser].leave_taked = users[indexUser].leave_taked - data.duration;
                                users[indexUser].remaining_leave = users[indexUser].remaining_leave - data.duration;
                            }
                        }
                        
                        data.type.includes("Permission exceptionelle") ? allPermission.push({m_code:data.m_code,exceptType:data.exceptType,duration:data.duration}) : "";
                        if (order){
                            // vérifier si le congé a été traité par rh (type !== "")
                            // ou status de la demande n'est pas réfusé (status !== "declined")
                            if (data.type === '' && data.status !== 'declined') return;

                            $.ajax({
                                url:"/takeleave",
                                method:"POST",
                                data:{
                                    code:data.m_code,
                                    type:data.type,
                                    exceptType:data.exceptType,
                                    leavestart:data.date_start,
                                    leaveend:data.date_end,
                                    begin:data.hour_begin,
                                    end:data.hour_end,
                                    court:data.duration,
                                    motif:data.motif,
                                    idRequest:data._id
                                },
                                success: function(res) {
                                    UpdateRequest();
                                    $("#waitingApprove").css('opacity','0')
                                    closeModal();
                                    $('#notification').text("Requête approuver par ordre du gerant");
                                    $("#notification").attr("class","notice-success")
                                    $('#notification').show();
                                    setTimeout(() => {
                                        $('#notification').hide();
                                    }, 5000);
                                }   
                            })
                        }
                        else {
                            UpdateRequest();
                            $("#waitingApprove").css('opacity','0')
                            closeModal();
                            $('#notification').text("Requête accepter avec success");
                            $("#notification").attr("class","notice-success")
                            $('#notification').show();
                            setTimeout(() => {
                                $('#notification').hide();
                            }, 5000);
                        }
                        reset();
                    }   
                    
                })
           }
           else {
            $('#typeLeave').css('borderColor','red')
           }
    }
    else {
     registerLeave()
    } 
 }
function Decline(){
    if ($("#reason").val().trim().length > 0){
        $("#waitingDecline").css('opacity','1')
        $.ajax({
            url:"/requestAnswer",
            method:"POST",
            data:{id:idActive,response:false,reason:$("#reason").val()},
            success: function(res) {
                UpdateRequest();
                $("#waitingDecline").css('opacity','0')
                closeModal();
                $('#notification').text("La requête a été refuser");
                $("#notification").attr("class","notice-denied")
                $('#notification').show();
                setTimeout(() => {
                    $('#notification').hide();
                }, 5000);
            }   
       })
    } 
    else {
        $("#reason").attr("class","border-red")
    }  
   
}
function approvingList(all, id){
    var lists = "";
    all.forEach(element => {
        if (element.approbation) {
            lists += `<span><i class="fa-solid fa-circle-check""></i> ${element.user.usuel}</span>`
        } else {
            lists += `<span><i  style="color: red;" class="fa-solid fa-times-circle"></i> ${element.user.usuel}</span>`
        }
    });
    
    return `<div class="d-flex approving-list">${lists}</div> <input type="hidden" id="val-${id}" value="${all.map(u => u.user._id).join('|')}"  />`
}
function registerLeave(){
    $("#waitingApprove").css('opacity','1')
    $.ajax({
        url:"/requestAnswer",
        method:"POST",
        data:{id:idActive,response:true,reason:"",typeleave:$('#typeLeave').val()},
        success: function(data) {
            $.ajax({
                url:"/takeleave",
                method:"POST",
                data:{code:data.m_code,type:data.type,leavestart:data.date_start,leaveend:data.date_end,
                      begin:data.hour_begin,end:data.hour_end,court:data.duration,motif:data.motif,idRequest:data._id},
                success: function(res) {
                    UpdateRequest();
                    $("#waitingApprove").css('opacity','0')
                    closeModal();
                    $('#notification').text("La requête a été valider");
                    $("#notification").attr("class","notice-success")
                    $('#notification').show();
                    setTimeout(() => {
                        $('#notification').hide();
                    }, 5000);
                }   
           })
        }   
   })
}
function checkboxControl(cb, check){
    if (check =="yes"){
        $('#sayNo').prop('checked', false);
        order = true;
    }
    else {
        $('#sayYes').prop('checked', false);
        order = false;
    }
}
function seePiece(id,piece,code,start,end){
    $("#ModalPiece").show();
    $('#who').text(`Pièce jointe de ${code} pour le congé du ${moment(start).format("DD/MM/YYYY")} au ${moment(end).format("DD/MM/YYYY")}`)
    renderPiece(piece);
    idForFile = id;
}
function closePiece(){
    $("#ModalPiece").hide();
    $("#PieceContent").html("")
}
function renderPiece(piece){
    $("#PieceContent").html(`<object class="object-content mt-3 overflow-auto" data="../PieceJointe/${piece}">
  </object>`)
}
function addPiece(id){
    idForFile = id;
    $("#join").click();
}
$('#typeLeave').on('change', function () {
    const leaveType = $('#typeLeave').val();
    $("#typeLeave").css('borderColor', '#5AC4EC');

    const actions = {
        "Permission exceptionelle": { permission: true, cp: ["ndeduire", true], rm: false },
        "Congé Payé": { permission: false, cp: ["deduire", true], rm: false },
        "Repos Maladie": { permission: false, cp: ["ndeduire", true], rm: true },
        "Consultation médicale": { permission: false, cp: ["ndeduire", true], rm: false },
        "Congé de maternité": { permission: false, cp: ["ndeduire", true], rm: false },
        "Assistance maternelle": { permission: false, cp: ["ndeduire", true], rm: false },
        "Récupération": { permission: false, cp: ["ndeduire", true], rm: false },
        "Congé sans solde": { permission: false, cp: ["ndeduire", true], rm: false },
        "Absent": { permission: false, cp: ["ndeduire", true], rm: false },
        "Mise a Pied": { permission: false, cp: ["ndeduire", true], rm: false },
        "Absence Injustifiée": { permission: false, cp: ["ndeduire", true], rm: false },
        "": { permission: false, cp: ["deduire", false], rm: false },
        "default": { permission: false, cp: ["deduire", true], rm: false }
    };

    const currentAction = actions[leaveType] || actions['default'];
    
    activatePermission(currentAction.permission);
    activateCp(currentAction.cp[1], currentAction.cp[0]);
    activateRm(currentAction.rm);
});

// $('#typeLeave').on('change', function () {
//     const leaveType = $('#typeLeave').val();
//     $("#typeLeave").css('borderColor','#5AC4EC')
//     if ($('#typeLeave').val() == "Permission exceptionelle"){
//         activatePermission(true)
//         activateCp(true, "ndeduire");
//         activateRm(false)
//     }
//     else if ($('#typeLeave').val() == "Congé Payé"){
//         activatePermission(false)
//         activateCp(true, "deduire");
//         activateRm(false)
//     }
//     else if ($('#typeLeave').val() == "Repos Maladie"){
//         activatePermission(false)
//         activateCp(true, "ndeduire");
//         activateRm(true)
//     }
//     else if ($('#typeLeave').val() == ""){
//         activatePermission(false)
//         activateCp(false, "deduire");
//         activateRm(false)
//     }
//     else if ($('#typeLeave').val() == "Consultation médicale") {
//         activatePermission(false)
//         activateCp(true, "ndeduire");
//         activateRm(false)
//     }
//     else if ($('#typeLeave').val() == "Congé de maternité") {
//         activatePermission(false)
//         activateCp(true, "ndeduire");
//         activateRm(false)
//     }
//     else if ($('#typeLeave').val() == "Assistance maternelle") {
//         activatePermission(false)
//         activateCp(true, "ndeduire");
//         activateRm(false)
//     }
//     else if ($('#typeLeave').val() == "Récupération") {
//         activatePermission(false)
//         activateCp(true, "ndeduire");
//         activateRm(false)
//     }
//     else if ($('#typeLeave').val() == "Congé sans solde") {
//         activatePermission(false)
//         activateCp(true, "ndeduire");
//         activateRm(false)
//     }
//     else if ($('#typeLeave').val() == "Absent") {
//         activatePermission(false)
//         activateCp(true, "ndeduire");
//         activateRm(false)
//     }
//     else if ($('#typeLeave').val() == "Mise a Pied") {
//         activatePermission(false)
//         activateCp(true, "ndeduire");
//         activateRm(false)
//     }
//     else if ($('#typeLeave').val() == "Absence Injustifiée") {
//         activatePermission(false)
//         activateCp(true, "ndeduire");
//         activateRm(false)
//     }
//     else{
//         activatePermission(false)
//         activateCp(true, "deduire");
//         activateRm(false)
//     }
// });
$('#join').on('change', function (event) {
    var selectedFile = event.target.files[0];
    if (selectedFile){
        var joinPiece = new FormData();
        joinPiece.append("join",selectedFile);
        joinPiece.append("idLeave",idForFile)
        $.ajax({
            url: "/joinFileLeave",
            method: "POST",
            cache: false,
            contentType: false,
            processData: false,
            data: joinPiece,
            success: function (res) {
                if (res.status == "Success"){
                    $("#notification").attr("class","notice-success");
                    $("#notification").text("Pièce jointe attacher avec succès");
                    $("#notification").show();
                    seePiece(res.idLeave,res.fileName,res.code,res.start,res.end);
                    UpdateRequest();
                    setTimeout(() => {
                        $("#notification").hide();
                    }, 5000);
                }
                else {
                    $("#sendRequest").prop("disabled",false);
                    $('#loading').hide();
                    $("#notification").attr("class","notice-denied");
                    $("#notification").text("Une erreur est survenue lors de l'upload du fichier");
                    $("#notification").show();
                    setTimeout(() => {
                        $("#notification").hide();
                    }, 5000);
                }
               
            }
        })
    }
 })
 function replacePiece(){
    addPiece(idForFile);
 }
 //Permission exceptionelle
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
        changeMotif = true;
        $("#typeRm").attr("class","d-flex justify-content-between")
    }
    else {
        changeMotif = false;
        $("#typeRm").attr("class","d-none")
    }
 }
 // Congé payé
 function activateCp(choice, typeL){
    // var typeL = $('#typeLeave').val();
    // console.log("typeL", typeL);
    let nDuration
    if (typeL == "ndeduire") {
        nDuration = 0
    }else{
         nDuration = parseFloat($('#nbr-day').val())

    }
    renderSolde(userActive.code,userActive.leave_taked,userActive.remaining_leave,nDuration,userActive.leave_stat,userActive.save_at,typeL);

    if (choice){
        $("#typeCp").attr("class","d-flex justify-content-between")
    }
    else {
        $("#typeCp").attr("class","d-none")
    }
 }
 function renderSolde(code,acc,rest,duration,auth,save,typeL){
    
    
    var html = `
    <div>
                          <label class="text-center">Status / solde de ${code}</label>
                      </div>
                      <div class="d-flex justify-content-between gap-5">
                        <div class="d-flex flex-row text-center gap-2">
                          <label>${moment().add(-1,"years").format("YYYY")}: ${rest}</label><label>${moment().format("YYYY")}: ${(acc - rest)}</label>
                        </div>
                        <div class="d-flex flex-row text-center">
                          <label>Reste après autorisation: ${(acc - duration)}</label>  
                        </div>
                      </div>
                      ${auth == "n" ? `<div class="d-flex text-center">
                      <label class="warning">Non autorisée qu'à partir de ${moment(save).add(1,"years").locale("Fr").format("MMMM YYYY")} </label>  
                    </div>` : ""}
    `
    $("#leaveLeft").html(html)
 }
 $("#exceptType").on('change' ,function (){
    if ($("#exceptType").val() != "Férié"){
        permissionExist($("#exceptType").val(),userActive.m_code)
    }
    else {
        $("#alertPermission").attr("class","d-none")
    }
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
 function reset(){
    order = false;
    seeFile = true;
    idForFile = "";
    $('#sayYes').prop('checked', false);
    $('#sayNo').prop('checked', true);
    $("#typeLeave").val("");
    $("#exceptType").val("Férié");
    $("#rmType").val("");
    activatePermission(false)
    activateCp(false);
    activateRm(false)
 }


$('.switch-button').each((i, btn) => {
    $(btn).click(() => {
        // hide all container
        $('#content-allRequest > div').each((_, div) => $(div).attr('hidden', ''));
        // activate button
        $('.switch-button').each((_, b) => $(b).removeClass('active-btn'));
        $(btn).addClass('active-btn');
        let targetId = $(btn).attr('data-target');
        $(targetId).removeAttr('hidden')
    })
})

// var checking;
function dissapearq(input) {
    if (input.checked) {
        $('#hour_absence').attr('class', "d-flex top_down");
        $('#dateend').attr('hidden', '');
        $('#demi').prop('checked', false);
        $('#one').prop('checked', false);
        checking = 0.25;
        $('#nbr-day').val(checking);
    }
    else {
        $('#hour_absence').attr('class', "d-flex hiding-hour");
        $('#hour_absence').attr('class', "hide top_down");
        $('#dateend').removeAttr('hidden', '');
        checking = "n";
        $('#nbr-day').val($('#default-nbr-day').val());
    }
}

function dissapeard(input) {
    if (input.checked) {
        $('#dateend').attr('hidden', '');
        $('#quart').prop('checked', false);
        $('#one').prop('checked', false);
        $('#hour_absence').attr('class', "hide top_down");
        checking = 0.5;
        $('#nbr-day').val(checking);
    }
    else {
        $('#dateend').removeAttr('hidden', '');
        checking = "n";
        $('#nbr-day').val($('#default-nbr-day').val());
    }
}

function dissapearo(input) {
    if (input.checked) {
        $('#quart').prop('checked', false);
        $('#demi').prop('checked', false);
        $('#dateend').attr('hidden', '');
        $('#hour_absence').attr('class', "hide top_down");
        checking = 1;
        $('#nbr-day').val(checking);
    } else {
        $('#dateend').removeAttr('hidden', '');
        checking = "n";
        $('#nbr-day').val($('#default-nbr-day').val());
    }
}

$('#global-search').on('input',function() {
    $('#allRequest').html('');
    const key = $(this).val().toUpperCase();
    if (!key) {
        // hide all request container
        $('#allRequest').attr('hidden', '');
        return;
    }
    const children = [
        $("#lowRequest").children().clone().toArray(),
        $("#mediumRequest").children().clone().toArray(),
        $("#highRequest").children().clone().toArray()
    ].flat().filter(e => $(e).attr('key'));

    const filtered = children.filter(c => {
        return $(c).attr('key').includes(key)
    });

    $('#allRequest').append(`<p style="grid-column: span 2; text-align:center;">Résultats de recherche: ${key}</p>`);
    $('#allRequest').append(filtered.length === 0 ? '<p style="grid-column: span 2; text-align:center; text-transform: uppercase;">Aucunes demandes trouvées</p>' : filtered);
    $('#allRequest').append(`<p  style="grid-column: span 2; text-align:center;">------------------Fin de resultats------------------</p>`);
    $('#allRequest').removeAttr('hidden');

});

$("#btnListGerant").on("click", function () {
    $('#gerantList').removeAttr('hidden');
})

