
function openNotif(button) {
    let notif_div = document.querySelector('.notification-modal');
    console.log(notif_div)
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
        console.log(buttons)

        if (notif_div.classList.contains('hide')) {
            notif_div.classList.replace('hide', 'show');
        } else {
            notif_div.classList.add('show');
            console.log('add show')
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