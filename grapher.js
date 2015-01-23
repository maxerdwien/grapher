var WIDTH;
var HEIGHT;

var Graph = function() {
	var self = this;
	
	// functions list
	this.functions = [];
	
	// hook in to the html page
	this.screen = document.getElementById("graph");
	this.screenContext = this.screen.getContext('2d');
	this.htmlpoints = document.getElementById("points");
	this.htmlbutton = document.getElementById("graphbutton");
	this.htmlbutton.onclick = function() { self.button(); };
	var htmlexport = document.getElementById("export");
	htmlexport.onclick = function() {
		// todo: add x and y values to canvas
		var dataURL = self.screen.toDataURL("image/png");
		htmlexport.parentNode.download = "graph.png";
		htmlexport.parentNode.href = dataURL;
	};
	this.htmlcolor = document.getElementById("color");
	this.htmlcolor.checked = false;
	this.htmlcolor.onclick = function() {
		for (var i = 0; i < self.functions.length; i++) {
			if (self.htmlcolor.checked) {
				self.functions[i].setColor(self.allColors[self.functions[i].id%self.allColors.length]);
			} else {
				self.functions[i].setColor("#000000");
			}
		}
		graph.draw();
	}
	
	this.htmlhelpbuttongraph = document.getElementById("help-button-graph");
	this.htmlhelpbuttongraph.onclick = function() {
		var section = document.getElementById("help-graph");
		if (section.style.display == "") {
			section.style.display = "none";
		}
		if (section.style.display == "none") {
			section.style.display = "block";
		} else if (section.style.display == "block") {
			section.style.display = "none";
		}
	}
	this.htmlhelpbuttonfunctions = document.getElementById("help-button-functions");
	this.htmlhelpbuttonfunctions.onclick = function() {
		var section = document.getElementById("help-functions");
		if (section.style.display == "") {
			section.style.display = "none";
		}
		if (section.style.display == "none") {
			section.style.display = "block";
		} else if (section.style.display == "block") {
			section.style.display = "none";
		}
	}
	this.htmlhelpbuttonoptions = document.getElementById("help-button-options");
	this.htmlhelpbuttonoptions.onclick = function() {
		var section = document.getElementById("help-options");
		if (section.style.display == "") {
			section.style.display = "none";
		}
		if (section.style.display == "none") {
			section.style.display = "block";
		} else if (section.style.display == "block") {
			section.style.display = "none";
		}
	}
	
	// clear function list
	document.getElementById("functions_list").innerHTML = "";
	
	// add function buttons
	{
		var htmlnormal = document.getElementById("normal");
		htmlnormal.onclick = function() {
			self.functions.push(new Function("normal", self.nextId()));
			self.htmlcolor.onclick();
		};
		
		var htmldifferential = document.getElementById("differential");
		htmldifferential.onclick = function() {
			self.functions.push(new Function("differential", self.nextId()));
			self.htmlcolor.onclick();
		};
		
		var htmldifferential2 = document.getElementById("differential2");
		htmldifferential2.onclick = function() {
			self.functions.push(new Function("differential2", self.nextId()));
			self.htmlcolor.onclick();
		};
	}
	
	// set default values of html elements
	this.htmlpoints.value = 50;
	
	// set constants
	WIDTH = this.screen.width;
	HEIGHT = this.screen.height;
	
	// input state variables
	this.mousex = null;
	this.mousey = null;
	// index of selected point
	this.dragging = null;
	
	this.selectedpoints = [];
	
	// origin location in pixels
	this.originx = WIDTH/2;
	this.originy = HEIGHT/2;
	
	// scaling factor in pixels per unit
	this.scale_default = 50;
	this.scalex = this.scale_default;
	this.scaley = this.scale_default;
	
	// list of points, in non-pixel coordinates
	this.xs = [];
	this.ys = [];
	
	// color information
	// todo: check these colors with a colorblind person
	this.allColors = ["blue", "green", "magenta", "orange", "blueviolet", "saddlebrown", "gold", "grey", "deepskyblue", "teal", "red"];
	// this array is constructed in parallel with this.xs and this.ys
	this.colors = [];
	
	// hide export button from mobile users
	if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
		htmlexport.className = "hidden";
		document.getElementById("export-image-help").className = "hidden";
		document.getElementById("mouse-controls").className = "hidden";
	} else {
		document.getElementById("touch-controls").className = "hidden";
	}
	
	// number of points per x to put in approximation
	this.points;
	
	// set up event handlers
	this.screen.onmousemove = function(e) { self.mousemove(e, false); };
	this.screen.onmousedown = function(e) { self.mousedown(e, false); };
	this.screen.onmouseup = function(e) { self.mouseup(e); };
	this.screen.onmouseout = function(e) { self.mouseout(e); };
	if (/Firefox/i.test(navigator.userAgent)) {
		this.screen.addEventListener("DOMMouseScroll", function(e) {
			console.log("event");
			//e.wheelDelta = e.detail * -120;
			// -120 is too much for some reason
			e.wheelDelta = e.detail * -40;
			self.mousewheel(e);
		});
	} else {
		this.screen.onmousewheel = function(e) { self.mousewheel(e); };
	}
	this.screen.ondblclick = function(e) { self.dblclick(e); };
	document.onkeypress = function(e) { self.enter(e); };
	
	// touchscreen event handlers
	this.screen.addEventListener('touchstart', function(e) { self.touchstart(e); });
	this.screen.addEventListener('touchmove', function(e) { self.touchmove(e); });
	this.screen.addEventListener('touchend', function(e) { self.touchend(e); });
	this.screen.addEventListener('touchleave', function(e) { self.touchend(e); });
	//this.screen.addEventListener('touchcancel', function(e) { self.touchend(e); });
}

Graph.prototype = {
	enter: function(e) {
		if (e.keyCode == 13) {
			this.button();
		}
	},
	
	button: function() {
		for (var i = 0; i < this.functions.length; i++) {
			this.functions[i].parse();
		}
		
		// remake the graph
		this.calculatePoints();
		this.draw();
	},
	
	calculatePoints: function() {
		// handle new resolution
		this.points = this.htmlpoints.value;
	
		this.xs = [];
		this.ys = [];
		this.colors = [];
		
		for (var i = 0; i < this.functions.length; i++) {
			var minimum_onscreen_x = -this.originx / this.scalex;
			var maximum_onscreen_x = (WIDTH - this.originx) / this.scalex;
			
			this.functions[i].htmlstarting.value = this.functions[i].htmlstarting.value.replace(/infinity/gi, "Infinity");
			this.functions[i].htmlending.value = this.functions[i].htmlending.value.replace(/infinity/gi, "Infinity");
			
			var startingx = Math.max(this.functions[i].htmlstarting.value-0, minimum_onscreen_x);
			var endingx = Math.min(this.functions[i].htmlending.value-0, maximum_onscreen_x);
			
			if (this.functions[i].mode == "normal") {
			
				// this 'if' isn't entered if function is not visible
				if (startingx < endingx) {
					this.calculateOne(startingx, endingx, i, 1);
					this.xs.push("end function");
					this.ys.push("end function");
					this.colors.push(this.allColors[this.functions[i].id%this.allColors.length]);
				}
			}
			else if (this.functions[i].mode == "differential" || this.functions[i].mode == "differential2") {
				this.calculateOne(this.functions[i].htmlinitialx.value-0, endingx, i, 1);
				this.xs.push("end section");
				this.ys.push("end section");
				
				this.calculateOne(this.functions[i].htmlinitialx.value-0, startingx, i, -1);
				this.xs.push("end function");
				this.ys.push("end function");
				this.colors.push(this.allColors[this.functions[i].id%this.allColors.length]);
			}
		}
		
		if (this.xs.length != this.ys.length) {
			console.log("this is a bad error and I will fail now.", this.xs.length, this.ys.length);
		}
	},
	
	// calculates points for one function, or one direction of a differential function
	// direction is 1 for forward, and -1 for backward
	calculateOne: function(startingx, endingx, i, direction) {
		var x_increment = (1/this.points) * direction;
		var x = startingx;
		var prev_slope;
		if (this.functions[i].mode == "differential" || this.functions[i].mode == "differential2") {
			if (this.functions[i].htmlinitialx.value == "") {
				this.functions[i].htmlinitialx.value = 0;
			}
			if (this.functions[i].htmlinitialy.value == "") {
				this.functions[i].htmlinitialy.value = 0;
			}
			this.xs.push(this.functions[i].htmlinitialx.value - 0);
			this.ys.push(this.functions[i].htmlinitialy.value - 0);
			x+= x_increment;
		}
		if (this.functions[i].mode == "differential2") {
			if (this.functions[i].htmlinitialslope.value == "") {
				this.functions[i].htmlinitialslope.value = 0;
			}
			prev_slope = this.functions[i].htmlinitialslope.value - 0;
		}
		
		
		while (direction == 1 ? x < endingx : x > endingx) {
			this.xs.push(x);
			if (this.functions[i].mode == "normal") {
				this.ys.push(this.functions[i].f(x));
			}
			else if (this.functions[i].mode == "differential") {
				var prev_x = this.xs[this.xs.length-2];
				var prev_y = this.ys[this.ys.length-1];
				this.ys.push(this.functions[i].f(prev_x, prev_y, x_increment));
			}
			else if (this.functions[i].mode == "differential2") {
				var prev_x = this.xs[this.xs.length-2];
				var prev_y = this.ys[this.ys.length-1];
				var values = this.functions[i].f(prev_x, prev_y, prev_slope, x_increment);
				if (values != null) {
					this.ys.push(values.y);
					prev_slope = values.v;
				} else {
					this.ys.push(null);
				}
			}
			x += x_increment;
		}
	},
	
	draw: function() {
		var ctx = this.screenContext;
		
		// clear canvas
		ctx.clearRect(0, 0, WIDTH, HEIGHT);
		
		// draw axes
		{
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 2;
			// x axis
			ctx.beginPath();
			ctx.moveTo(0, this.originy);
			ctx.lineTo(WIDTH, this.originy);
			ctx.stroke();
			//y axis
			ctx.beginPath();
			ctx.moveTo(this.originx, 0);
			ctx.lineTo(this.originx, HEIGHT);
			ctx.stroke();
			
			var notchlength = 15;
			if (this.scalex > 5) {
				// notches on x axis
				for (var i = -Math.floor((WIDTH+this.originx)/this.scalex);
						i < Math.floor((WIDTH-this.originx)/this.scalex)+1; i++) {
					if (i == 0) continue; // do not draw on axis
					ctx.beginPath();
					ctx.moveTo(this.originx+this.scalex*i, this.originy);
					ctx.lineTo(this.originx+this.scalex*i, this.originy+notchlength);
					ctx.stroke();
				}
			}
			
			if (this.scaley > 5) {
				// notches on y axis
				for (var i = -Math.floor((HEIGHT+this.originy)/this.scaley);
						i < Math.floor((HEIGHT-this.originy)/this.scaley)+1; i++) {
					if (i == 0) continue; // do not draw on axis
					ctx.beginPath();
					ctx.moveTo(this.originx, this.originy+this.scaley*i);
					ctx.lineTo(this.originx-notchlength, this.originy+this.scaley*i);
					ctx.stroke();
				}
			}
		}
		
		// draw center indicators
		var center = false;
		if (center) {
			ctx.strokeStyle = "#777777";
			ctx.beginPath();
			ctx.moveTo(WIDTH/2, 0);
			ctx.lineTo(WIDTH/2, HEIGHT);
			ctx.moveTo(0, HEIGHT/2);
			ctx.lineTo(WIDTH, HEIGHT/2);
			ctx.stroke();
		}
		
		// draw graph data
		{
			var colorindex = 0;
			ctx.strokeStyle = "#000000";
			if (this.htmlcolor.checked == true) {
				ctx.strokeStyle = this.colors[colorindex];
			}
			ctx.beginPath();
			ctx.moveTo(this.scalex*this.xs[0]+this.originx, -this.scaley*this.ys[0]+this.originy);
			for (var i = 1; i < this.xs.length; i++) {
				if (this.xs[i] === "end function") {
					ctx.stroke();
					if (this.htmlcolor.checked == true) {
						colorindex++;
						ctx.strokeStyle = this.colors[colorindex];
					}
					ctx.beginPath();
				}
				else if (this.xs[i] == "end section") {
					ctx.stroke();
					ctx.beginPath();
				}
				// we'll never look at y values above one million
				else if (Math.abs(this.ys[i]) > 1000000) {
				} else {
					ctx.lineTo(this.scalex*this.xs[i]+this.originx, -this.scaley*this.ys[i]+this.originy);
				}
			}
			ctx.stroke();
		}
		
		this.drawselectedpoints();
	},
	
	drawselectedpoints: function() {
		var ctx = this.screenContext;
		ctx.strokeStyle = "#000000";
		// vertical line
		if (this.mousex != null) {
			ctx.beginPath();
			ctx.moveTo(this.mousex, 0);
			ctx.lineTo(this.mousex, HEIGHT);
			ctx.stroke();
		}
		for (var i = 0; i < this.selectedpoints.length; i++) {
			var selectedx = this.scalex*this.xs[this.selectedpoints[i]] + this.originx;
			var selectedy = -this.scaley*this.ys[this.selectedpoints[i]] + this.originy;
			ctx.fillStyle = "#FF0000";
			ctx.beginPath();
			ctx.arc(selectedx, selectedy, 3, 0, 2*Math.PI, false);
			ctx.fill();
			
			// update html
			this.functions[i].htmlx.value = this.xs[this.selectedpoints[i]];
			this.functions[i].htmly.value = this.ys[this.selectedpoints[i]];
		}
	},
	
	mousemove: function(e, touch) {
		this.updateposition(e, touch);
		
		this.findselectedpoints();
		
		this.drag();
		
		this.draw();
	},
	
	updateposition: function(e, touch) {
		// relation of canvas to screen
		var rect = this.screen.getBoundingClientRect();
		var xoffset = rect.left;
		var yoffset = rect.top;
		
		if (touch) {
			this.mousex = e.targetTouches[0].clientX - xoffset;
			this.mousey = e.targetTouches[0].clientY - yoffset;
		} else {
			this.mousex = e.clientX - xoffset;
			this.mousey = e.clientY - yoffset;
		}
	},
	
	findselectedpoints: function() {
		// find closest points for each function
		this.selectedpoints = [];
		var mindist = Infinity;
		var function_index = 0;
		for (var i = 0; i < this.xs.length; i++) {
			if (this.xs[i] != "end function" && this.xs[i] != "end section") {
				var x_in_pixels = this.scalex*this.xs[i]+this.originx;
				if (Math.abs(x_in_pixels - this.mousex) < mindist) {
					this.selectedpoints[function_index] = i;
					mindist = Math.abs(x_in_pixels - this.mousex);
				}
			}
			if (this.xs[i] == "end function") {
				function_index++;
				mindist = Infinity;
			}
		}
	},
	
	drag: function() {
		if (this.dragging != null) {
			this.deltax = this.mousex - this.dragging.x;
			this.deltay = this.mousey - this.dragging.y;
			this.originx += this.deltax;
			this.originy += this.deltay;
			this.dragging = {
				x: this.mousex,
				y: this.mousey
			};
		
			this.calculatePoints();
		}
	},
	
	mousedown: function(e, touch) {
		if (e.button == 0 || touch) {
			this.dragging = {
				x: this.mousex,
				y: this.mousey
			};
		}
		else if (e.button == 1) {
			e.preventDefault();
			this.originx = WIDTH/2 - ((WIDTH/2-this.originx)*this.scale_default/this.scalex);
			this.originy = HEIGHT/2 - ((HEIGHT/2-this.originy)*this.scale_default/this.scaley);
			this.scalex = this.scale_default;
			this.scaley = this.scale_default;
			this.calculatePoints();
			this.draw();
		}
	},
	
	mouseup: function(e, touch) {
		if (touch || e.button == 0) {
			this.dragging = null;
		}
	},
	
	mouseout: function(e) {
		this.mousex = null;
		this.mousey = null;
		this.selectedpoints = [];
		this.dragging = null;
		
		this.draw();
	},
	
	mousewheel: function(e) {
		console.log(e.wheelDelta);
		e.preventDefault();
		if (e.shiftKey == e.altKey) {
			this.zoom(e.wheelDelta, e.wheelDelta);
		} else if (e.shiftKey) {
			this.zoom(e.wheelDelta, 0);
		} else if (e.altKey) {
			this.zoom(0, e.wheelDelta);
		}
	},
	
	zoom: function(amountx, amounty) {
		var constant = 1.0015;
		this.scalex *= Math.pow(constant, amountx);
		this.originx += (Math.pow(constant, amountx)-1)*(this.originx - WIDTH/2);
		this.scaley *= Math.pow(constant, amounty);
		this.originy += (Math.pow(constant, amounty)-1)*(this.originy - HEIGHT/2);
		
		this.calculatePoints();
		this.findselectedpoints();
		this.draw();
	},
	
	dblclick: function(e) {
		switch(e.button) {
			case 1:
				this.originx = WIDTH/2;
				this.originy = HEIGHT/2;
				this.calculatePoints();
				this.draw();
				break;
		}
	},
	
	touchstart: function(e) {
		e.preventDefault();
		if (e.targetTouches.length == 1) {
			//this.mouseup(null, true);
			this.mousemove(e, true);
			//this.mousedown(e, true);
		} else {
			this.touch_dist = Math.sqrt(Math.pow(e.targetTouches[0].clientX-e.targetTouches[1].clientX,2)+
				Math.pow(e.targetTouches[0].clientY-e.targetTouches[1].clientY,2));
		}
	},
	
	touchmove: function(e) {
		e.preventDefault();
		if (e.targetTouches.length == 1) {
			//this.mouseup(null, true);
			this.mousemove(e, true);
		}
		// pinch to zoom / pan
		else {
			var old_dist = this.touch_dist;
			this.touch_dist = Math.sqrt(Math.pow(e.targetTouches[0].clientX-e.targetTouches[1].clientX,2)+
				Math.pow(e.targetTouches[0].clientY-e.targetTouches[1].clientY,2));
			if (typeof old_dist == 'number') {
				var delta_dist = this.touch_dist - old_dist;
				//console.log(delta_dist);
				if (Math.abs(delta_dist) > 10) {
					// factor of three is a rough unit conversion from pixels moved to scroll wheel units moved
					var zoomAmount = 3*delta_dist;
					this.zoom(zoomAmount, zoomAmount);
				} else {
					this.mousemove(e, true);
					this.mousedown(e, true);
				}
			}

			// draw line between two touch points
			var draw = false;
			if (draw) {
				this.screenContext.beginPath();
				var rect = this.screen.getBoundingClientRect();
				var xoffset = rect.left;
				var yoffset = rect.top;
				this.screenContext.moveTo(e.targetTouches[0].clientX - xoffset, e.targetTouches[0].clientY - yoffset);
				this.screenContext.lineTo(e.targetTouches[1].clientX - xoffset, e.targetTouches[1].clientY - yoffset);
				
				var r = 20;
				this.screenContext.moveTo(e.targetTouches[0].clientX - xoffset+r, e.targetTouches[0].clientY - yoffset);
				this.screenContext.arc(e.targetTouches[0].clientX - xoffset, e.targetTouches[0].clientY - yoffset, r, 0, 2*Math.PI, false);
				
				this.screenContext.moveTo(e.targetTouches[1].clientX - xoffset+r, e.targetTouches[1].clientY - yoffset);
				this.screenContext.arc(e.targetTouches[1].clientX - xoffset, e.targetTouches[1].clientY - yoffset, r, 0, 2*Math.PI, false);
				this.screenContext.stroke();
			}
		}
	},
	
	touchend: function(e) {
		e.preventDefault();
		if (e.targetTouches.length >= 1 || e.changedTouches.length >= 2) {
			this.touch_dist = null;
			this.mouseout(null);
		}
			
		if (e.targetTouches.length == 0) {
			//this.mouseout(null);
		}
		else if (e.targetTouches.length == 1) {
			
		}
	},
	
	nextId: function() {
		for (var i = 0; true; i++) {
			var matchFound = false;
			for (var j = 0; j < this.functions.length; j++) {
				if (this.functions[j].id == i) {
					matchFound = true;
				}
			}
			if (!matchFound) {
				return i;
			}
		}
	},
	
	removeFunction: function(id) {
		for (var i = 0; i < this.functions.length; i++) {
			if (this.functions[i].id == id) {
				this.functions.splice(i, 1);
				this.button();
			}
		}
	}
	
}

var graph;

document.getElementById("reset").onclick = function() {
	graph = new Graph();
	graph.functions.push(new Function("normal", 0));
	graph.functions[0].htmlfunction.value = "cos(x)";
	graph.button();
};

// simulate a button press
document.getElementById("reset").onclick();




































	