

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
    $('#loading').show();
   $.ajax({
        url:"/makeRequest",
        method:"POST",
        data:{
            code:code,startDate:startDate,endDate:endDate,startTime:startTime,endTime:endTime,motif:motif,recovery:recovery
        },
        success: function(res) {
            $('#loading').hide();
            $("#notification").show();
            setTimeout(() => {
                $("#notification").hide();
            }, 3000);
        }
   })
    
});