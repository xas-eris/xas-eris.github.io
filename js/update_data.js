////////////////////////////////
// CODE FOR A CHANGE IN FILE: //
////////////////////////////////
$("#myFile").change(function(e){

	lastScroll = getScroll(); //we will need this info at the very end...

	$( ".bk-root" ).empty();

	energy = [];
	i0 = [];
	iT = [];
	mu_t = [];
	mu_t_input = [];
	mu_t_output = [];
	energy1 = parseFloat( prompt("Please enter a low E for \u03BB(E);") );
	$("#e1").val(energy1);
	lambda1 = parseFloat( prompt("Please enter \u03BB(E_low)") );
	$("#lam1").val(lambda1);
	energy2 = parseFloat( prompt("Please enter a high E for \u03BB(E)") );
	$("#e2").val(energy2);
	lambda2 = parseFloat( prompt("Please enter \u03BB(E_high)") );
	$("#lam2").val(lambda2);

	thickness = parseFloat( prompt("Please enter your sample thickness") );;
	$("#thicknessFactorSlider,#thicknessFactorInput").val(thickness);
	alpha = 0;
	$("#alphaSlider,#alphaInput").val(alpha);
	fwhm = 0.1;
	$("#lorentzianSlider,#lorentzianInput").val(fwhm);
	normE1 = 0;
	normE2 = 0;

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
		energy.push(energyValue);
		var i0Value = Number(aLineList[i0Index]);
		i0.push(i0Value);
		var itransValue = Number(aLineList[itransIndex]);
		iT.push(itransValue);

		var muValue = Math.log(i0Value/itransValue);
		mu_t.push(muValue);
	}

///////////////////////////////////////////////

	var energyIndex1 = getEnergyIndex(energy,energy1);
	var mu_t_E1 = mu_t[energyIndex1];
	var energyIndex2 = getEnergyIndex(energy,energy2);
	var mu_t_E2 = mu_t[energyIndex2];

	var beta = getBeta(lambda2,lambda1,thickness);
	var scaleBy = beta / ( mu_t_E2 - mu_t_E1 );

	for (var i = 0; i < energy.length ; i++) {
		mu_t_input.push(scaleBy * ( mu_t[i] - mu_t_E1 ) + (thickness / lambda1) ); // First, vertically offsets mu_t such that it is 0 at E1; then, scales to satisfy the Beta requirement; finally, vertically offsets such that mu_t_input(E1) = 1 / lambda(E1)
	}

///////////////////////////////////////////////

	wrapperWidth = document.getElementById('wrapperID').offsetWidth;
	tools = "pan,wheel_zoom,box_zoom,reset,save";
	xdr = new Bokeh.Range1d({ start: energy[0], end: energy[energy.length-1] });
	ydr = new Bokeh.Range1d({ start: Math.min.apply(null, mu_t_input), end: Math.max.apply(null, mu_t_input) });
	plot = Bokeh.Plotting.figure({
		title: "",
		x_range: xdr,
		y_range: ydr,
		x_axis_label: "Energy (eV)",
		y_axis_label: "\u03BC\u0074 (dimensionless)",
		tools: tools,
		height: (2/3) * wrapperWidth,
		width: wrapperWidth,
		margin: ''
	});


	newSource = new Bokeh.ColumnDataSource({
	    data: { x: energy, y: mu_t_input }
	});

	plot.line({ field: "x" }, { field: "y" }, {
		source: newSource,
		line_width: 2
	});

	Bokeh.Plotting.show(plot,document.getElementById("plotID"));

	window.scrollTo(lastScroll[0], lastScroll[1]) //scrolls viewport back to the same place we started. 

	});
});

//////////////////////////////////////////////////////////////////////
// CODE FOR A CHANGE IN ALPHA, THICKNESSFACTOR, OR LORENTZIAN FWHM: //
//////////////////////////////////////////////////////////////////////
$("#e1,#lam1,#e2,#lam2,#thicknessFactorSlider,#thicknessFactorInput,#alphaSlider,#alphaInput,#lorCheck,#lorentzianSlider,#lorentzianInput,#normCheck,#normEnergyInput1,#normEnergyInput2,#preEdgeInput").on('input', function(e) { 

	lastScroll = getScroll(); //we will need this info at the very end...

	$( ".bk-root" ).empty();

	wrapperWidth = document.getElementById('wrapperID').offsetWidth;
	xdr = new Bokeh.Range1d({ start: plot.x_range.start, end: plot.x_range.end });
	ydr = new Bokeh.Range1d({ start: plot.y_range.start, end: plot.y_range.end });
	plot = Bokeh.Plotting.figure({
		title: "",
		x_range: xdr,
		y_range: ydr,
		x_axis_label: "Energy (eV)",
		y_axis_label: "\u03BC\u0074 (dimensionless)",
		tools: tools,
		height: (2/3) * wrapperWidth,
		width: wrapperWidth,
		margin: ''
	});

	energy1 = Number(document.getElementById("e1").value);
	energy2 = Number(document.getElementById("e2").value);
	lambda1 = Number(document.getElementById("lam1").value);
	lambda2 = Number(document.getElementById("lam2").value);
	thickness = Number(document.getElementById("thicknessFactorInput").value);
	alpha = Number(document.getElementById("alphaInput").value) / 100;	
	fwhm = Number(document.getElementById("lorentzianInput").value);	
	normE1 = Number(document.getElementById("normEnergyInput1").value);
	normE2 = Number(document.getElementById("normEnergyInput2").value);

	var energyIndex1 = getEnergyIndex(energy,energy1);
	var mu_t_E1 = mu_t[energyIndex1];
	var energyIndex2 = getEnergyIndex(energy,energy2);
	var mu_t_E2 = mu_t[energyIndex2];

	var beta = getBeta(lambda2,lambda1,thickness);
	var scaleBy = beta / ( mu_t_E2 - mu_t_E1 );

	mu_t_input = [];
	for (var i = 0; i < energy.length ; i++) {
		mu_t_input.push(scaleBy * ( mu_t[i] - mu_t_E1 ) + (thickness / lambda1) ); // First, vertically offsets mu_t such that it is 0 at E1; then, scales to satisfy the Beta requirement; finally, vertically offsets such that mu_t_input(E1) = 1 / lambda(E1)
	}

if(document.getElementById('lorCheck').checked) {
//////////////////////////////////////////////////////////////////////  CONVOLUTION:

	// Choose deltaE, the horizontal separation between points in the interpolated data, to be the smallest existing separation between points in the non-interpolated data:
        var deltaE = "";
        for (var i = 1; i < energy.length; i++) {
            if (Math.abs(energy[i] - energy[i-1]) < deltaE || deltaE === ""){
                deltaE = energy[i] - energy[i-1];
            }
        }

        // The number of points in the interpolated data:
        arrayLength = Math.floor( (energy[energy.length - 1] - energy[0]) / deltaE );

        // Create a list of the interpolated energy values:
        var interpolatedEnergyList = [];
        var firstEnergyValue = Math.ceil(energy[0]);
        for (var i = 0; i < arrayLength; i++) {
            interpolatedEnergyList.push(firstEnergyValue + i * deltaE);
        }

        // Create a list of thicknessFactor-dependent, and alpha-dependent, simulated IT data:
        var simulatedITList = [];
        for (var i = 0; i < energy.length; i++) {
            simulatedITList.push( alpha * i0[i] + (1-alpha) * i0[i] * Math.pow(Math.E, - mu_t_input[i] ) );
        }

        // Interpolate simulatedIT:
        var interpolatedITList = [];
        j = 0;
        for (var i = 1; i < energy.length; i++) {
            iTInitial = simulatedITList[i-1];
            iTFinal = simulatedITList[i];
            energyInitial = energy[i-1];
            energyFinal = energy[i];
            
            var interpolatingSlope = (iTFinal - iTInitial) / (energyFinal - energyInitial);
            while (interpolatedEnergyList[j] <= energyFinal) {
                interpolatedITList.push( iTInitial + interpolatingSlope * (interpolatedEnergyList[j] - energyInitial) );
                j++;
            }
        }

        // Interpolate i0:
        var interpolatedI0List = [];
        j = 0;
        for (var i = 1; i < energy.length; i++) {
            i0Initial = i0[i-1];
            i0Final = i0[i];
            energyInitial = energy[i-1];
            energyFinal = energy[i];
            
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
	mu_t_output = [];
        for (var i = 0; i < energy.length; i++) {
            var iTaccumulator = 0;
            var i0accumulator = 0;
            var lorCenter = energy[i];
            for (var j = 0; j < arrayLength; j++) {
                lorValue = lorentzian(interpolatedEnergyList[j],lorCenter);
                iTaccumulator += interpolatedITList[j] * lorValue;
                i0accumulator += interpolatedI0List[j] * lorValue;
            }
            // calculate mu_t:
            mu_t_output.push( Math.log( i0accumulator / iTaccumulator ) );
        }

} else {
////////////////////////////////////////////////////   NO CONVOLUTION:
	mu_t_output = [];
	for (var i = 0; i < energy.length ; i++) {
		var muValue = - Math.log(alpha + (1-alpha) * Math.pow(Math.E, - mu_t_input[i] ));
		mu_t_output.push(muValue);
	}
}
////////////////////////////////////////////////////

	if(document.getElementById('normCheck').checked) {
		normalize(energy,mu_t_input,normE1,normE2,energy1,thickness,lambda1);
		normalize(energy,mu_t_output,normE1,normE2,energy1,thickness,lambda1);
	}
////////////////////////////////////////////////////

	source = new Bokeh.ColumnDataSource({
	    data: { x: energy, y: mu_t_input }
	});

	plot.line({ field: "x" }, { field: "y" }, {
		source: source,
		line_width: 2
	});

	newSource = new Bokeh.ColumnDataSource({
	    data: { x: energy, y: mu_t_output }
	});

	plot.line({ field: "x" }, { field: "y" }, {
		source: newSource,
		line_color: "Red",
		line_width: 2
	});

	Bokeh.Plotting.show(plot,document.getElementById("plotID"));

	window.scrollTo(lastScroll[0], lastScroll[1]) //scrolls viewport back to the same place we started. 

});
