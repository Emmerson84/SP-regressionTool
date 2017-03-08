// Version: 1.0

//(SP-JS api)
var clientContext = new SP.ClientContext.get_current();
var oWebsite = clientContext.get_web();
var listReference = oWebsite.get_lists().getByTitle('RegressionData');//<-- List name.
var user = oWebsite.get_currentUser();

var listItemData;
var sprintId;
var toolIndex;
var featureIndex;
var sProgress;
var sNotes;
var currentUser;
var noteSubject;



$(function() {
	if (!getUrlVariable("s")) {
		console.log('No sprint id received');
		console.log('Edit mode');
	} else {
		sprintId = getUrlVariable("s");
		toolIndex = getUrlVariable("t");
		featureIndex = getUrlVariable("f");
		setUser();
		
	}
});


function setUser() {
	var nUser;
	clientContext.load(user);
	clientContext.executeQueryAsync(
	function(){
		currentUser = user.get_title();
		loadData();
	},
	function(){alert(":(");});
}


function loadData() {
	
	listItemData = listReference.getItemById(sprintId);
	clientContext.load(listItemData, 'SprintNotes','SprintProgress');
	
	clientContext.executeQueryAsync (
	Function.createDelegate(this, this.pageInit),
	Function.createDelegate(this, this.showDataError));
}


function updateData() {
	var jsonNew = JSON.stringify(sNotes); 
	var listItem = listReference.getItemById(sprintId);
	listItem.set_item('SprintNotes', jsonNew);
	listItem.update();
	
	clientContext.load(listItem);
	clientContext.executeQueryAsync(
	Function.createDelegate(this, this.loadData),
	Function.createDelegate(this, this.showDataError));			
}


function pageInit() {
	var jsonNotes = listItemData.get_item('SprintNotes');
	var jsonSprogress = listItemData.get_item('SprintProgress');
	sProgress = JSON.parse(jsonSprogress);
	sNotes = JSON.parse(jsonNotes);
	
	if (!getUrlVariable("t")) {
		noteSubject = 'Sprint note';
	}else {
		noteSubject = sProgress.tools[toolIndex].name +
		' / '+
		sProgress.tools[toolIndex].features[featureIndex].name;
	}
		
	buildPage();
}


function buildPage() {
	
	var noteList = sNotes.notes;
	var inputAreaTitle = '<h1>Sprint '+ sProgress.sprint +'</h1>'+
							'<h2>Subject: '+ noteSubject +'</h2>';
	
	var textAreaOutput = '<p><textarea id="noteInput" rows="20" cols="20"'+
							'style="margin: 0px; width: 100%; height: 200px;"></textarea></p>'+
							'<h2 style="text-align: right;">'+
							'<a href="javascript:history.go(-1)">Back</a> | '+
 							'<a href="javascript:addNote()">Add note</a>​'+
							'​</h2>';
	
	var noteOutput = '<div style="overflow:scroll; height:700px; width:500">';
	
	for(i = noteList.length - 1; i >= 0; i--) {
	
		noteOutput += '<table  cellspacing="0" width="100%" class="ms-rteTable-0">'+
						'<tbody>'+
						'<tr bgcolor="#ededed" class="ms-rteTableEvenRow-0">'+
						'<td class="ms-rteTableEvenCol-0">​'+
						'<b>Suject: </b>' + noteList[i].subject +
						'</td>'+
						'<td class="ms-rteTableEvenCol-0" style="text-align: right;">'+
						'<font color="#808080" size="1">' + noteList[i].user +' | '+ noteList[i].time +'</font>'+
						'</td>'+
						'</tr></tbody></table>'+
						'<p>'+ noteList[i].note +'</p>';	
	}
	
	document.getElementById('textArea').innerHTML = inputAreaTitle + textAreaOutput;
	document.getElementById('sprintBox').innerHTML = noteOutput;
}


function addNote() {
	var time = new Date();
	time = time.toLocaleDateString() +' - '+ time.toLocaleTimeString();
	var subject = noteSubject;
	var note = document.getElementById('noteInput').value;
	
	if (note === '') {
		alert("You need to input some text!");
	
	} else {
		var newNote = {"user":currentUser, "time":time, "subject":subject, "note":note};
		sNotes.notes.push(newNote);
		updateData();
	}
}


function getUrlVariable(variable) {
	var query = location.search.substring(1);
	var vars = query.split("&");
	
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		if (pair[0] === variable) {
			return pair[1];
		}
	}
	return false;
}


function showDataError(sender, args){
	alert('List query failed: \n' + args.get_message() + 'StackTrace: \n' + args.get_stackTrace());
}











