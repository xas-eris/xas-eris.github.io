////////////////////////////////
// CODE FOR A CHANGE IN FILE: //
////////////////////////////////
$("#myFile").change(function(e){

	lastScroll = getScroll(); //we will need this info at the very end...

	$( ".bk-root" ).empty();

	energyList = [];
	i0List = [];
	itransList = [];
	muList = [];
	muListN = [];
	preEdge = 5465;
	vertOffset = 0;
	window.plot = Bokeh.Plotting.figure({
		title:'Mu',
		tools: tools,
		height: (2/3) * wrapperWidth,
		width: wrapperWidth,
		margin: ''
	});

	var myFile = this.files[0];
	readFile(myFile, function(e) {

	var dataStr = e.target.result;
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
		muListN.push(muValue);
	}

///////////////////////////////////////////////

	normalize(energyList,muListN);
	subtractOffset(energyList,muListN,preEdge,vertOffset);
	subtractOffset(energyList,muList,preEdge,vertOffset);

///////////////////////////////////////////////


	
	// arrays to hold data
	source = new Bokeh.ColumnDataSource({
	    data: { x: energyList, y: muListN }
	});
	
	// make the plot
	plot.line({ field: "x" }, { field: "y" }, {
		source: source,
		line_color: "Red",
		line_width: 2
	});

	newSource = new Bokeh.ColumnDataSource({
	    data: { x: energyList, y: muList }
	});

	plot.line({ field: "x" }, { field: "y" }, {
		source: newSource,
		line_width: 2
	});

	Bokeh.Plotting.show(plot);

	window.scrollTo(lastScroll[0], lastScroll[1]) //scrolls viewport back to the same place we started. 

	});
});

//////////////////////////////////////////////////////////////////////
// CODE FOR A CHANGE IN ALPHA, THICKNESSFACTOR, OR LORENTZIAN FWHM: //
//////////////////////////////////////////////////////////////////////
$("#preEdgeInput,#vertOffsetInput,#alphaSlider,#alphaInput,#thicknessFactorSlider,#thicknessFactorInput,#lorentzianSlider,#lorentzianInput,#lorCheck,#normCheck").on('input', function(e) { 

	lastScroll = getScroll(); //we will need this info at the very end...

	$( ".bk-root" ).empty();

	window.xdr = new Bokeh.Range1d({ start: plot.x_range.start, end: plot.x_range.end });
	window.ydr = new Bokeh.Range1d({ start: plot.y_range.start, end: plot.y_range.end });
	window.plot = Bokeh.Plotting.figure({
		title:'Mu',
		x_range: xdr,
		y_range: ydr,

		tools: tools,
		height: (2/3) * wrapperWidth,
		width: wrapperWidth,
		margin: ''
	});

	preEdge = Number(document.getElementById("preEdgeInput").value);
	vertOffset = Number(document.getElementById("vertOffsetInput").value);
	alpha = Number(document.getElementById("alphaSlider").value);	
	thicknessFactor = Number(document.getElementById("thicknessFactorSlider").value);
	fwhm = Number(document.getElementById("lorentzianSlider").value);	
	
	muListP = [];

	subtractOffset(energyList,muListN,preEdge,vertOffset);
	subtractOffset(energyList,muList,preEdge,vertOffset); //this adjusts the muList values from the beginning so that the vertically-adjusted values are those used to calculate simulatedIT

if(document.getElementById('lorCheck').checked) {
//////////////////////////////////////////////////////////////////////  CONVOLUTION:

	// Choose deltaE, the horizontal separation between points in the interpolated data, to be the smallest existing separation between points in the non-interpolated data:
        var deltaE = "";
        for (var i = 1; i < energyList.length; i++) {
            if (Math.abs(energyList[i] - energyList[i-1]) < deltaE || deltaE === ""){
                deltaE = energyList[i] - energyList[i-1];
            }
        }

        // The number of points in the interpolated data:
        arrayLength = Math.floor( (energyList[energyList.length - 1] - energyList[0]) / deltaE );

        // Create a list of the interpolated energy values:
        var interpolatedEnergyList = [];
        var firstEnergyValue = Math.ceil(energyList[0]);
        for (var i = 0; i < arrayLength; i++) {
            interpolatedEnergyList.push(firstEnergyValue + i * deltaE);
        }

        // Create a list of thicknessFactor-dependent, and alpha-dependent, simulated IT data:
        var simulatedITList = [];
        for (var i = 0; i < energyList.length; i++) {
            simulatedITList.push( alpha * i0List[i] + (1-alpha) * i0List[i] * Math.pow(Math.E, - thicknessFactor * muList[i] ) );// should this use muList or muListN?
        }

        // Interpolate simulatedIT:
        var interpolatedITList = [];
        j = 0;
        for (var i = 1; i < energyList.length; i++) {
            iTInitial = simulatedITList[i-1];
            iTFinal = simulatedITList[i];
            energyInitial = energyList[i-1];
            energyFinal = energyList[i];
            
            var interpolatingSlope = (iTFinal - iTInitial) / (energyFinal - energyInitial);
            while (interpolatedEnergyList[j] <= energyFinal) {
                interpolatedITList.push( iTInitial + interpolatingSlope * (interpolatedEnergyList[j] - energyInitial) );
                j++;
            }
        }

        // Interpolate i0:
        var interpolatedI0List = [];
        j = 0;
        for (var i = 1; i < energyList.length; i++) {
            i0Initial = i0List[i-1];
            i0Final = i0List[i];
            energyInitial = energyList[i-1];
            energyFinal = energyList[i];
            
            var interpolatingSlope = (i0Final - i0Initial) / (energyFinal - energyInitial);
            while (interpolatedEnergyList[j] <= energyFinal) {
                interpolatedI0List.push( i0Initial + interpolatingSlope * (interpolatedEnergyList[j] - energyInitial) );
                j++;
            }
        }

        // Create a list of Lorentzian values:
        function lorentzian(x,x0) {
            return fwhm / (2 * Math.PI * ((x - x0)*(x - x0) + fwhm*fwhm/4));
        }

        // Convolve the iT and i0 data with the Lorentzian:
        for (var i = 0; i < energyList.length; i++) {
            var iTaccumulator = 0;
            var i0accumulator = 0;
            var lorCenter = energyList[i];
            for (var j = 0; j < arrayLength; j++) {
                lorValue = lorentzian(interpolatedEnergyList[j],lorCenter);
                iTaccumulator += interpolatedITList[j] * lorValue;
                i0accumulator += interpolatedI0List[j] * lorValue;
            }
            // calculate mu:
            muListP.push( - Math.log(iTaccumulator/i0accumulator) );
        }

} else {
////////////////////////////////////////////////////   NO CONVOLUTION:
	for (var i = 0; i < energyList.length ; i++) {
		var muValue = - Math.log(alpha + (1-alpha) * Math.pow(Math.E, - thicknessFactor * muList[i] ));
		muListP.push(muValue);
	}
}
////////////////////////////////////////////////////

	if(document.getElementById('normCheck').checked) {
		normalize(energyList,muListP);
	}
	subtractOffset(energyList,muListP,preEdge,vertOffset);
////////////////////////////////////////////////////

	source = new Bokeh.ColumnDataSource({
	    data: { x: energyList, y: muListN }
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

	window.scrollTo(lastScroll[0], lastScroll[1]) //scrolls viewport back to the same place we started. 

});
