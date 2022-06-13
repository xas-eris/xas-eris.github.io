function readFile(file, onLoadCallback){
	var reader = new FileReader();
	reader.onload = onLoadCallback;
	reader.readAsText(file);
}

function showVal(newVal,id){
  document.getElementById(id).innerHTML=newVal;
}

function updateTextInput(val,inputID) {
          document.getElementById(inputID).value=val; 
}

function getBeta(lam2,lam1,t) {
	if (lam2 < lam1) {
		return ( (1/lam2) - (1/lam1) )*t;
	} else {
		window.log("error: attenuation length @ lower energy must exceed attenuation length @ higher energy");
		return NaN;
	}
}

function getEnergyIndex(eList,eVal) {
	// determine the index corresponding to the first energy value greater than eVal:
	var index = -1;
        eList.some(function(el, i) {
            if (el > eVal && i !== 0) {
                index = i;
                return true;
            }
        });

	if (index == -1 ) {index = NaN; window.log('error: energy value out-of-range')};

	return index;
}

function normalize(eList,myList,lowE,highE,preEdgeE,t,lam1) {
	var index1 = getEnergyIndex(eList,lowE);
	var index2 = getEnergyIndex(eList,highE);
	var index3 = getEnergyIndex(eList,preEdgeE);
        
        var diff = myList[index2] - myList[index1];
	var subtractOff = myList[index3]/diff - t/lam1 ; //after scaling, vertically offsets the scaled data such that myList(preEdgeE) = 1 / lambda(preEdgeE)
        for (var i = 0; i < eList.length; i++) {
            if (alpha != 1) {
                myList[i] = myList[i] / diff - subtractOff;
            }
        }
}

function subtractOffset(eList,myList,prEdge,offset) {
	index = getEnergyIndex(eList,prEdge);

	// subtract vertical offset:
	var b = myList[index] - offset;
	for (var i = 0; i < eList.length; i++) {
	    myList[i] -= b;
	}
}

window.getScroll = function() {
    if (window.pageYOffset != undefined) {
        return [pageXOffset, pageYOffset];
    } else {
        var sx, sy, d = document,
            r = d.documentElement,
            b = d.body;
        sx = r.scrollLeft || b.scrollLeft || 0;
        sy = r.scrollTop || b.scrollTop || 0;
        return [sx, sy];
    }
}

$(":file").filestyle({
  icon: false
});

$(document).ready(function(){

  window.energy = [];
  window.i0 = [];
  window.iT = [];
  window.mu_t = [];
  window.mu_t_input = [];
  window.mu_t_output = [];
  window.energy1 = 5450;
  window.energy2 = 5500;
  window.lambda1 = 28.7;
  window.lambda2 = 4.67;
  window.thickness = 1;
  window.alpha = 0;
  window.fwhm = 0.1;
  window.normE1 = 0;
  window.normE2 = 0;

  window.wrapperWidth = document.getElementById('wrapperID').offsetWidth;
  window.tools = "pan,wheel_zoom,box_zoom,reset,save";
  window.xdr = new Bokeh.Range1d({ start: 5350, end: 5600 });
  window.ydr = new Bokeh.Range1d({ start: 0, end: 0.3 });
  window.plot = Bokeh.Plotting.figure({
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

  var request = new XMLHttpRequest();
  request.open('GET', "https://xas-eris.com/V2O5.txt", true);
  request.responseType = 'blob';

  request.onload = function () {
	
	readFile(request.response, function(e) {

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

	newSource = new Bokeh.ColumnDataSource({
	    data: { x: energy, y: mu_t_input }
	});

	plot.line({ field: "x" }, { field: "y" }, {
		source: newSource,
		line_width: 2
	});
	// Show the plot, appending it to the plotID div
	Bokeh.Plotting.show(plot,document.getElementById("plotID"));
//	document.getElementById('plotID').style.marginTop = (wrapperWidth / 6).toString().concat("px"); // this code will vertically shift the plot down
	});
  };
  request.send();
});
