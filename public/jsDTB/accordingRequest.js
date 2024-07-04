
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

            console.log(sortedAsc(mediumRequests))
        }   
   })
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
function renderAllRequest(Leave){
    let mappedLeave = Leave.map(leave => {
        userActive = users.find(user => user.m_code == leave.m_code)

        
      let code = leave.m_code;
      let acc = userActive.leave_taked;
      let rest = userActive.remaining_leave
      let duration = leave.duration
      let auth = userActive.leave_stat
      let save = userActive.save_at
    return `
    <div id="${leave._id}" class="content-leave">
                        <div class="code-person p_${leave.leavePriority}">
                            <div>
                                <p id="codeUser" class="code-text">${leave.m_code}</p>
                                <p class='text-duration'>${leave.duration == 0.25 ? calcul_timediff_absencetl(leave.hour_begin,leave.hour_end) : 
                                isFloat(leave.duration) ? leave.duration.toString().split(".")[0] + " jr(s) " + calcul_timediff_absencetl(leave.hour_begin,leave.hour_end) : leave.duration + " jour(s)"}</p>
                                <div> 
                                <p class="priority">${leave.priorityValue}</p>
                                </div>
                            </div>
                        </div>
                        <div class="leave-infos">
                            <small id="since" class="text-end"><b>${dateDiffers(leave.datetime,moment().format("DD/MM/YYYY HH:mm:ss"))}</b></small>
                            <p id="motif" class="text-center">${leave.motif}</p>
                            <div class="date-heure">
                                <div class="ask-content">
                                    <h1>
                                        <i class="fa-solid fa-calendar"></i>
                                        Demandeur
                                    </h1>
                                    <div class="ask">
                                        <span>Nom: ${leave.nom}</span>
                                        <span>Shift: ${getShift(leave.m_code)}</span>
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
                                        <span>Reste après autorisation: ${(acc - duration)}</span>
                                    </div>
                                </div>
                        </div> `
                                 : ""
                            }
                        ${approvingList(leave.validation)}
                            <div class="d-flex justify-content-end">
                                ${renderButton(role,leave)}
                            </div>
                        </div>
                      </div>
    `
    });

    return mappedLeave.join('');
    
    return mappedLeave.join('');
}
UpdateRequest();
function isFloat(num) {
    // Check if the number has a fractional part
    return num % 1 !== 0;
}
function renderButton(role,leave){
    var button = ""
    switch(role){
        case "Surveillant" : button = `<button onclick="According('${leave._id}','${leave.m_code}','${leave.type}','${leave.duration}')" class="btn btn-sm btn-success btn-response  mx-3">Aperçu <i class="fa-solid fa-thumbs-up"></i></button>`;break;
        case "Opération" : button = `<button onclick="According('${leave._id}','${leave.m_code}','${leave.type}','${leave.duration}')" class="btn btn-sm btn-success btn-response  mx-3">OK pour moi <i class="fa-solid fa-thumbs-up"></i></button>
                                     <button onclick="Declined('${leave._id}','${leave.m_code}')" class="btn btn-sm btn-danger btn-response">Réfuser <i class="fa-solid fa-ban"></i></button>`;break;
        case "Admin" : button = `${renderPiece(leave)}
                                 <button onclick="According('${leave._id}','${leave.m_code}','${leave.type}','${leave.duration}')" class="btn btn-sm btn-success btn-response  mx-3">Approuver <i class="fa-solid fa-thumbs-up"></i></button>
                                 <button onclick="Declined('${leave._id}','${leave.m_code}')" class="btn btn-sm btn-danger btn-response">Réfuser <i class="fa-solid fa-ban"></i></button>`;break;
        case "Gerant" : button = `<button onclick="According('${leave._id}','${leave.m_code}','${leave.type}','${leave.duration}')" class="btn btn-sm btn-success btn-response  mx-3">OK pour moi <i class="fa-solid fa-thumbs-up"></i></button>`;break;
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

function According(id,code,type,duration){
    if (role == 'Gerant' ){
        $("#typeLeave").val(type);
        $("#typeLeave").prop("disabled",true);
        $("#orderCheck").hide();
        $("#title").text("Le type de congé décidé par la ressource humaine est:")
    }
    else {
        $('#typeLeave').val("")
    }
    idActive = id;
    userActive = users.find(user => user.m_code == code);
    $("#codeAccept").text(`Voulez vous vraiment accepter l'absence de ${code}`)
    $("#project").html(renderProject(userActive.project));
    duration = parseFloat(duration)
    if (role == "Admin"){
        reset()
        renderSolde(code,userActive.leave_taked,userActive.remaining_leave,duration,userActive.leave_stat,userActive.save_at);
        setNumberPermission(code)
    }
    $("#ModalAccord").show();
}
function Declined(id,code){
    idActive = id;
    $("#codeDecline").text(`Veuilez ecrire en dessous la raison du refus d'absence de ${code}`);
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
    $.ajax({
        url:"/requestAnswer",
        method:"POST",
        data:{id:idActive,response:true,reason:""},
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
function ApproveLast(){
    order = $('#sayYes').is(":checked");
    if (role == "Admin"){
        if ($('#typeLeave').val() != ""){
            $("#waitingApprove").css('opacity','1')
            var data = {id:idActive,response:true,reason:"",typeleave:$('#typeLeave').val(),order:order,
            exceptType: permissionType ? $("#exceptType").val(): "",motif:$("#rmType").val()}
            changeMotif ? "" : delete data.motif;
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
                            $.ajax({
                                url:"/takeleave",
                                method:"POST",
                                data:{code:data.m_code,type:data.type,exceptType:data.exceptType,leavestart:data.date_start,leaveend:data.date_end,
                                      begin:data.hour_begin,end:data.hour_end,court:data.duration,motif:data.motif,idRequest:data._id},
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
function approvingList(all){
    var lists = "";
    all.forEach(element => {
        lists += `<span><i class="fa-solid fa-circle-check"></i> ${element.user.usuel}</span>`
    });
    return `<div class="d-flex approving-list">${lists}</div>`
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
    $("#typeLeave").css('borderColor','#5AC4EC')
    if ($('#typeLeave').val() == "Permission exceptionelle"){
        activatePermission(true)
        activateCp(false);
        activateRm(false)
    }
    else if ($('#typeLeave').val() == "Congé Payé"){
        activatePermission(false)
        activateCp(true);
        activateRm(false)
    }
    else if ($('#typeLeave').val() == "Repos Maladie"){
        activatePermission(false)
        activateCp(false);
        activateRm(true)
    }
    else {
        activatePermission(false)
        activateCp(false);
        activateRm(false)
    }
})
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
 function activateCp(choice){
    if (choice){
        $("#typeCp").attr("class","d-flex justify-content-between")
    }
    else {
        $("#typeCp").attr("class","d-none")
    }
 }
 function renderSolde(code,acc,rest,duration,auth,save){
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
                      <label class="warning">Non autorisée qu'a partir de ${moment(save).add(1,"years").locale("Fr").format("MMMM YYYY")} </label>  
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