var Function = function(mode, id) {
	var self = this;
	
	this.mode = mode;
	this.tokens = [];
	
	this.id = id;
	
	this.div = document.createElement("div");
	this.div.className = "function";
	
	// function input box
	var label = document.createElement("label");
	switch (this.mode) {
		case "normal":
			label.appendChild(document.createTextNode("f(x) = "));
			break;
		case "differential":
			label.appendChild(document.createTextNode("y'(x, y) = "));
			break;
		case "differential2":
			label.appendChild(document.createTextNode("y''(x, y, y') = "));
			break;
	}
	this.htmlfunction = document.createElement("input");
	this.htmlfunction.type = "text";
	this.htmlfunction.value = "";
	label.appendChild(this.htmlfunction);
	this.div.appendChild(label);
	
	// x output box
	label = document.createElement("label");
	label.appendChild(document.createTextNode("x: "));
	this.htmlx = document.createElement("input");
	this.htmlx.type = "text";
	this.htmlx.readOnly = true;
	this.htmlx.style.width = 170;
	label.appendChild(this.htmlx);
	this.div.appendChild(label);
	
	// y output box
	label = document.createElement("label");
	label.appendChild(document.createTextNode("y: "));
	this.htmly = document.createElement("input");
	this.htmly.type = "text";
	this.htmly.readOnly = true;
	this.htmly.style.width = 170;
	label.appendChild(this.htmly);
	this.div.appendChild(label);
	
	// 'remove' button
	label = document.createElement("label");
	this.htmlremove = document.createElement("input");
	this.htmlremove.type = "button";
	this.htmlremove.value = "remove";
	this.htmlremove.onclick = function() {
		self.div.parentNode.removeChild(self.div);
		graph.removeFunction(self.id);
	}
	label.appendChild(this.htmlremove);
	this.div.appendChild(label);
	
	// line break
	this.div.appendChild(document.createElement("br"));
	
	// domain
	label = document.createElement("label");
	label.appendChild(document.createTextNode("domain: "));
	this.htmlstarting = document.createElement("input");
	this.htmlstarting.type = "text";
	this.htmlstarting.value = "-Infinity";
	this.htmlstarting.style.width = 62;
	this.htmlending = document.createElement("input");
	this.htmlending.type = "text";
	this.htmlending.value = "Infinity";
	this.htmlending.style.width = 62;
	label.appendChild(document.createTextNode("( "));
	label.appendChild(this.htmlstarting);
	label.appendChild(document.createTextNode(" ≤ x < "));
	label.appendChild(this.htmlending);
	label.appendChild(document.createTextNode(" )"));
	this.div.appendChild(label);
	
	if (this.mode == "differential" || this.mode == "differential2") {
		// initial x
		label = document.createElement("label");
		label.appendChild(document.createTextNode("initial x: "));
		this.htmlinitialx = document.createElement("input");
		this.htmlinitialx.type = "text";
		this.htmlinitialx.style.width = 70;
		label.appendChild(this.htmlinitialx);
		this.div.appendChild(label);
		
		// initial y
		label = document.createElement("label");
		label.appendChild(document.createTextNode("initial y: "));
		this.htmlinitialy = document.createElement("input");
		this.htmlinitialy.type = "text";
		this.htmlinitialy.style.width = 70;
		label.appendChild(this.htmlinitialy);
		this.div.appendChild(label);
	}
	
	if (this.mode == "differential2") {
		// initial slope
		label = document.createElement("label");
		label.appendChild(document.createTextNode("initial y': "));
		this.htmlinitialslope = document.createElement("input");
		this.htmlinitialslope.type = "text";
		this.htmlinitialslope.style.width = 70;
		label.appendChild(this.htmlinitialslope);
		this.div.appendChild(label);
	}
	
	// add div to bigger div
	document.getElementById("functions_list").appendChild(this.div);
	
	this.f = function() { return null; };
}

Function.prototype = {

	setColor: function(color) {
		this.div.children[0].style.color = color;
	},
	
	parse: function() {
		this.tokens = [];
		if (this.mode == "normal") {
			var exp = this.htmlfunction.value;
			this.parseTokens(exp);
			if (this.tokens.length != 0) {
				this.tokenindex = 0;
				var f = this.evalExpression();
				this.f = function(x) {
					this.x = x;
					return f();
				};
			} else {
				this.f = function() { return null; };
			}
		}
		else if (this.mode == "parametric") {
			var expx = this.htmlfunctionx.value;
			this.parseTokens(expx);
			if (this.tokens.length != 0) {
				this.tokenindex = 0;
				this.fx = this.evalExpression();
			} else {
				this.fy = function() { return null; };
			}
			this.tokens = [];
			var expy = this.htmlfunctiony.value;
			this.parseTokens(expy);
			if (this.tokens.length != 0) {
				this.tokenindex = 0;
				this.fy = this.evalExpression();
			} else {
				this.fy = function() { return null; };
			}
		}
		else if (this.mode == "differential") {
			var exp = this.htmlfunction.value;
			this.parseTokens(exp);
			if (this.tokens.length != 0) {
				this.tokenindex = 0;
				var slope = this.evalExpression();
				// using the Runge-Kutta method
				this.f = function(prev_x, prev_y, deltax) {
					this.x = prev_x;
					this.y = prev_y - 0;
					var m1 = slope();
					
					this.x = prev_x + deltax/2;
					this.y = prev_y + m1*(deltax/2);
					var m2 = slope();
					
					this.x = prev_x + deltax/2;
					this.y = prev_y + m2*(deltax/2);
					var m3 = slope();
					
					this.x = prev_x + deltax;
					this.y = prev_y + m3*deltax;
					var m4 = slope();
					
					return (deltax*(m1 + 2*(m2 + m3) + m4)/6) + prev_y - 0;
				};
			} else {
				this.f = function() { return null; };
			}
		}
		else if (this.mode == "differential2") {
			var exp = this.htmlfunction.value;
			this.parseTokens(exp);
			if (this.tokens.length != 0) {
				this.tokenindex = 0;
				var slopev = this.evalExpression();
				// using the Runge-Kutta method for second order equations
				this.f = function(prev_x, prev_y, prev_slope, deltax) {
					this.x = prev_x;
					this.y = prev_y - 0;
					this.v = prev_slope;
					var k1v = slopev();
					var k1y = this.v;
					
					this.x = prev_x + deltax/2;
					this.y = prev_y + k1y*(deltax/2);
					this.v = prev_slope + k1v*(deltax/2);
					var k2v = slopev();
					var k2y = this.v;
					
					this.x = prev_x + deltax/2;
					this.y = prev_y + k2y*(deltax/2);
					this.v = prev_slope + k2v*(deltax/2);
					var k3v = slopev();
					var k3y = this.v;
					
					this.x = prev_x + deltax;
					this.y = prev_y + k3y*deltax;
					this.v = prev_slope + k3v*deltax;
					var k4v = slopev();
					var k4y = this.v;
					
					var v = prev_slope + (deltax*(k1v+2*(k2v+k3v)+k4v)/6);
					var y = prev_y + (deltax*(k1y+2*(k2y+k3y)+k4y)/6);
					
					return {
						y: y,
						v: v
					};
				};
			} else {
				this.f = function() { return null; };
			}
		}
		if (typeof this.htmlstart != 'undefined') {
			this.startingpoint = parseFloat(this.htmlstart.value);
		}
	},
	
	/*
	* Productions:
	* 
	* Expression	::	Term (('+' | '-') Term)*
	*
	* Term			::	Exponent (('*' | '/') Exponent)*
	*
	* Exponent		::	Factor ('^' Factor)*
	* 
	* Factor		::	('-' Factor)
	* 					Value
	* 
	* Value			::	Literal
	*					Identifier
	*					Function
	*					'(' Expression ')'
	*
	* Function		::	('cos' | 'sin' | 'tan' |
	*						'arccos' | 'arcsin' | 'arctan' |
	*						'log' | 'ln' |
	*						'abs' | 'exp'|
	*						'sqrt' | 'theta' | 'sgn') '(' Expression ')'
	* 
	* Identifier	::	Alpha+ (''' | '`')?
	* 
	* Alpha			::	'a' .. 'z'
	*					'A' .. 'Z'
	*
	* Literal		::	Digits+ ('.' Digits*)?
	*					'.' Digits+
	*
	* Digits		::	'0' .. '9'
	*/
	evalExpression: function() {
		var left = this.evalTerm();
		var right;
		while (this.tokens[this.tokenindex] === "+" || this.tokens[this.tokenindex] === "-") {
			var op = this.tokens[this.tokenindex];
			this.tokenindex++;
			right = this.evalTerm();
			switch (op) {
				case '+':
					left = function(a, b) {
						return function() {
							return a() + b();
						};
					}(left,right);
					break;
				case '-':
					left = function(a, b) {
						return function() {
							return a() - b();
						};
					}(left,right);
					break;
					
				default:
					return;
			}
		}
		return left;
	},
	
	evalTerm: function() {
		var left = this.evalExponent();
		var right;
		while (this.tokens[this.tokenindex] === "*" || this.tokens[this.tokenindex] === "/") {
			var op = this.tokens[this.tokenindex];
			this.tokenindex++;
			right = this.evalExponent();
			switch (op) {
				case '*':
					left = function(a, b) {
						return function() {
							return a() * b();
						};
					}(left,right);
					break;
				case '/':
					left = function(a, b) {
						return function() {
							return a() / b();
						};
					}(left,right);
					break;
					
				default:
					return;
			}
		}
		return left;
	},
	
	evalExponent: function() {
		var left = this.evalFactor();
		var right;
		while (this.tokens[this.tokenindex] === "^") {
			var op = this.tokens[this.tokenindex];
			this.tokenindex++;
			right = this.evalFactor();
			switch (op) {
				case '^':
					left = function(a, b) {
						return function() {
							return Math.pow(a(), b());
						};
					}(left,right);
					break;
					
				default:
					return;
			}
		}
		return left;
	},
	
	evalFactor: function() {
		if (this.tokens[this.tokenindex] == "-") {
			this.tokenindex++;
			var unary = this.evalFactor();
			return function(a) {
				return function() {
					return -1 * a();
				};
			}(unary);
		} else {
			var unary = this.evalValue();
			return function(a) {
				return function() {
					return a();
				};
			}(unary);
		}
	},
	
	evalValue: function() {
		var val;
		this.tokens[this.tokenindex] = this.tokens[this.tokenindex].toLowerCase();
		// function
		if (/^(?:cos|sin|tan|arccos|arcsin|arctan|log|ln|abs|exp|sqrt|theta|sgn)$/.test(this.tokens[this.tokenindex])) {
			val = this.evalFunction();
		}
		// identifier
		else if (/[a-zA-Z]+['`]?/.test(this.tokens[this.tokenindex])) {
			switch (this.tokens[this.tokenindex]) {
				case "x":
					var self = this;
					val = function() {
						return self.x;
					};
					break;
				case "y":
					if (this.mode == "differential" || this.mode == "differential2") {
						var self = this;
						val = function() {
							return self.y;
						};
					}
					break;
				case "y'":
				case "y`":
					if (this.mode == "differential2") {
						var self = this;
						val = function() {
							return self.v;
						}
					}
					break;
				case "pi":
					val = function() {
						return Math.PI;
					};
					break;
				case "e":
					val = function() {
						return Math.E;
					};
					break;
				default:
					console.log("unknown variable", this.tokens[this.tokenindex]);
					break;
			}
			this.tokenindex++;
		}
		// number
		else if (/\d+(?:\.\d*)?|\.\d+/.test(this.tokens[this.tokenindex])) {
			var num = parseFloat(this.tokens[this.tokenindex]);
			val = function() {
				return num;
			};
			this.tokenindex++;
		}
		// parenthetical expression
		else if (/\(/.test(this.tokens[this.tokenindex])) {
			this.tokenindex++;
			val = this.evalExpression();
			this.tokenindex++;
		}
		
		else {
			val = null;
			console.log("unknown type of value");
		}
		
		return function(a) {
			return function() {
				return a();
			};
		}(val);
	},
	
	evalFunction: function() {
		var func = this.tokens[this.tokenindex];
		this.tokenindex++;
		var val = this.evalValue();
		switch (func) {
			case 'cos':
				return function(a) {
					return function() {
						return Math.cos(a());
					};
				}(val);
				break;
			case 'sin':
				return function(a) {
					return function() {
						return Math.sin(a());
					};
				}(val);
				break;
			case 'tan':
				return function(a) {
					return function() {
						return Math.tan(a());
					};
				}(val);
				break;
			case 'arccos':
				return function(a) {
					return function() {
						return Math.scos(a());
					};
				}(val);
				break;
			case 'arcsin':
				return function(a) {
					return function() {
						return Math.asin(a());
					};
				}(val);
				break;
			case 'arctan':
				return function(a) {
					return function() {
						return Math.atan(a());
					};
				}(val);
				break;
			case 'log':
			case 'ln':
				return function(a) {
					return function() {
						return Math.log(a());
					};
				}(val);
				break;
			case 'abs':
				return function(a) {
					return function() {
						return Math.abs(a());
					};
				}(val);
				break;
			case 'exp':
				return function(a) {
					return function() {
						return Math.exp(a());
					};
				}(val);
				break;
			case 'sqrt':
				return function(a) {
					return function() {
						return Math.sqrt(a());
					};
				}(val);
				break;
			case 'theta':
				return function(a) {
					return function() {
						if (a() > 0) return 1;
						if (a() == 0) return 0.5;
						if (a() < 0) return 0;
					};
				}(val);
				break;
			case 'sgn':
				return function(a) {
					return function() {
						if (a() > 0) return 1;
						if (a() == 0) return 0;
						if (a() < 0) return -1;
					};
				}(val);
				break;
			default:
				console.log("unknown function");
				break;
		}
	},
	
	parseTokens: function(s) {
		var scanregexp = /\s*([a-zA-Z]+['`]?)|(\d+(?:\.\d*)?|\.\d+)|(\+|-|\*|\/|\(|\)|\^)/g;    
		//                   1--------------1 2-------------------2 3-------------------3
		
		while (arr = scanregexp.exec(s)) {
			if (arr[1]) {
				// letters
				this.tokens.push(arr[1]);
			}
			else if (arr[2]) {
				// number
				this.tokens.push(arr[2]);
			}
			else if (arr[3]) {
				// punctuation: + - * / ( ) ^
				this.tokens.push(arr[3]);
			}
		}
	}
}