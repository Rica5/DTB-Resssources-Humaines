

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
})

$("#myUpcoming").click(() =>{
    $("#makeRequest").attr("class","switch-button")
    $("#myRequest").attr("class","switch-button mx-2")
    $("#myUpcoming").attr("class","switch-button active-btn")
    $("#container-none").hide()
    $("#container-request").hide()
    $("#container-upcoming").show()
    $("#container-make").hide()
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