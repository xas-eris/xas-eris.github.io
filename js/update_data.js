////////////////////////////////
// CODE FOR A CHANGE IN FILE: //
////////////////////////////////
$("#myFile").change(function(e){
	$( ".bk-root" ).empty();

	energyList = [];
	i0List = [];
	itransList = [];
	muList = [];
	window.plot = Bokeh.Plotting.figure({
		title:'Mu',
		tools: tools,
		height: 400,
		width: 600
	});

	var myFile = this.files[0];
	readFile(myFile, function(e) {

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
		else if (HeaderList[ii] === "itrans" || HeaderList[ii] === "itran") {
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
		itransList
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

	source = new Bokeh.ColumnDataSource({
	    data: { x: energyList, y: muListP }
	});

	plot.line({ field: "x" }, { field: "y" }, {
		source: source,
		line_color: "Red",
		line_width: 2
	});

	Bokeh.Plotting.show(plot);

	});
});
/////////////////////////////////
// CODE FOR A CHANGE IN ALPHA: //
/////////////////////////////////
$("#alphaSlider").on('input', function(e) { 
	$( ".bk-root" ).empty();

	window.xdr = new Bokeh.Range1d({ start: plot.x_range.start, end: plot.x_range.end });
	window.ydr = new Bokeh.Range1d({ start: plot.y_range.start, end: plot.y_range.end });
	window.plot = Bokeh.Plotting.figure({
		title:'Mu',
		x_range: xdr,
		y_range: ydr,
		tools: tools,
		height: 400,
		width: 600
	});

	alpha = Number(document.getElementById("alphaSlider").value);	
	muListP = [];

	for (var ii = 0; ii < energyList.length ; ii++) {		
		var modifiedItransValue = alpha + (1-alpha) * Math.pow(Math.E, - thicknessFactor * muList[ii]);
		muListP.push( - Math.log(modifiedItransValue));
	}

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

	source = new Bokeh.ColumnDataSource({
	    data: { x: energyList, y: muList }
	});

	plot.line({ field: "x" }, { field: "y" }, {
		source: source,
		line_color: "Red",
		line_width: 2
	});

	newSource = new Bokeh.ColumnDataSource({
	    data: { x: energyList, y: muListP }
	});

	plot.line({ field: "x" }, { field: "y" }, {
		source: newSource,
		line_width: 2
	});

	Bokeh.Plotting.show(plot);

});
///////////////////////////////////////////
// CODE FOR A CHANGE IN THICKNESSFACTOR: //
///////////////////////////////////////////
$("#thicknessFactorSlider").on('input', function(e) { 
	$( ".bk-root" ).empty();

	window.xdr = new Bokeh.Range1d({ start: plot.x_range.start, end: plot.x_range.end });
	window.ydr = new Bokeh.Range1d({ start: plot.y_range.start, end: plot.y_range.end });
	window.plot = Bokeh.Plotting.figure({
		title:'Mu',
		x_range: xdr,
		y_range: ydr,
		tools: tools,
		height: 400,
		width: 600
	});

	thicknessFactor = Number(document.getElementById("thicknessFactorSlider").value);
	muListP = [];
	
	for (var ii = 0; ii < energyList.length ; ii++) {		
		var modifiedItransValue = alpha + (1-alpha) * Math.pow(Math.E, - thicknessFactor * muList[ii]);
		muListP.push( - Math.log(modifiedItransValue));
	}

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

	source = new Bokeh.ColumnDataSource({
	    data: { x: energyList, y: muList }
	});

	plot.line({ field: "x" }, { field: "y" }, {
		source: source,
		line_color: "Red",
		line_width: 2
	});

	newSource = new Bokeh.ColumnDataSource({
	    data: { x: energyList, y: muListP }
	});

	plot.line({ field: "x" }, { field: "y" }, {
		source: newSource,
		line_width: 2
	});

	Bokeh.Plotting.show(plot);

});
