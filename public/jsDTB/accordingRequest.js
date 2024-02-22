
var myRequestContent = "";
var idActive = "";
var allRequest = [];
var emergencyRequest = [];
var normalRequest = [];
var order = false;
var seeFile = true;
var idForFile = "";
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
            renderAllRequest(allRequest);
            $('#allRequest').html(myRequestContent);
        }   
   })
}
function renderAllRequest(Leave){
    Leave.forEach(leave => {
        myRequestContent +=`
    <div id="${leave._id}" class="content-leave">
                        <div class="code-person">
                        <div>
                        <p id="codeUser" class="code-text">${leave.m_code}</p>
                        <p class='text-duration'>${leave.duration} jour(s)</p>
                        </div>
                            
                        </div>
                        <div class="leave-infos">
                            <small id="since" class="text-end"><b>${dateDiffers(leave.datetime,moment().format("DD/MM/YYYY HH:mm:ss"))}</b></small>
                            <p id="motif" class="text-center">${leave.motif}</p>
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
                        ${approvingList(leave.validation)}
                            <div class="d-flex justify-content-end">
                                ${renderButton(role,leave)}
                            </div>
                        </div>
                      </div>
    `
    });
    
}
UpdateRequest();
function renderButton(role,leave){
    var button = ""
    switch(role){
        case "Surveillant" : button = `<button onclick="According('${leave._id}','${leave.m_code}','${leave.type}')" class="btn btn-sm btn-success btn-response  mx-3">Aperçu <i class="fa-solid fa-thumbs-up"></i></button>`;break;
        case "Opération" : button = `<button onclick="According('${leave._id}','${leave.m_code}','${leave.type}')" class="btn btn-sm btn-success btn-response  mx-3">OK pour moi <i class="fa-solid fa-thumbs-up"></i></button>
                                     <button onclick="Declined('${leave._id}','${leave.m_code}')" class="btn btn-sm btn-danger btn-response">Réfuser <i class="fa-solid fa-ban"></i></button>`;break;
        case "Admin" : button = `${renderPiece(leave)}
                                 <button onclick="According('${leave._id}','${leave.m_code}','${leave.type}')" class="btn btn-sm btn-success btn-response  mx-3">Approuver <i class="fa-solid fa-thumbs-up"></i></button>
                                 <button onclick="Declined('${leave._id}','${leave.m_code}')" class="btn btn-sm btn-danger btn-response">Réfuser <i class="fa-solid fa-ban"></i></button>`;break;
        case "Gerant" : button = `<button onclick="According('${leave._id}','${leave.m_code}','${leave.type}')" class="btn btn-sm btn-success btn-response  mx-3">OK pour moi <i class="fa-solid fa-thumbs-up"></i></button>`;break;
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

function According(id,code,type){
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
    var userActive = users.find(user => user.m_code == code);
    $("#codeAccept").text(`Voulez vous vraiment accepter l'absence de ${code}`)
    $("#project").html(renderProject(userActive.project))
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
    if (given.length <= 1 ){
        string += `<div class="project mb-1">
        ${given}
      </div>`
    }
    else {
        given.forEach(element => {
            string += `<div class="project mb-1">
        ${element}
      </div>`
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
    if (role == "Admin"){
        if ($('#typeLeave').val() != ""){
            $("#waitingApprove").css('opacity','1')
                $.ajax({
                    url:"/requestAnswer",
                    method:"POST",
                    data:{id:idActive,response:true,reason:"",typeleave:$('#typeLeave').val(),order:order},
                    success: function(data) {
                        if (order){
                            $.ajax({
                                url:"/takeleave",
                                method:"POST",
                                data:{code:data.m_code,type:data.type,leavestart:data.date_start,leaveend:data.date_end,
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
    if ($("#reason").val() != ""){
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
$("#typeLeave").change(() => {
    $("#typeLeave").css('borderColor','#5AC4EC')
})
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
function checkboxControl(check){
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
    $("#PieceContent").html(`<object class="d-flex justify-content-center align-align-items-baseline mt-3 w-100 overflow-auto" height="600px" data="../PieceJointe/${piece}">
  </object>`)
}
function addPiece(id){
    idForFile = id;
    $("#join").click();
}
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