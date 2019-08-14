function readFile(file, onLoadCallback){
	var reader = new FileReader();
	reader.onload = onLoadCallback;
	reader.readAsText(file);
}

function showVal(newVal,id){
  document.getElementById(id).innerHTML=newVal;
}

$(document).ready(function(){

  window.energyList = [];
  window.i0List = [];
  window.itransList = [];
  window.muList = [];
  window.muListP = [];
  window.alpha = 0;
  window.thicknessFactor = 1;
  window.tools = "pan,wheel_zoom,box_zoom,reset,save";
  window.xdr = new Bokeh.Range1d({ start: 5350, end: 5600 });
  window.ydr = new Bokeh.Range1d({ start: -1, end: 1.2 });
  window.plot = Bokeh.Plotting.figure({
		title:'Mu',
		x_range: xdr,
		y_range: ydr,
		tools: tools,
		height: 400,
		width: 600
	});

  var request = new XMLHttpRequest();
  request.open('GET', "https://xas-eris.com/V2O5.txt", true);
  request.responseType = 'blob';

  request.onload = function () {
	
	readFile(request.response, function(e) {

	dataStr = e.target.result;
	var idxBegin = dataStr.search("#-");//gives the index of the second-to-last pound sign

	//find the index of the last pound sign:
	var poundSearch = '';
	var j = 0;
	while (poundSearch !== '#') {
		j++ ;
		poundSearch = dataStr[idxBegin + j];
	}
	var poundIndex = idxBegin + j;

	//find the index of the carriage return following the last pound sign:
	var carriageReturnSearch = '';
	var j = 0;
	while (carriageReturnSearch !== '\n') {
		j++ ;
		carriageReturnSearch = dataStr[poundIndex + j];
	}
	var carriageReturnIndex = poundIndex + j;

	var dataHeaderInfo = dataStr.slice(poundIndex,carriageReturnIndex - 1);

	//Look at the header to figure out which columns contain which data:
	var HeaderList = dataHeaderInfo.split(' ');
	HeaderList = HeaderList.filter(Boolean);
	for (var ii = 0; ii < HeaderList.length ; ii++) {
		if (HeaderList[ii] === "energy") {
			var energyIndex = ii - 1 ; // the -1 is here to account for the "#" having an index of 0
		}
		else if (HeaderList[ii] === "i0") {
			var i0Index = ii - 1 ;
		}
		else if (HeaderList[ii] === "itrans") {
			var itransIndex = ii - 1 ;
		}
	}

	var data = dataStr.slice(carriageReturnIndex+1,dataStr.length - 1);
	var arrayOfDataLines = data.split('\n');
	
	for (var ii = 0; ii < arrayOfDataLines.length ; ii++) {
		var aLineList = arrayOfDataLines[ii].split(' ');
		aLineList = aLineList.filter(Boolean);

		var energyValue = Number(aLineList[energyIndex]);
		energyList.push(energyValue);
		var i0Value = Number(aLineList[i0Index]);
		i0List.push(i0Value);
		var itransValue = Number(aLineList[itransIndex]);
		itransList.push(itransValue);
		
		var muValue = - Math.log(itransValue/i0Value);
		muList.push(muValue);
	}

	muListP = muList;

/////////////////////////////////////////////// NORMALIZE:
	// first determine the index corresponding to the first energy value greater than 5500:
        var index = -1;
        energyList.some(function(el, i) {
            if (el > 5500) {
                index = i;
                return true;
            }
        });
        
        var diff = muListP[index] - muListP[0];
        for (var i = 0; i < energyList.length; i++) {
            if (alpha != 1) {
                muListP[i] /= diff;
            }
        }

	// subtract vertical offset:
	var b = muListP[0];
	for (var i = 0; i < energyList.length; i++) {
	    muListP[i] -= b;
	}
///////////////////////////////////////////////
	
	// arrays to hold data
	source = new Bokeh.ColumnDataSource({
	    data: { x: energyList, y: muListP }
	});
	
	// make the plot
	plot.line({ field: "x" }, { field: "y" }, {
		source: source,
		line_color: "Red",
		line_width: 2
	});

	// Show the plot, appending it to the end of the current
	// section of the document we are in.

	Bokeh.Plotting.show(plot);

	});
  };
  request.send();
});
