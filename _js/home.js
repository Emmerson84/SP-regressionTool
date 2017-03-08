// version: 1.0

//(SP-JS api)
var clientContext = new SP.ClientContext.get_current();
var oWebsite = clientContext.get_web();
var listReference = oWebsite.get_lists().getByTitle('RegressionData');

 
var sprintHistoryLimit = 5;
var sprintsData;
var currentSprintId;
var lastSprintData;
var lastSprintId;


$(function() {
	if (getUrlVariable("s") !== false) {
		currentSprintId = parseInt(getUrlVariable("s"));
		loadData();
	} else {
		loadData();
	}	
});

// Retrieves data for the last x number of sprints, based on 'sprintHistoryLimit'.
function loadData() {
	var camlQuery = new SP.CamlQuery();
	
	var query = '<View><Query><OrderBy><FieldRef Name="Created" Ascending="False"></FieldRef></OrderBy></Query>'+
				'<ViewFields><FieldRef Name="SprintProgress"/></ViewFields><RowLimit>'+ sprintHistoryLimit +'</RowLimit></view>';
	camlQuery.set_viewXml(query);
	collListItem = listReference.getItems(camlQuery);

	clientContext.load(collListItem);
	clientContext.executeQueryAsync(
	Function.createDelegate(this, this.pageInit),
	Function.createDelegate(this, this.showDataError));
}

// Inserts a new sprint template in the RegressionData list.
function insertNewSprintListItem(newSprint) { 
	var listCreationInfo = new SP.ListCreationInformation();
	var newItem = listReference.addItem(listCreationInfo);
	var newData = JSON.stringify(newSprint);
	var notesObject = '{"sprint":'+ newSprint.sprint +',"notes":[]}';
	newItem.set_item('SprintProgress', newData);
	newItem.set_item('SprintNotes', notesObject);
	newItem.set_item('Title', 'Sprint ' + newSprint.sprint);
		
	newItem.update();
	clientContext.load(newItem);
	clientContext.executeQueryAsync(
	
	Function.createDelegate(this, this.loadData),
	Function.createDelegate(this, this.showDataError));
}


function updateSprintData(updatedSprint) {
	// Data update always affects only the last sprint,
	// change current ID to make sure last sprint is loaded after update.
	currentSprintId = lastSprintId;
	
	var jsonNew = JSON.stringify(updatedSprint); 
	var listItem = listReference.getItemById(lastSprintId);
	listItem.set_item('SprintProgress', jsonNew);
	listItem.update();
	
	clientContext.load(listItem);
	clientContext.executeQueryAsync(
	
	Function.createDelegate(this, this.loadData),
	Function.createDelegate(this, this.showDataError));	
}


function pageInit(sender, args) {
	var listItemEnumerator = collListItem.getEnumerator();
	var firstIteration = true;
	sprintsData = {"sprints":[]};
	
	while (listItemEnumerator.moveNext()) {
		var listItem = listItemEnumerator.get_current();
		var jsonString = listItem.get_item('SprintProgress');
		var itemId = listItem.get_id();
		var	sprintProgress = JSON.parse(jsonString);
		
		if (firstIteration === true) {
			firstIteration = false;
			lastSprintId = listItem.get_id();
			lastSprintData = sprintProgress;
			
			if (!currentSprintId) { 
				currentSprintId = itemId; 
			}
		}
		
		sprintsData.sprints.push( {"id":itemId, "data":sprintProgress} );
	}
	
	buildPage();
}

// Builds page navoutput, sprint progress output then places them on the page. And sets page title.
function buildPage() {
	var navOutput = '<select id="sprintSelector" style="width:100px;" onchange="changeCurrentSprint()">';
	var contentOutput = '<table cellspacing="0" width="100%" class="ms-rteTable-0"><tbody><tr class="ms-rteTableEvenRow-0">';
	var sProgress;
	
	//Build navigation output.
	for (var i = 0; i < sprintsData.sprints.length; i++) {
		var sprintId = sprintsData.sprints[i].id;
		var sprintNumber = sprintsData.sprints[i].data.sprint;
		
		if (currentSprintId === sprintId) {
			sProgress = sprintsData.sprints[i].data;
			navOutput += '<option value="'+ sprintId +'" selected>Sprint '+ sprintNumber +'</option>';
		
		} else {
			navOutput += '<option value="'+ sprintId +'">Sprint '+ sprintNumber +'</option>';
		}
	}
	navOutput += '</select>&#160 &#160;' + 
					'<a href="javascript:buildNewSprintTemplate();">'+
					'<font size="2">+ Add new sprint​</font>'+
					'</a>  |  '+
					'<a href="/regression/SitePages/Notes.aspx?s='+ currentSprintId +'">'+
					'<font size="2">View sprint notes​</font>'+
					'</a>​';
	
	//Build sprint progress output.
	for (var i = 0; i < sProgress.tools.length; i++) {
			contentOutput += '<td class="ms-rteTableEvenCol-0" style="width: 14.2857%;">' +
								'<h1>' + sProgress.tools[i].name + '</h1>' +
								'<ul>';
    
			for (var j = 0; j < sProgress.tools[i].features.length; j++) {
				var featureStatusHtml;
				var urlVariables = '?s=' + currentSprintId + '&t=' + i + '&f=' + j;
				var featureUrl = sProgress.tools[i].features[j].url + urlVariables;
				
				switch(sProgress.tools[i].features[j].status) {
					case 0:
						featureStatusHtml = ' - <font color="#C0C0C0" size="1"><b>?</b></font>';
						break;
					case 1:
						featureStatusHtml = ' - <font color="#008000" size="3"><b>v</b></font>';
						break;
					case 2:
						featureStatusHtml = ' - <font color="#ff0000" size="3"><b>x</b></font>';
						break;
				}
				
				contentOutput += '<li>'+
									'<a href="' + featureUrl + '">'+
									sProgress.tools[i].features[j].name+
									'</a>' + featureStatusHtml+
									'</li>';
			}
			
			contentOutput += '</ul>'+
								'<a href="javascript:openNewFeatureDialog(' + i + ');">'+
								'<font size="1">+ Add feature​</font>'+
								'</a></td>';
								
		}
		
		contentOutput += '</tr></tbody></table>';	
	
	
	document.getElementById("SprintOptions").innerHTML = navOutput;
	document.getElementById("innerContent").innerHTML = contentOutput;
	document.getElementById("DeltaPlaceHolderPageTitleInTitleArea").innerHTML = 'Regression - Sprint ' + sProgress.sprint;
}


function changeCurrentSprint() {
	var selectedSprint = document.getElementById("sprintSelector").value;
	currentSprintId = parseInt(selectedSprint);
	loadData();
}

// Takes the data from the last sprint and clears progress info.
function buildNewSprintTemplate() {
	currentSprintId = lastSprintId + 1;
	var newSprint = lastSprintData;
	newSprint.sprint = parseInt(newSprint.sprint) + 1;
	
	for (var i = 0; i < newSprint.tools.length; i++) {
		
		for (var j = 0; j < newSprint.tools[i].features.length; j++) {
			
			newSprint.tools[i].features[j].status = 0;
			newSprint.tools[i].features[j].parts = [];
		}
	}
	alert('Sprint '+ newSprint.sprint + ' was created. Data will now be updated.');
	insertNewSprintListItem(newSprint);
		
}
	

function openNewFeatureDialog(toolIndex) {
	var manualLink = '<a href="/regression/SitePages/Manual.aspx">manual</a>';
	var ConfirmLink = '<h2><a href="javascript:addNewFeature(' + toolIndex + ');"><span class="ms-rteThemeForeColor-5-0">Ok​</span></a>'; 
	var cancelLink = ' | <a href="javascript:loadData();"><span class="ms-rteThemeForeColor-5-0">Cancel</span></a></h2>';
	
	var output = '<h1>New feature...</h1></br>'+
					'<p>Before creating new features please read the '+ manualLink +' to insure consistant design and functionality.</p></br>'+
					'<p><h2>New feature name:</h2>'+
					'<input id="inputFeatureName" type="text" style="width:250px;"></p></br>'+
					'<p><h2>New feature URL:</h2>'+
					'<input id="inputFeatureUrl" type="text" style="width:250px;"></p></br>'+
					ConfirmLink + cancelLink;
	
	document.getElementById("innerContent").innerHTML = output;
}
		
	
function addNewFeature(toolIndex) {
	
	var updatedSprint = lastSprintData;
	var newItemName = document.getElementById("inputFeatureName").value;
	var newItemUrl = document.getElementById("inputFeatureUrl").value;
	var newfeature = {"name":newItemName,"status":0,"url":newItemUrl,"parts":[]};
	
	if (newItemName.length <= 3 || newItemUrl.length <= 3) {
		alert('Input should be at least 4 chars long.');
	} else {
		updatedSprint.tools[toolIndex].features.push(newfeature);
		updateSprintData(updatedSprint);
	}
}


function getUrlVariable(variable) {
	var query = location.search.substring(1);
	var vars = query.split("&");
	for ( var i=0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		
		if (pair[0] == variable) {
			return pair[1];
		}
	}
	
	return false;
}
	
	
function showDataError(sender, args) {
	alert('List query failed: \n' + args.get_message() + 'StackTrace: \n' + args.get_stackTrace());
}
