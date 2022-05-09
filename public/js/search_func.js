//makes the event array global
var searchList;

function get_lists()
{
    //clear previous view
    document.getElementById('info_title').innerHTML = '';
    document.getElementById('left_side').innerHTML = '';
    document.getElementById('right_side').innerHTML ='';
    document.getElementById('btnArea').innerHTML = '';
    document.getElementById('tabs_area').innerHTML = '';

    document.getElementById("table_res").innerHTML = cachedTableRes;
}

function reset_inputs(){
    //clear the table results
    document.getElementById("table_res").innerHTML = '';
    document.getElementById('info_title').innerHTML = '';
    document.getElementById('left_side').innerHTML = '';
    document.getElementById('right_side').innerHTML ='';
    document.getElementById("tabs_area").innerHTML = '';

    //textfields and selection box cleared
    document.getElementById("query_textfield").value = "";
    var sel = document.getElementById('query_selection');
    sel.selectedIndex = 0;

    document.getElementById("submit_button").setAttribute("disabled", true);
}

function noTableResults(){
    //clear
    document.getElementById("table_res").innerHTML = '';
    document.getElementById('info_title').innerHTML = '';
    document.getElementById('left_side').innerHTML = '';
    document.getElementById('right_side').innerHTML ='';

    //no results found
    document.getElementById("table_res").innerHTML += "<p id='empty_res'>No Records has been found</p>"
}

function printArtistResults(jsonResponse)
{
    console.log(jsonResponse); //print out json response
    document.getElementById('info_title').innerHTML = '';
    document.getElementById('left_side').innerHTML = '';
    document.getElementById('right_side').innerHTML ='';
    var resHtml = '';

    resHtml += "<table class='total_res'> <tr class='table_header'>" +
     "<th>#</th>" +
     "<th>Artist</th>" +
     "</tr>"; //</table>;


    resHtml += '</table>'
    document.getElementById("table_res").innerHTML += resHtml;
}

function printTrackResults(jsonResponse)
{
    console.log(jsonResponse); //print out json response
    document.getElementById('info_title').innerHTML = '';
    document.getElementById('left_side').innerHTML = '';
    document.getElementById('right_side').innerHTML ='';
    var resHtml = '';

    resHtml += "<table class='total_res'> <tr class='table_header'>" +
     "<th>#</th>" +
     "<th>Track</th>" +
     "</tr>"; //</table>;

    resHtml += '</table>'
    document.getElementById("table_res").innerHTML += resHtml;
}

//acts as initalize after the whole html is loaded line-by-line
window.onload = function() {

    //submit javascript function
    const myForm = document.getElementById("myForm");
    myForm.addEventListener("submit", (e) => {
        e.preventDefault();
        //AJax to send data to somewhere else
        const query = document.getElementById('query_textfield').value;
        const queryType = document.getElementById('query_selection').value;

        //console.log(loc_val)
        const urlString = 'http://127.0.0.1:5000/search?query='+query+'&distance='+queryType;
        const infoUrl = new URL(urlString);
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", infoUrl, true);
        //xmlHttp.onreadystatechange = parseJson;
        xmlHttp.send(null);
        xmlHttp.onload = function(){
            const jsonResponse = JSON.parse(xmlHttp.responseText);
            var totalRows = jsonResponse.page.totalElements;

            //clear the string so results won't overlap
            document.getElementById("table_res").innerHTML = '';
            if(totalRows == 0) //This was empty
            {
                noTableResults();
            }else{
                printTableResult(jsonResponse);
            }
        };
    });

};
