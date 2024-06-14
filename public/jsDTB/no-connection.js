
// NOTIFICATION POUR HORS CONNEXION
if (typeof socket !== "undefined") {

    console.log('houraa')
    let html = `
    <div class="no-connection">
        <h2>Impossible de se connecter à Internet.</h2>
        <p>Nous n'avons pas pu établir de connexion à Internet. Veuillez vérifier votre connexion réseau et réessayer.</p>
    </div>`;

    $("body").append(html);
    $('.no-connection').hide();


    // Event listener for successful reconnection
    socket.on('reconnect', (attemptNumber) => {
        console.log(`Reconnected to server (attempt ${attemptNumber})`);
        
        $('.no-connection').hide();

    });

    // Event listener for giving up on reconnection
    socket.on('reconnect_failed', () => {
        console.log('Failed to reconnect to server');
        $('.no-connection').show();
    });
    
    // Event listener for giving up on reconnection
    socket.on('connect', () => {
        console.log('Connexion rétablie');
        $('.no-connection').hide();
    });

    // Event listener for giving up on reconnection
    socket.on('disconnect', () => {
        console.log('Failed to reconnect to server');
        $('.no-connection').show();
    });

}