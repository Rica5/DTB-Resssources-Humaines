
function openNotif(button) {
    let notif_div = document.querySelector('.notification-modal');
    let buttons = [...document.querySelectorAll('button.notif-btn')];
    // close modal
    if (button.classList.contains('selected')) {
        buttons.forEach(btn => 
            btn.classList.remove('selected')
        )
        notif_div.classList.replace('show', 'hide');
    } else {
        // open modal
        buttons.map(btn => btn.classList.add('selected'));

        if (notif_div.classList.contains('hide')) {
            notif_div.classList.replace('hide', 'show');
        } else {
            notif_div.classList.add('show');
        }
        
        // click away 
        document.onclick = (e) => {
            // close the notification modal when user click outsite its content
            if (!e.target.closest('.notification-modal') && 
            !e.target.closest('.notif-btn')) {
                buttons.forEach(btn => 
                    btn.classList.remove('selected')
                )
                notif_div.classList.remove('show');
                notif_div.classList.remove('hide');
            }
        }
    }
}


function setnotification(all_notifications) {
  var count = 0;
  var notif = "";
    for (i = 0; i < all_notifications.length; i++) {
      let notification = all_notifications[all_notifications.length - (i + 1)];
        count = count + 1;
        notif += `
        <div id="${notification._id}" class="notification-item ${notification.isSeen ? 'seen' : ''}" onClick="markAsRead('${notification._id}')">
          <div  class="d-flex items-center gap-3">
            <span class="btn btn-warning btn-circle d-flex align-items-center justify-content-center">
              <i class="mdi mdi-bell text-white"></i>
            </span>
            <div>
              <h1>${notification.title}</h1>
              <p class="message">${notification.content}</p>
              <div class="date-time">
                <span>${notification.datetime}</span>
              </div>
            </div>
          </div>
          <button type="button" class="remove-notif-btn" onClick="removeNotification('${notification._id}')"><i class="fa-solid fa-times"></i></button>
        </div>`  
    }
    document.getElementById("notifContent").innerHTML = notif;
      document.getElementById("nbr-notif").innerHTML = all_notifications.filter(e => !e.isSeen).length;
  }
  function pushNotification(theNotif,role){
      var theContent = document.getElementById("notifContent").innerHTML;
      var idNotif = "";
      role == "Gerant" ? idNotif = theNotif.idNotif : idNotif = theNotif.idNotif
      var newNotif = `
      <div id="${idNotif}" class="notification-item ${theNotif.isSeen ? 'seen' : ''}" onClick="markAsRead('${idNotif}')">
          <div  class="d-flex items-center gap-3">
            <span class="btn btn-warning btn-circle d-flex align-items-center justify-content-center">
              <i class="mdi mdi-bell text-white"></i>
            </span>
            <div>
              <h1>${theNotif.title}</h1>
              <p class="message">${theNotif.content}</p>
              <div class="date-time">
                <span>${theNotif.datetime}</span>
              </div>
            </div>
          </div>
          <button type="button" class="remove-notif-btn" onClick="removeNotification('${theNotif.idNotif}')"><i class="fa-solid fa-times"></i></button>
        </div>
      `
      document.getElementById("notifContent").innerHTML = newNotif + theContent;
      document.getElementById("nbr-notif").innerHTML = parseInt(document.getElementById("nbr-notif").innerHTML) + 1;
  }
  
function removeNotification(id) {
    // supprimer une notification
    // send request here
    $.ajax({
        url: `/remove-notification/${id}`,
        method: "DELETE",
        data: { notifId: id },
        success: function (data) {
            if (data.ok) {
                $(`#${id}`).addClass('removing');
                setTimeout(() => {
                    $(`#${id}`).remove();
                }, 200);
                let notifCount = +$("#nbr-notif").text();
                if (!$(`#${id}`).hasClass('seen') && notifCount > 0)
                    $("#nbr-notif").text(notifCount - 1);
                // disable effacer les notifications
                if ($('.notification-item').length === 0)
                    $('.notification-options > button.delete').attr('disabled', '');
            } else {
                console.log(data.message)
            }
        },
        error: function(err) {
            console.error(err)
        }
    });

}

function removeAllNotifications() {
    // supprimer toutes les notifications
    $.ajax({
        url: "/removeall-notification",
        method: "DELETE",
        success: function (data) {
            if (data.ok) {
                $('#notifContent > div').each((index, element) => {
                    setTimeout(() => {
                        $(element).addClass('removing');
                        setTimeout(() => {
                          $("#nbr-notif").text(0);
                          $(element).remove();
                        }, 300);
                    }, index * 300);
                });
            } else {
                console.log(data.message)
            }
        },
        error: function(err) {
            console.error(err)
        }
    });
}

function markAsRead(id) {
    // send request to the server
    if ($(`#${id}`).hasClass('seen')) return;
    
    $.ajax({
        url: `/markAsRead-notification/${id}`,
        method: "PUT",
        success: function (data) {
            if (data.ok) {
                $(`#${id}`).addClass('seen');
                $(`#${id}`).removeAttr('onClick');
                let notifCount = parseInt($("#nbr-notif").text());
                if (notifCount > 0)
                  $('#nbr-notif').text(notifCount - 1);
            } else {
                console.log(data.message)
            }
        },
        error: function(err) {
            console.error(err)
        }
    });
}

function markAllAsRead() {
    $.ajax({
        url: "/markAsReadAll-notification",
        method: "PUT",
        success: function (data) {
            if (data.ok) {
                $('#notifContent > div').each((index, element) => {
                    $(element).addClass('seen');
                    $("#nbr-notif").text(0)
                    $('.notification-options > button.mark').attr('disabled', '');
                });
            }
        },
        error: function(err) {
            console.error(err)
        }
    });
}