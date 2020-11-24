const baseURL = 'http://localhost:8080/v1'
const timeToUpdate = 30_000
setInterval(fetchAllData, timeToUpdate)

// Set variables.
var player = []
var play = []
var result = []

//The buttons.
$(document).ready(async function() {
    $('#addPlayerBtn').click(async () => addPlayer($('#player').val()))
    $('#addPlayBtn').click(async () => addPlay($('#player-dropdown').val(), $('#play option:selected').text()))
    $('#resultBtn').click(sendRound)
    fetchAllData()
});

$(window).bind('beforeunload', function() {
    return 'Tem certeza de que deseja sair?'
});

// Method to send the request.
async function apiRequest(url, type, data, logCallBack) {
    let response

    function getResult(data, status, xhr, success){

        if(logCallBack){
            let pathname = new URL(url).pathname

            if(success && $('#mensagemSucessoChk').is(':checked')){
                logCallBack(`HTTP ${(xhr.status || 'OK' )} ${pathname}`, 'info')
            }else if(!success && $('#mensagemErroChk').is(':checked')){
                logCallBack(`HTTP ${(xhr.status || 'NOK')} ${pathname}`, 'error')
            }
        }
        response = data
    }

    if(data)
        data = JSON.stringify(data)

    try{
        await $.ajax({
            url: url,
            headers: {'Content-Type': 'application/json'},
            dataType: 'json',
            type: type || 'GET',
            data: data,
            success: (data, status, xhr) => getResult(data, status, xhr, true),
            error: (data, status, xhr) => getResult(data, status, xhr, false)
        })
    }finally{
        return response
    }
}

// increment player.
async function addPlayer(addNewPlayer) {
    if(addNewPlayer){
        jokenpolog('Adicionando jogador \"' + addNewPlayer + '\"...')

        try{
            let newPlayer = await apiRequest(baseURL + '/increment/player/' + addNewPlayer, 'POST', null, jokenpolog)
            player.push(newPlayer)            
        }catch(e){}
    }
    updateAllTables()
}

// increment play
async function addPlay(playerId, newPlay) {
    if(playerId){
        newPlay = newPlay || 'Pedra'
        let playerName = player.find(p => p.id == playerId).player

        try{
            play.push({playerId: playerId, newPlay: newPlay})
        }catch(e){}
    }
    updateAllTables()
}

// send a round.
async function sendRound(){
    try{
        result = await apiRequest(baseURL + '/play', 'POST', play, jokenpolog)
    }catch(e){}

    updateAllTables()
    play = []
    updateTable('plays-table', play)
}

async function fetchAllData(){
    jokenpolog('Sincronizando dados da API ' + baseURL)
    let playersRequest = await apiRequest(baseURL + '/players', 'GET', null, jokenpolog)

    fetchArray(player, playersRequest)

    function fetchArray(array, requestArray){
        if(Array.isArray(requestArray)){
            array.length = 0 // clear array by reference
            requestArray.forEach(function(item, index){
                array.push(item)
            })
        }
    }
    updateAllTables()
}

// update the tables.
function updateAllTables(){
    updateTable('players-table', player)
    updateTable('plays-table', play)
    updatePlaysDropdown()
    if(result.length != 0){
        let winners = { name:'Vencedores', value: result.vencedores.join(", ") }
        let losers = { name: 'Perdedores', value: result.perdedores.join(", ") }
        let draws = { name: 'Empates', value: result.empates.join(", ") }
        let resultTable = [winners, losers, draws]
        
        updateTable('results-table', resultTable)
    }
}

// update a table.
function updateTable(tableID, array){

    let table = $("#" + tableID)
    table.find("tr:gt(0)").remove()
    array.forEach(function(item, index){

        if(Object.values(item).length == 2) {
            table.append(`<tr>
                            <td>${Object.values(item)[0]}</td>
                            <td>${Object.values(item)[1]}</td>
                        </tr>`)
        }
    })
}

function updatePlaysDropdown(){

    let dropdown = $('#player-dropdown')
    dropdown.empty();
    player.forEach(function(item, index){
        if(item.id) {
            dropdown.append($('<option></option>').val(item.id).html(item.id))
        }
    })
}

function jokenpolog(text, type = 'log') {
    let color = type == 'info' ? 'blue' : (type == 'error' ? 'red' : 'black')
    eval(`console.${type}('${text}')`)
    let con = $('.console')
    con.append(`<p class="color-${color}">${text}</p>`)
    con.scrollTop(con[0].scrollHeight)
}
