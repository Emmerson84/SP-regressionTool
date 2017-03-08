// version: 1.0

// (SP-JS api)
var clientContext = new SP.ClientContext.get_current();
var oWebsite = clientContext.get_web();
var listReference = oWebsite.get_lists().getByTitle('RegressionData');//<-- List name.


var testStatus = Object.freeze({
	pending: 0,
	passed: 1,
	failed: 2
});
var sprintId;
var toolIndex;
var featureIndex;
var listItemData;
var sProgress;
var partsList;


$(function() {
	if (!getUrlVariable("s")) {
		var checkList = document.getElementsByClassName("featurePartControls");
		
		for (var i = 0; i < checkList.length; i++) {
			checkList[i].innerHTML = '-featurePartControls-';
		}
		
		console.log('Page opened in edit mode');
	
	} else {
		sprintId = getUrlVariable("s");
		toolIndex = getUrlVariable("t");
		featureIndex = getUrlVariable("f");
		loadData();
	}
});


function loadData() {
	
	listItemData = listReference.getItemById(sprintId);
	clientContext.load(listItemData, 'SprintProgress');
	
	clientContext.executeQueryAsync(
	Function.createDelegate(this, this.pageInit),
	Function.createDelegate(this, this.showDataError));
}


function updateSprintData() {
	
	var jsonNew = JSON.stringify(sProgress); 
	var listItem = listReference.getItemById(sprintId);
	listItem.set_item('SprintProgress', jsonNew);
	listItem.update();
	
	clientContext.load(listItem);
	clientContext.executeQueryAsync(
	Function.createDelegate(this, this.loadData),
	Function.createDelegate(this, this.showDataError));	
}


function pageInit() {
	var jsonString = listItemData.get_item('SprintProgress');
	var sData = JSON.parse(jsonString);
	sProgress = sData;
	partsList = sData.tools[toolIndex].features[featureIndex].parts;
	buildFeaturePartControls();
}
	
	
function buildFeaturePartControls() {
	var checkList = document.getElementsByClassName("featurePartControls");
	var backLink = '<a href="/regression/SitePages/Home.aspx?s='+ sprintId +'">Back</a>';
	var notesLink = '<a href="/regression/SitePages/Notes.aspx?s='+ sprintId +'&t='+ toolIndex +'&f='+ featureIndex +'">Notes</a>';
	
	// check if divs on page match parts in dataList. If they match build the pageOutput else correct.
	if (partsList.length < checkList.length) {
		var difference = checkList.length - partsList.length;
		updateParts(1, difference);
	}
	else if (partsList.length > checkList.length) {
		var difference = partsList.length - checkList.length;
		updateParts(0, difference);
	} else {
		for(var i = 0; i < checkList.length; i++) {
			switch (partsList[i]) {
			case 0:
				var firstOutput = '<a href="javascript:changeStatus('+ i +',1);"><font color="#808080" size="1">Passed</font></a>';
				var secondOutput = '<a href="javascript:changeStatus('+ i +',2);"><font color="#808080" size="1">Failed</font></a>'
				break;
			case 1:
				var firstOutput = '<a href="javascript:changeStatus('+ i +',0);"><strong><font size="2" color="#008000">Passed</font></strong></a>';
				var secondOutput = '<a href="javascript:changeStatus('+ i +',2);"><font color="#808080" size="1">Failed</font></a>';
				break;
			case 2:
				var firstOutput = '<a href="javascript:changeStatus('+ i +',0);"><strong><font size="2" color="ff0000">Failed</font></strong></a>';
				var secondOutput = '<a href="javascript:changeStatus('+ i +',1);"><font color="#808080" size="1">Passed</font></a>';
				break;
			}

			checkList[i].innerHTML = '<table bgcolor="#ededed" cellspacing="0" width="100%" class="ms-rteTable-0"><tbody><tr class="ms-rteTableEvenRow-0">'+
										'<td class="ms-rteTableEvenCol-0">​'+
										firstOutput + ' | ' + secondOutput + '</td>'+
										'<td class="ms-rteTableEvenCol-0" style="text-align: right;">'+
										backLink + ' | ' + notesLink + '</td>'+
										'</tr></tbody></table></br>';
		}
	}
}
	
	
function changeStatus(statusIndex, newStatus) {
	//change part status
	sProgress.tools[toolIndex].features[featureIndex].parts[statusIndex] = newStatus;
	var updatedPartList = sProgress.tools[toolIndex].features[featureIndex].parts;
	
	var passCounter = 0;
	for (var i = 0; i < updatedPartList.length; i++) {
		
		if (updatedPartList[i] === testStatus.passed) {
			passCounter++;
			
			if (passCounter === updatedPartList.length) {
				sProgress.tools[toolIndex].features[featureIndex].status = testStatus.passed;
				break;
			}
		
		} else if (updatedPartList[i] === testStatus.failed) {
			
			sProgress.tools[toolIndex].features[featureIndex].status = testStatus.failed;
			break;
		
		} else {
			sProgress.tools[toolIndex].features[featureIndex].status = testStatus.pending;
		}
	}

	updateSprintData();
}
	
	
//Adds or substracts x amount of parts to the partlist then triggers update. x based on difference.
function updateParts(add, amount) {
	if (add === 1) {
		for (var i = 0; i < amount; i++) {
			sProgress.tools[toolIndex].features[featureIndex].parts.push(0);
		}
	} else {
		for (var i = 0; i < amount; i++) {
			sProgress.tools[toolIndex].features[featureIndex].parts.pop();
		}
	}

	updateSprintData();
}


function getUrlVariable(variable) {
	var query = location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		if (pair[0] == variable) {
			return pair[1];
		}
	}
	
	return false;
}


function showDataError(sender, args){
	alert('List query failed: \n' + args.get_message() + 'StackTrace: \n' + args.get_stackTrace());
}
