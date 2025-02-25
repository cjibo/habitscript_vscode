// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
let path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');



const apiEndpoint = require('./config')
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	
	console.log('Habit script activated')
	
		// Gloabl Variables
		let codingTime = 0 ;
		let lastFileName;
		let todayCodingTime = 0;
		let lastSendingData = 0;
		let lasTimeDataSent = 0;
		let lastTimeSaved = 0 
		let fileDuration = [];
	    let statusBar =   vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		









const humanizeMinutes = (sec) => {

// convert Secondes to Minutes
let min = sec / 60; 
min = min || 0;
let str = "";
if (min === 1) {
	
	str = "1 min";
}
else if (min === 60) {
	str = "1 hr";
} else if (min > 60) {
	let hrs = min / 60;
	if (hrs % 1 === 0) {
		str = hrs.toFixed(0) + " hrs";
	} else {
		str = (Math.round(hrs * 10) / 10).toFixed(1) + " hrs";
	}
} else  {
	// less than 60 seconds
	str = min.toFixed(0) + " min";
}
return str;
}

	




	function getDateFormat(date) {
		const dd = new Date(date).getDate();
		const mm = new Date(date).getMonth() + 1;
		const yy = new Date(date).getFullYear();
		return `${mm}-${dd}-${yy}`
	}

		const initialise = () => {
			statusBar.text = "Start Tracking"
			statusBar.show();
			if(context.globalState.get('apiKey') === undefined || context.globalState.get('apiKey') === null ) {
				getApikey()
			}
		
			getTodayCodingTime()
			showTodayTime()
			
		

		}
		initialise();

		  // Show  Input Box to get API Key
		  function getApikey(){



			// Prompt Input To Get API Key 
			let promptOptions = {
				prompt: 'CodaHabits API Key',
				placeHolder: 'Enter your API key',
				value: '',
				ignoreFocusOut: true
			  };
		
			 vscode.window.showInputBox(promptOptions)
			 .then( (API) =>  {
			
		
			  if(API !== null || API !== undefined ) { 

				context.globalState.update('apiKey', API);
				checkApi()
		  }
			  else {
				vscode.window.showInformationMessage('Oops, API Key is not valid!');

				  getApikey()
			  }
			 })

		  }

				// Check API Is Valid 
				function checkApi()  {
					const apiKey = context.globalState.get('apiKey');

					let url = `${apiEndpoint}duration/u/${apiKey}`
					console.log(url)
	  
					let editors = {
						name: "vs_code",
						connected_at: new Date().toISOString()
					}
					let isValid ;
		// @ts-ignore
	fetch(url, {

		method: 'POST',
		body: JSON.stringify(editors),
        headers: { 'Content-Type': 'application/json' }
	})
	.then(response=> {
	
		return response.json()
	})
	.then(resData => {
		console.log(resData)
		if(resData !== undefined ){

			vscode.window.showInformationMessage('Congratulations, Codabits is now active!');
		}
		else {
			vscode.window.showInformationMessage('Oops, API Key is not valid!');

			getApikey()
		}
	})

	.catch((err) => {
				getApikey()
		console.log(err)
	})		

	return isValid;
}



function serverIsDown() {
	createJsonFile()
	
}


function getTodayCodingTime() {


	fileDuration.forEach(el => {
		if(getDateFormat(el.created_at) === getDateFormat(new Date().toISOString()))
		{
			console.log(el.duration)
	todayCodingTime = el.duration + el.duration
		}
	
	})
	return todayCodingTime
}

// When Connection Isn't Available we Store Data in JSON File

const createJsonFile = () => {
	
	let data = JSON.stringify(fileDuration);  
	fs.writeFileSync('coding_time.json', data);  

}

// When Connection IsAvailable we read  json file and then send it to database

const readJsonFile = () => {
	let dataJSON = fs.readFileSync('coding_time.json');  
	// @ts-ignore
	let dataObj = JSON.parse(dataJSON);  
}

		// Get Project Name
		const getProjectName = () => {
			let editor = vscode.window.activeTextEditor;
			if (editor) {
				let doc = editor.document;
				if (doc) {
				  let file = doc.fileName;
				  let uri = vscode.Uri.file(file);
				  let workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
				  let projectName = workspaceFolder.name;
				  return projectName;
				}
			}
		}

		// Get Language Used When Saved Document
		const getLanguage = (doc) =>  {
			const language = doc.document.languageId;
			return language;

		}

	
		// Get File Name When Saved Document
		function getFileName(doc){
			const filePath = doc.document.fileName;
			const fileName = path.basename(filePath);
			return fileName;
		}

		function showTodayTime() {
			statusBar.text = `Today ${humanizeMinutes(todayCodingTime)}`
		}


	    // When You Write Code
		const onEvent = (isSaved, doc) => {
			getTodayCodingTime()
			showTodayTime()
			if(lastTimeSaved === 0) {
				lastTimeSaved = Date.now()
			}
		

			if(isSaved) {
				const fileName = getFileName(doc);
				const projectName = getProjectName();
				const language = getLanguage(doc);
			
				
				let lastFileNameChanged = lastFileName
			

	
			

				// Check If Last Saved File Excists in FilDuration Array 

				function checkLastSaved() {
					let isExcist = false;

					fileDuration.forEach(el => {
						
						if(el.fileName === lastFileNameChanged) {
							isExcist = true
						}

					
						
					})
					return isExcist;
				}
				// Check if array is not empty and fileName and lastFilename are the same
				if(fileDuration.length > 0 && checkLastSaved()) {
	
					fileDuration.forEach(el => {
					

			
						if(el.fileName === lastFileNameChanged) {

							const pastDurations = el.duration;
							const newDurations = pastDurations + ((lastTimeSaved - Date.now()) / 1000);
							el.duration = newDurations
							el.created_at=new Date().toISOString();
							lastFileName = fileName;
							lastTimeSaved = Date.now()
					
						}

			
					})
				
				
				}

				// Check if array is not empty and fileName and lastFilename aren't the same

				// Push New File to FileDuration Array

				else if(fileDuration.length > 0 && !checkLastSaved()) {

			
					//console.log(!checkLastSaved())
					//console.log('Hi From Checking')
				
					fileDuration.push({
						fileName,
						duration:(lastTimeSaved - Date.now()) / 1000 ,
						created_at: new Date().toISOString(), 
						projectName, 
						language
					})

				
					lastTimeSaved = Date.now()
				}

			// Check if array is  empty and fileName and lastFilename are the same or aren't the same

				else if(fileDuration.length <= 0) {

					fileDuration.push({
						fileName,
						duration:(lastTimeSaved - Date.now()) / 1000,
						created_at: new Date().toISOString(), 
						projectName, 
						language
					})
					lastFileName = fileName;
					lastTimeSaved = Date.now()

				}

					
			
				
			//	console.log(fileDuration);

			
			setTimeout(() => {
			
					vscode.window.showInformationMessage("We Sending Data");
	
					sendData(fileDuration);
			
			},120000)

			
			
			console.log(fileDuration)
				}
			

						

				
			
				
			}
			

	// When You Type Anything
			vscode.workspace.onDidChangeTextDocument((doc) => {
			onEvent(false, doc);

		  });

		  // When You Saved a File
		  vscode.workspace.onDidSaveTextDocument((doc) => {
			  console.log('Saved')
			onEvent(true, doc);
			

		  });



function sendData(fileDuration)  {
	const apiKey = context.globalState.get('apiKey');

	
	let url = `${apiEndpoint}duration/${apiKey}`;
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	
	console.log(url)


	async function sendPost() {
	
		// @ts-ignore
  let response = await fetch(url, {
	method: 'POST',
	// @ts-ignore
	body: JSON.stringify({
		fileDuration: fileDuration,
		timeZone
	}),
	headers: { 'Content-Type': 'application/json' }

  });
  let data = await response.json()
  return data;
}


sendPost()

	
	  .then(data => {
		  console.log(data);
		  lastSendingData = Date.now();

		  statusBar.tooltip = `We send Data to Our Server in ${new Date(lastSendingData)}`;


	  })
	  .catch(err => {
		  console.log(err)
		 serverIsDown();
	  })
	
	  
	  


		}
		


	}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}

