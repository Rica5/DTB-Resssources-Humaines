
var myRequestContent = "";
var idActive = "";
var allRequest = [];
var emergencyRequest = [];
var normalRequest = [];
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
    <div class="content-leave">
                        <div class="col-md-4 code-person">
                        <div>
                        <p id="codeUser" class="code-text">${leave.m_code}</p>
                        <p class='text-duration'>${leave.duration} jour(s)</p>
                        </div>
                            
                        </div>
                        <div class="col-md-8 leave-infos">
                          <small id="since" class="text-end"><b>${dateDiffers(leave.datetime,moment().format("DD/MM/YYYY HH:mm:ss"))}</b></small>
                          <p id="motif" class="text-center">${leave.motif}</p>
                          <div class="row mt-2">
                            <div class="col-md-6">
                                <div class="text-center">
                                    <i class="fa-solid fa-calendar text-center"></i>
                                </div>
                                <p id="startDate" class="mt-2 text-center">Date début : ${convertDate(leave.date_start)}</p>
                                <p id="endDate" class="text-center">Date fin : ${convertDate(leave.date_end)}</p>
                            </div>
                            <div class="col-md-6">
                                <div class="text-center">
                                    <i class="fa-solid fa-clock"></i>
                                </div>
                                <p id="startTime" class="mt-2 text-center">Heure début : ${leave.hour_begin}</p>
                                <p id="endTime" class="text-center">Heure fin : ${leave.hour_end}</p>
                            </div>
                        </div>
                        <div class="d-flex justify-content-end">
                            <button onclick="According('${leave._id}','${leave.m_code}')" class="btn btn-sm btn-success btn-response">ACCORDER <i class="fa-solid fa-thumbs-up"></i></button>
                            <button onclick="Declined('${leave._id}','${leave.m_code}')" class="btn btn-sm btn-danger btn-response mx-3">REFUSER <i class="fa-solid fa-ban"></i></button>
                        </div>
                        </div>
                      </div>
    `
    });
    
}
UpdateRequest();
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

function According(id,code){
    idActive = id;
    var userActive = users.find(user => user.m_code == code);
    $("#codeAccept").text(`Voulez vous vraiment accepter l'absence de ${code}`)
    $("#project").html(renderProject(userActive.project))
    $("#ModalAccord").show();
}
function Declined(id,code){
    idActive = id;
    $("#codeDecline").text(`Veuilez ecrire en dessous le refus de l'absence de ${code}`);
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
            $('#notification').text("Requête refuser");
            $('#notification').show();
            setTimeout(() => {
                $('#notification').hide();
            }, 3000);
        }   
   })
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
                $('#notification').show();
                setTimeout(() => {
                    $('#notification').hide();
                }, 3000);
            }   
       })
    } 
    else {
        $("#reason").attr("class","border-red")
    }  
   
}