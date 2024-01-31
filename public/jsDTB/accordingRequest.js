
var myRequestContent = "";

var allRequest = [];
var emergencyRequest = [];
var normalRequest = [];
function UpdateRequest(){
    $.ajax({
        url:"/allRequest",
        method:"POST",
        data:{},
        success: function(res) {
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
                            <p id="codeUser" class="code-text">${leave.m_code}</p>
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
                            <button onclick="According('${leave._id}')" class="btn btn-sm btn-success">ACCORDER <i class="fa-solid fa-thumbs-up"></i></button>
                            <button onclick="Declined('${leave._id}')" class="btn btn-sm btn-danger mx-3">REFUSER <i class="fa-solid fa-ban"></i></button>
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