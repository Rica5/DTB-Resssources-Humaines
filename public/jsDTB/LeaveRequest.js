var PendingAndDecline = [];
var Approve = [];
var myRequestContent;
$("#makeRequest").click(() =>{
    $("#makeRequest").attr("class","switch-button active-btn")
    $("#myRequest").attr("class","switch-button mx-2")
    $("#myUpcoming").attr("class","switch-button")
    $("#container-none").hide()
    $("#container-request").hide()
    $("#container-upcoming").hide()
    $("#container-make").show()
})

$("#myRequest").click(() =>{
    $("#myRequest").attr("class","switch-button active-btn mx-2")
    $("#makeRequest").attr("class","switch-button")
    $("#myUpcoming").attr("class","switch-button")
    $("#container-none").hide()
    $("#container-request").show()
    $("#container-upcoming").hide()
    $("#container-make").hide()
    if (PendingAndDecline.length == 0){
        $("#container-none").show()
        $("#container-request").hide()
    }
})

$("#myUpcoming").click(() =>{
    $("#makeRequest").attr("class","switch-button")
    $("#myRequest").attr("class","switch-button mx-2")
    $("#myUpcoming").attr("class","switch-button active-btn")
    $("#container-none").hide()
    $("#container-request").hide()
    $("#container-upcoming").show()
    $("#container-make").hide()
    Approved(Approve);
})

$("#sendRequest").on('click', () => {
    var code = $("#code").text();
    var startDate = $("#startDate").val();
    var endDate = $("#endDate").val();
    var startTime = $("#startTime").val();
    var endTime = $("#endTime").val();
    var motif = $("#motif").val();
    var recovery = $("#recovery").val();
    var nb_jours = $("#dayNumber").text();
    $('#loading').show();
   $.ajax({
        url:"/makeRequest",
        method:"POST",
        data:{
            code:code,startDate:startDate,endDate:endDate,startTime:startTime,endTime:endTime,motif:motif,recovery:recovery
        },
        success: function(res) {
            UpdateRequest();
            $('#loading').hide();
            $("#notification").show();
            setTimeout(() => {
                $("#notification").hide();
            }, 3000);
        }
   })
    
});
function UpdateRequest(){
    $.ajax({
        url:"/MyRequest",
        method:"POST",
        data:{
            code:$("#code").text()
        },
        success: function(res) {
            PendingAndDecline = res.filter(leave => leave.status != "approved");
            Approve = res.filter(leave => leave.status == "approved");
            myRequestRender(PendingAndDecline)
        }   
   })
}
UpdateRequest();
function myRequestRender(data){
    myRequestContent = '<div class="row p-3">'
        var pendingNumber = 0;
        var declinedNumber = 0;
        var progressNumber = 0;
       
        data.forEach(element => {
            if (element.status == "pending"){
                renderMyRequest(element,"pending");
                pendingNumber ++;
            }
            else if (element.status == "declined"){
                renderMyRequest(element,"declined");
                declinedNumber ++;
            }
            else {
                renderMyRequest(element,"progress");
                progressNumber ++;
            }
        });
        myRequestContent += '</div>'
        $('#container-request').html(myRequestContent);
        $("#pending").text(pendingNumber)
        $("#declined").text(declinedNumber)
        $("#progress").text(progressNumber)
}
function Approved(data){
    if (data.length == 0){
        $("#container-none").show()
        $("#container-upcoming").hide()
    }
    else {
        var approvedNumber = 0;
        data.forEach(element => {
           
           approvedNumber++
        });
        $("#approved").text(approvedNumber)
    }
}
var allStat = {
    pending:"En attente",
    approved:"Approuver",
    declined:"Refuser",
    progress:"En traitement",
}
function renderMyRequest(Leave,stat){
    myRequestContent +=`
    <div class="col-md-6 p-1">
        <div class="card-list">
            <div class="col-md-12 leave-title-${stat}">
                <div class="d-flex align-items-center justify-content-center">
                    <i class="fa-solid fa-person-walking-luggage mx-2"></i> ${Leave.motif.substring(0,30)}...
                </div>
                ${stat == "pending" ? `<div class="action-field">
                <button class="btn btn-sm btn-secondary action"><i class="fa-solid fa-file-pen"></i></button> 
                <button class="btn btn-sm btn-secondary action ml-2"> <i class="fa-solid fa-square-xmark"></i></button>
            </div>` : ``} 
            </div>
            <div class="row mt-2">
                <div class="col-md-6">
                    <div class="text-center">
                        <i class="fa-solid fa-calendar text-center"></i>
                    </div>
                    <p class="mt-2 text-center">Date début : ${ moment(Leave.date_start).format("DD/MM/YYYY")}</p>
                    <p class="text-center">Date fin : ${moment(Leave.date_end).format("DD/MM/YYYY")}</p>
                </div>
                <div class="col-md-6">
                    <div class="text-center">
                        <i class="fa-solid fa-clock"></i>
                    </div>
                    <p class="mt-2 text-center">Heure début : ${Leave.hour_begin}</p>
                    <p class="text-center">Heure fin : ${Leave.hour_end}</p>
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-md-6">
                    <p class="text-center">Duration : ${Leave.duration} </p>
                </div>
                <div class="col-md-6">
                    <p class="text-center">Status : ${allStat[Leave.status]}</p>
                </div>
            </div>
        </div>
    </div>
    `
}
var update = `
<div class="row">
<div class="col-md-9">
    <div class="row col-md-12 p-0">
        <div class="col-md-4 d-flex w-100">
            <p class="point-text">Periode solicitée :</p>
        </div>
        <div class="col-md-4 d-flex justify-content-between w-100">
            <p class="point-text ">Date début :</p>
            <input class="mx-1 date value" id="UpdateStartDate" type="date" />
        </div>
        <div class="col-md-4 d-flex justify-content-between w-100">
            <p class="point-text ">Heure :</p>
            <input class="mx-1 date value" id="UpdateStartTime" type="time" />
        </div>
    </div>
    <div class="row col-md-12 p-0">
        <div class="col-md-4 d-flex w-100">
          
        </div>
        <div class="col-md-4 d-flex justify-content-between w-100">
            <p class="point-text ">Date fin : <b class="filling">ish</b></p>
            <input class="mx-1 date value" id="UpdateEndDate" type="date" />
        </div>
        <div class="col-md-4 d-flex justify-content-between w-100">
            <p class="point-text ">Heure :</p>
            <input class="mx-1 date value" id="UpdateEndTime" type="time" />
        </div>
    </div>
</div>
<div class="col-md-3 align-items-center justify-content-center">
    <div class="day-number">
        <p class="point-text">Nb de jour :</p>
        <p id="dayNumber">7</p>
    </div>
</div>
</div>

<div class="row">
<div class="col-md-6">
    <p class="point-text mb-2">Motifs :</p>
    <textarea  class="value" id="UpdateMotif"></textarea>
</div>
<div class="col-md-6">
    <p class="point-text mb-2">Récupération :</p>
    <textarea id="UpdateRecovery"></textarea>
</div>
</div>
<div class="d-flex justify-content-end">
<button id="sendRequest" class="btn btn-md btn-info">Mettre a jour <i class="fa-solid fa-envelope"></i></button>
<div class="snippet mx-4 p-3" id="loading" data-title="dot-pulse">
    <div class="stage">
      <div class="dot-pulse"></div>
    </div>
  </div>
</div>
`
=======

    var durt = $("#nbDay").val()

    console.log("durt", durt);
    (!startDate) ? $("#startDate").css({"border-color": "red"}) : $("#startDate").css({"border-color": ""});
    (!endDate) ?  $("#endDate").css({"border-color": "red"}) : $("#endDate").css({"border-color": ""});
    (!startTime) ? $("#startTime").css({"border-color": "red"}) : $("#startTime").css({"border-color": ""});
    (!endTime) ? $("#endTime").css({"border-color": "red"}) : $("#endTime").css({"border-color": ""});
    (!motif) ? $("#motif").css({"border-color": "red"}) : $("#motif").css({"border-color": ""});

    var dateRequest = { code:code,startDate:startDate,endDate:endDate,startTime:startTime, endTime:endTime, motif:motif,recovery:recovery, duration: nb_jours}
    if ( startDate && endDate && startTime && endTime && motif) {
        $.ajax({
                url:"/makeRequest",
                method:"POST",
                data:dateRequest,
                success: function(res) {
                    $('#loading').hide();
                    $("#notification").show();
                    setTimeout(() => {
                        $("#notification").hide();
                    }, 3000);
                }
        })
    }
    
});


$("#startDate").on('change',  () =>{
    
    var startDate = $("#startDate").val()
    var endDate = $("#endDate").val();
    var startTime = $("#startTime").val();
    var endTime = $("#endTime").val();

    (!startDate) ? $("#startDate").css({"border-color": "red"}) : (
        $("#startDate").css({"border-color": ""}),
        (endDate && startTime && endTime) ? calculeDate(startDate, endDate, startTime, endTime) : ""
    );
})
$("#endDate").on('change',  () =>{

    var startDate = $("#startDate").val()
    var endDate = $("#endDate").val();
    var startTime = $("#startTime").val();
    var endTime = $("#endTime").val();

    (!endDate) ?  $("#endDate").css({"border-color": "red"}) : ( 
        $("#endDate").css({"border-color": ""}),
        (startDate && startTime && endTime) ? calculeDate(startDate, endDate, startTime, endTime) : ""
    );
})
$("#startTime").on('change',  () =>{
    var startDate = $("#startDate").val()
    var endDate = $("#endDate").val();
    var startTime = $("#startTime").val();
    var endTime = $("#endTime").val();

    (!startTime) ? $("#startTime").css({"border-color": "red"}) : (
        $("#startTime").css({"border-color": ""}),
        (startDate && endDate && endTime) ? calculeDate(startDate, endDate, startTime, endTime) : ""
    );
})
$("#endTime").on('change',  () =>{
    var startDate = $("#startDate").val()
    var endDate = $("#endDate").val();
    var startTime = $("#startTime").val();
    var endTime = $("#endTime").val();
    
    (!endTime) ? $("#endTime").css({"border-color": "red"}) : (
        $("#endTime").css({"border-color": ""}),
        (startDate && startTime && endDate) ? calculeDate(startDate, endDate, startTime, endTime) : ""
    );
})
$("#motif").on('change',  () =>{
    (!motif) ? $("#motif").css({"border-color": "red"}) : (
        $("#motif").css({"border-color": ""})
    );
})
var shift = $("#shift").text()
var user_entry = $("#user-entry").val()
console.log("shift", shift);

function calculeDate (startDate, endDate, startTime, endTime)  {
    var startDateTime = new Date(startDate);
    var endDateTime = new Date(endDate);

    var timeDifference = endDateTime - startDateTime;

    var daysDifference = timeDifference / (1000 * 3600 * 24);

    var hours = ""
    
    const startT = new Date(`2000-01-01 ${startTime}`);
    const endT = new Date(`2000-01-01 ${endTime}`);

    const timeDiff = endT - startT;
    hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        
    if (startDate == endDate) {
        daysDifference = hours + " heures"
        if (daysDifference <4) {
            $("#nbDay").val(0.5) 
            $("#nbDay").val() = 0.5
        }
    }else if((shift == "shift 1" && hours == 6) ||( shift == "shift 2" && hours == 6) || (shift == "shift 3" && hours == 6) || (shift == "shift weekend" && hours == 6)){
        daysDifference = daysDifference + 1 + " jours "
        $("#nbDay").val(daysDifference + 1)
    }else if(hours == 8){
        daysDifference = daysDifference + 1 + " jours "
        $("#nbDay").val(daysDifference + 1)
    } 
    // else{
    //     daysDifference = daysDifference + " jours " + hours + " heures"
    // }
    $("#dayNumber").html(daysDifference);
    // return resultDate;

}

