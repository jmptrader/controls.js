;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// doT.js
// 2011, Laura Doktorova, https://github.com/olado/doT
// Licensed under the MIT license.

(function() {
	"use strict";

	var doT = {
		version: '1.0.1',
		templateSettings: {
			evaluate:    /\{\{([\s\S]+?(\}?)+)\}\}/g,
			interpolate: /\{\{=([\s\S]+?)\}\}/g,
			encode:      /\{\{!([\s\S]+?)\}\}/g,
			use:         /\{\{#([\s\S]+?)\}\}/g,
			useParams:   /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
			define:      /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
			defineParams:/^\s*([\w$]+):([\s\S]+)/,
			conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
			iterate:     /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
			varname:	'it',
			strip:		true,
			append:		true,
			selfcontained: false
		},
		template: undefined, //fn, compile template
		compile:  undefined  //fn, for express
	};

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = doT;
	} else if (typeof define === 'function' && define.amd) {
		define(function(){return doT;});
	} else {
		(function(){ return this || (0,eval)('this'); }()).doT = doT;
	}

	function encodeHTMLSource() {
		var encodeHTMLRules = { "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': '&#34;', "'": '&#39;', "/": '&#47;' },
			matchHTML = /&(?!#?\w+;)|<|>|"|'|\//g;
		return function() {
			return this ? this.replace(matchHTML, function(m) {return encodeHTMLRules[m] || m;}) : this;
		};
	}
	String.prototype.encodeHTML = encodeHTMLSource();

	var startend = {
		append: { start: "'+(",      end: ")+'",      endencode: "||'').toString().encodeHTML()+'" },
		split:  { start: "';out+=(", end: ");out+='", endencode: "||'').toString().encodeHTML();out+='"}
	}, skip = /$^/;

	function resolveDefs(c, block, def) {
		return ((typeof block === 'string') ? block : block.toString())
		.replace(c.define || skip, function(m, code, assign, value) {
			if (code.indexOf('def.') === 0) {
				code = code.substring(4);
			}
			if (!(code in def)) {
				if (assign === ':') {
					if (c.defineParams) value.replace(c.defineParams, function(m, param, v) {
						def[code] = {arg: param, text: v};
					});
					if (!(code in def)) def[code]= value;
				} else {
					new Function("def", "def['"+code+"']=" + value)(def);
				}
			}
			return '';
		})
		.replace(c.use || skip, function(m, code) {
			if (c.useParams) code = code.replace(c.useParams, function(m, s, d, param) {
				if (def[d] && def[d].arg && param) {
					var rw = (d+":"+param).replace(/'|\\/g, '_');
					def.__exp = def.__exp || {};
					def.__exp[rw] = def[d].text.replace(new RegExp("(^|[^\\w$])" + def[d].arg + "([^\\w$])", "g"), "$1" + param + "$2");
					return s + "def.__exp['"+rw+"']";
				}
			});
			var v = new Function("def", "return " + code)(def);
			return v ? resolveDefs(c, v, def) : v;
		});
	}

	function unescape(code) {
		return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, ' ');
	}

	doT.template = function(tmpl, c, def) {
		c = c || doT.templateSettings;
		var cse = c.append ? startend.append : startend.split, needhtmlencode, sid = 0, indv,
			str  = (c.use || c.define) ? resolveDefs(c, tmpl, def || {}) : tmpl;

		str = ("var out='" + (c.strip ? str.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g,' ')
					.replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g,''): str)
			.replace(/'|\\/g, '\\$&')
			.replace(c.interpolate || skip, function(m, code) {
				return cse.start + unescape(code) + cse.end;
			})
			.replace(c.encode || skip, function(m, code) {
				needhtmlencode = true;
				return cse.start + unescape(code) + cse.endencode;
			})
			.replace(c.conditional || skip, function(m, elsecase, code) {
				return elsecase ?
					(code ? "';}else if(" + unescape(code) + "){out+='" : "';}else{out+='") :
					(code ? "';if(" + unescape(code) + "){out+='" : "';}out+='");
			})
			.replace(c.iterate || skip, function(m, iterate, vname, iname) {
				if (!iterate) return "';} } out+='";
				sid+=1; indv=iname || "i"+sid; iterate=unescape(iterate);
				return "';var arr"+sid+"="+iterate+";if(arr"+sid+"){var "+vname+","+indv+"=-1,l"+sid+"=arr"+sid+".length-1;while("+indv+"<l"+sid+"){"
					+vname+"=arr"+sid+"["+indv+"+=1];out+='";
			})
			.replace(c.evaluate || skip, function(m, code) {
				return "';" + unescape(code) + "out+='";
			})
			+ "';return out;")
			.replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r')
			.replace(/(\s|;|\}|^|\{)out\+='';/g, '$1').replace(/\+''/g, '')
			.replace(/(\s|;|\}|^|\{)out\+=''\+/g,'$1out+=');

		if (needhtmlencode && c.selfcontained) {
			str = "String.prototype.encodeHTML=(" + encodeHTMLSource.toString() + "());" + str;
		}
		try {
			return new Function(c.varname, str);
		} catch (e) {
			if (typeof console !== 'undefined') console.log("Could not create a template function: " + str);
			throw e;
		}
	};

	doT.compile = function(tmpl, def) {
		return doT.template(tmpl, null, def);
	};
}());

},{}],2:[function(require,module,exports){
/* doT + auto-compilation of doT templates
 *
 * 2012, Laura Doktorova, https://github.com/olado/doT
 * Licensed under the MIT license
 *
 * Compiles .def, .dot, .jst files found under the specified path.
 * It ignores sub-directories.
 * Template files can have multiple extensions at the same time.
 * Files with .def extension can be included in other files via {{#def.name}}
 * Files with .dot extension are compiled into functions with the same name and
 * can be accessed as renderer.filename
 * Files with .jst extension are compiled into .js files. Produced .js file can be
 * loaded as a commonJS, AMD module, or just installed into a global variable
 * (default is set to window.render).
 * All inline defines defined in the .jst file are
 * compiled into separate functions and are available via _render.filename.definename
 *
 * Basic usage:
 * var dots = require("dot").process({path: "./views"});
 * dots.mytemplate({foo:"hello world"});
 *
 * The above snippet will:
 * 1. Compile all templates in views folder (.dot, .def, .jst)
 * 2. Place .js files compiled from .jst templates into the same folder.
 *    These files can be used with require, i.e. require("./views/mytemplate").
 * 3. Return an object with functions compiled from .dot templates as its properties.
 * 4. Render mytemplate template.
 */

var fs = require("fs"),
	doT = module.exports = require("./doT");

doT.process = function(options) {
	//path, destination, global, rendermodule, templateSettings
	return new InstallDots(options).compileAll();
};

function InstallDots(o) {
	this.__path 		= o.path || "./";
	if (this.__path[this.__path.length-1] !== '/') this.__path += '/';
	this.__destination	= o.destination || this.__path;
	if (this.__destination[this.__destination.length-1] !== '/') this.__destination += '/';
	this.__global		= o.global || "window.render";
	this.__rendermodule	= o.rendermodule || {};
	this.__settings 	= o.templateSettings ? copy(o.templateSettings, copy(doT.templateSettings)) : undefined;
	this.__includes		= {};
}

InstallDots.prototype.compileToFile = function(path, template, def) {
	def = def || {};
	var modulename = path.substring(path.lastIndexOf("/")+1, path.lastIndexOf("."))
		, defs = copy(this.__includes, copy(def))
		, settings = this.__settings || doT.templateSettings
		, compileoptions = copy(settings)
		, defaultcompiled = doT.template(template, settings, defs)
		, exports = []
		, compiled = ""
		, fn;

	for (var property in defs) {
		if (defs[property] !== def[property] && defs[property] !== this.__includes[property]) {
			fn = undefined;
			if (typeof defs[property] === 'string') {
				fn = doT.template(defs[property], settings, defs);
			} else if (typeof defs[property] === 'function') {
				fn = defs[property];
			} else if (defs[property].arg) {
				compileoptions.varname = defs[property].arg;
				fn = doT.template(defs[property].text, compileoptions, defs);
			}
			if (fn) {
				compiled += fn.toString().replace('anonymous', property);
				exports.push(property);
			}
		}
	}
	compiled += defaultcompiled.toString().replace('anonymous', modulename);
	fs.writeFileSync(path, "(function(){" + compiled
		+ "var itself=" + modulename + ";"
		+ addexports(exports)
		+ "if(typeof module!=='undefined' && module.exports) module.exports=itself;else if(typeof define==='function')define(function(){return itself;});else {"
		+ this.__global + "=" + this.__global + "||{};" + this.__global + "['" + modulename + "']=itself;}}());");
};

function addexports(exports) {
	for (var ret ='', i=0; i< exports.length; i++) {
		ret += "itself." + exports[i]+ "=" + exports[i]+";";
	}
	return ret;
}

function copy(o, to) {
	to = to || {};
	for (var property in o) {
		to[property] = o[property];
	}
	return to;
}

function readdata(path) {
	var data = fs.readFileSync(path);
	if (data) return data.toString();
	console.log("problems with " + path);
}

InstallDots.prototype.compilePath = function(path) {
	var data = readdata(path);
	if (data) {
		return doT.template(data,
					this.__settings || doT.templateSettings,
					copy(this.__includes));
	}
};

InstallDots.prototype.compileAll = function() {
	console.log("Compiling all doT templates...");

	var defFolder = this.__path,
		sources = fs.readdirSync(defFolder),
		k, l, name;

	for( k = 0, l = sources.length; k < l; k++) {
		name = sources[k];
		if (/\.def(\.dot|\.jst)?$/.test(name)) {
			console.log("Loaded def " + name);
			this.__includes[name.substring(0, name.indexOf('.'))] = readdata(defFolder + name);
		}
	}

	for( k = 0, l = sources.length; k < l; k++) {
		name = sources[k];
		if (/\.dot(\.def|\.jst)?$/.test(name)) {
			console.log("Compiling " + name + " to function");
			this.__rendermodule[name.substring(0, name.indexOf('.'))] = this.compilePath(defFolder + name);
		}
		if (/\.jst(\.dot|\.def)?$/.test(name)) {
			console.log("Compiling " + name + " to file");
			this.compileToFile(this.__destination + name.substring(0, name.indexOf('.')) + '.js',
					readdata(defFolder + name));
		}
	}
	return this.__rendermodule;
};

},{"./doT":1,"fs":4}],3:[function(require,module,exports){
//     controls.js
//     purpose: UI framework, code generation tool
//     status: proposal, example, valid prototype, under development
//     demo:   http://aplib.github.io/controls.js/
//     issues: https://github.com/aplib/markdown-site-template/issues
//     (c) 2013 vadim b.
//     License: MIT
//
// require doT.js

(function() { "use strict"; var VERSION = '0.6.10';

function Controls(doT)
{
    var controls = this;
    controls.VERSION = VERSION;
    controls.id_generator = 53504; // use it only as per session elements id generator in controls constructors
    
    var IDENTIFIERS = ',add,attach,attributes,class,data,element,first,id,__type,controls,last,name,forEach,parameters,parent,remove,style,';
    var HTML_TAGS = 'A,Abbr,Address,Article,Aside,B,Base,Bdi,Bdo,Blockquote,Button,Canvas,Cite,Code,Col,Colgroup,Command,Datalist,Dd,Del,Details,\
Dfn,Div,Dl,Dt,Em,Embed,Fieldset,Figcaption,Figure,Footer,Form,Gnome,H1,H2,H3,H4,H5,H6,Header,I,IFrame,Img,Input,Ins,Kbd,Keygen,Label,Legend,Li,Link,Map,Mark,Menu,Meter,Nav,\
Noscript,Object,Ol,Optgroup,Option,Output,P,Pre,Progress,Ruby,Rt,Rp,S,Samp,Script,Section,Select,Small,Span,Strong,Style,Sub,Summary,Sup,\
Table,TBody,Td,Textarea,Tfoot,Th,Thead,Time,Title,Tr,U,Ul,Var,Video,Wbr';
    var ENCODE_HTML_MATCH = /&(?!#?\w+;)|<|>|"|'|\//g;
    var ENCODE_HTML_PAIRS = { "<": "&#60;", ">": "&#62;", '"': '&#34;', "'": '&#39;', "&": "&#38;", "/": '&#47;' };
    var DECODE_HTML_MATCH = /&#(\d{1,8});/g;
    controls.subtypes = {}; // Registered subtypes
    controls.doT = doT; // reexport need for gencodes
    // BUG doT strip modifies the pattern incorrectly assuming that it is composed entirely of HTML code, FIX:
    try{doT.templateSettings.strip=0;}catch(e){}
    // BUG2 Safari throw error on fix this bug, FIX2 place this condition:
    if (doT.templateSettings.strip)
        throw new SyntaxError('Due to bugs and the inability to cross-browser fix them, please remove strip option in doT library! #112');
    
    // Initialize control object
    // 
    // type (string) - path.type and initial set of parameters
    //  format: path.type[/inheritable parameters][#not inheritable parameters]
    //  parameters:
    //  1. parameter name - add parameter and set value to boolean true
    //  2. parameter name=value - add parameter and set value
    //  3. -parameter name - remove parameter from inheritance (TODO)
    //  
    //  example: bootstrap.Button#size=2;style=info
    //  
    controls.controlInitialize = function(object, __type, parameters, _attributes, outer_template, inner_template)
    {
        var attributes = _attributes || {};
        
        if (!attributes.id)
            attributes.id = (++controls.id_generator).toString(16); // set per session uid
        
        object.id           = attributes.id;    // This should be a unique identifier. Value  will be assigned to the 'id' attribute of DOM element.
        object.__type       = __type;
        object.parameters   = parameters || {};
        object.attributes   = attributes;       // The object contains data to generate html code,  $icon, class, style, $text etc
        object.controls     = [];               // This is a collection of nested objects
        
        if (outer_template)
        Object.defineProperty(object, "outer_template",
        {
            enumerable: true, writable: true,
            value: (typeof(outer_template) === 'string') ? doT.template(outer_template) : outer_template
        });

        if (inner_template)
        Object.defineProperty(object, "inner_template",
        {
            enumerable: true, writable: true,
            value: (typeof(inner_template) === 'string') ? doT.template(inner_template) : inner_template
        });
    };
    
    // plug in control constructor to the controls infrastructure
    // 
    // __type {string} - unique type identifier contains namespace and name, like 'controls.Button'
    // constructor {function} - constructor function
    // [template] {string,function} - text or template function
    // [revive] {function} -  json revive function
    //
    controls.typeRegister = function(type, constructor, revive)
    {
        controls.factoryRegister(type, constructor);
        constructor.is_constructor = true;
        constructor.revive = revive;
    };
    
    controls.factoryRegister = function(type, factory_method)
    {
        var key_parameters = {},
            __type = parse_type(type, key_parameters) .toLowerCase();
        
        if (__type.length < type.length) // type is subtype with parameters, register to controls.subtypes
        {
            var subtypes_array = controls.subtypes[__type];
            if (!subtypes_array)
            {
                subtypes_array = [];
                controls.subtypes[__type] = subtypes_array;
            }
            key_parameters.__ctr = factory_method;
            subtypes_array.push(key_parameters);
        }
        else
        {
            // check name conflict
            if (controls[__type])
                throw new TypeError('Type ' + type + ' already registered!');
            
            controls[__type] = factory_method;
        }
    };
    
    // Register existing parameterized type as a standalone type.
    // 
    // alias {string} - simple type identifier
    // type {string} - type with parameters, basic for this type must be an already existing.
    //
    controls.typeAlias = function(alias, type)
    {
        var parameters = {},
            __type = parse_type(type, parameters) .toLowerCase(),
            constructor = resolve_ctr(__type, parameters);
        if (!constructor)
            throw new TypeError('Type ' + __type + ' not registered!');
            
        controls[alias.toLowerCase()] = { __type: __type, parameters: parameters, isAlias: true };
    };
    
    //
    controls.createTemplatedControl = function(__type, outer_template, inner_template)
    {
        var name = __type,
            dotpos = name.indexOf('.');
        if (dotpos >= 0)
            name = __type.substr(dotpos + 1);
        outer_template = (typeof(outer_template) === "string") ? doT.template(outer_template) : outer_template;
        inner_template = (typeof(inner_template) === "string") ? doT.template(inner_template) : inner_template;
        var gencode =
'var __type = __type;\
function ' + name + '(p, a)\
{\
    controls.controlInitialize(this, __type, p, a, outer_template, inner_template);\
};\
' + name + '.prototype = controls.control_prototype;\
controls.typeRegister(__type, ' + name + ');';
        Function('controls, __type, outer_template, inner_template', gencode) (controls, __type, outer_template, inner_template);
    };
  

    
// >> Events
    
    controls.Event = function(listeners_data)
    {
        var listeners = new Array();
        this.listeners = listeners;

        this.raise = function()
        {
            for(var i = 0, c = listeners.length; i < c; i+=2)
                listeners[i].apply(listeners[i+1], arguments);
        };
        
//        // revive JSON
//        if (listeners_data)
//        {
//            for(var i = 0, c = listeners_data.length; i < c; i+=2)
//            {
//                var json_listener = listeners_data[i];
//                var listener_func = (typeof json_listener === 'function') ? json_listener : Function('event', json_listener);
//                listeners.push(listener_func);
//                listeners.push(listeners_data[i+1]);
//            }
//        }
    };
    controls.Event.prototype =
    {
        addListener: function(call_this/*optional*/, listener)
        {
            if (typeof(call_this) === 'function')
            {
                listener = call_this;
                call_this = this;
            }
            
            if (!listener)
                return;
            
            var listeners = this.listeners;
            listeners.push(listener);
            listeners.push(call_this);
        },

        removeListener: function(listener)
        {
            var listeners = this.listeners,
                index = listeners.indexOf(listener);
            if (index >= 0)
                listeners.splice(index, 2);
        },
        
        clear: function()
        {
            this.listeners = [];
        }

//        toJSON: function()
//        {
//            var json = [];
//            var listeners = this.listeners;
//                        
//            // Serialize listeners
//            
//            for(var i = 0, c = listeners.length; i < c; i+=2)
//            {
//                var event_func = listeners[i];
//                json.push(extract_func_code(event_func));
//                json.push(listeners[i+1]);
//            }
//            
//            return json;
//        }
    };
    
    // Post processing
    
    var post_events = [];
    setInterval(function()
    {
        if (post_events.length > 0)
        for(var i = 0, c = post_events.length; i < c; i++)
        {
            try
            {
                post_events[i].post_event.raise();
            }
            catch (e) { console.log(e); }
            
            post_events.length = 0;
        };
        
    }, 30);
    
// >> Data objects
    
    var data_object_common =
    {
        listen: function(call_this/*optional*/, listener)
        {
            if (typeof(call_this) === 'function')
            {
                listener = call_this;
                call_this = this;
            }
            
            if (!listener)
                return this;
            
            if (!this.event)
                this.event = new controls.Event(this);
            
            this.event.addListener(call_this, listener);
            
            return this;
        },
                
        removeListener: function(listener)
        {
            var event = this.event;
            if (event)
                event.removeListener(listener);
            
            return this;
        },
        
        subscribe: function(call_this/*optional*/, listener)
        {
            if (typeof(call_this) === 'function')
            {
                listener = call_this;
                call_this = this;
            }
            
            if (!listener)
                return this;
            
            if (!this.post_event)
                this.post_event = new controls.Event(this);
            
            this.post_event.addListener(call_this, listener);
            
            return this;
        },
        
        unsubscribe: function(listener)
        {
            var post_event = this.post_event;
            if (post_event)
                post_event.removeListener(listener);
            
            return this;
        },
                
        raise: function()
        {
            var event = this.event;
            if (event)
                event.raise.apply(this, arguments);
            
            var post_event = this.post_event;
            if (post_event)
            {
                var index = post_events.indexOf(this);
                if (index < 0 || index !== post_events.length - 1)
                {
                    if (index >= 0)
                        post_events.splice(index, 1);
                    post_events.push(this);
                }
            }
        },
        
        set: function(name, value)
        {
            this.state_id++;
            this[name] = value;
            this.last_name = name;
            this.raise();
        },
        setx: function(collection)
        {
            var modified;
            for(var prop in collection)
            if (collection.hasOwnProperty(prop))
            {
                modified = true;
                this.state_id++;
                this[prop] = collection[prop];
                this.last_name = collection;
            }
            if (modified)
                this.raise();
        }
    };
    
    function DataObject(parameters, attributes)
    {
        this.state_id = Number.MIN_VALUE;
    }
    DataObject.prototype = data_object_common;
    controls.typeRegister('DataObject', DataObject);
    
    var data_array_common =
    {
        // ops: 1 - insert, 2 - remove, ...
        push: function(item)
        {
            var proto = Object.getPrototypeOf(this);
            for(var i = 0, c = arguments.length; i < c; i++)
                proto.push.call(this, arguments[i]);
            this.state_id += c;
            this.last_operation = 1;
            this.last_index = this.length - 1;
            this.raise(this);
        }
        // TODO
    };
        
    function LocalStorageAdapter(parameters, attributes)
    {
    };
    LocalStorageAdapter.prototype =
    {
        raise: function(type) {}
    };
    controls.typeRegister('LocalStorage', LocalStorageAdapter);
    
    // DataArray
    // 
    // Parameters:
    // adapter {string} - registered type
    // Attributes:
    // data - an array of values for the initial filling of the data array
    //
    // No!Brrr! TODO this
    function DataArray(parameters, attributes) // factory method
    {
        var array = [];
        
        if (attributes)
        {
            // $data
            var data = attributes.$data;
            if (data)
                for(var i = 0, c = data.length; i < c; i++)
                    array[i] = data[i];
        }
        
        for(var prop in data_object_common)
            array[prop] = data_object_common[prop];
        for(var prop in data_array_common)
            array[prop] = data_array_common[prop];
        
        array.state_id       = Number.MIN_VALUE;   // Value identifying the state of the object is incremented each state-changing operation
        array.last_operation = 0;                  // Last state-changing operation
        array.last_changed   = undefined;          // Last changed property name or index
        
        if (parameters && parameters.adapter)
        {
            this.adapter = controls.create(parameters.adapter);
            if (!this.adapter)
                throw new TypeError('Invalid data adapter type "' + parameters.adapter + '"!');
        }
        
        return array;
    }
    controls.factoryRegister('DataArray', DataArray);
    
// >> Controls prototype
    
    controls.control_prototype = new function()
    {
        Object.defineProperty(this, "$",
        {
            enumerable: true, 
            get: function() { return (this._element) ? $(this._element) : $('#' + this.id); }
        });
        
        Object.defineProperty(this, "name",
        {
            enumerable: true, 
            get: function() { return this._name; },
            set: function(value)
            {
                if (IDENTIFIERS.indexOf(',' + value + ',') >= 0)
                    throw new SyntaxError('Invalid name "' + value + '"!');

                var name = this._name;
                if (value !== name)
                {
                    this._name = value;

                    var parent = this._parent;
                    if (parent)
                    {
                        if (name && parent.hasOwnProperty(name) && parent[name] === this)
                            delete parent[name];

                        if (value)
                            parent[value] = this;
                    }
                }
            }
        });
        
        // The associated element of control
        Object.defineProperty(this, "element",
        {
            enumerable: true,
            get: function() { return this._element; },
            set: function(attach_to_element)
            {
                if (arguments.length === 0)
                    return this._element;

                var element = this._element;
                if (attach_to_element !== element)
                {
                    this._element = attach_to_element;

                    var events = this.events;
                    if (events)
                    for(var event_type in events)
                    {
                        var event = events[event_type];
                        if (event.is_dom_event)
                        {
                            // remove event raiser from detached element

                            if (element)
                                element.removeEventListener(event.event, event.raise, event.capture);

                            // add event raiser as listener for attached element

                            if (attach_to_element)
                                attach_to_element.addEventListener(event.event, event.raise, event.capture);
                        }
                    }

                    this.raise('element', attach_to_element);
                }
            }
        });
        
        function setParent(value, index)
        {
            var parent = this._parent;
            if (value !== parent)
            {
                this._parent = value;
                var name = this._name;
                
                if (parent)
                {
                    var parent_controls = parent.controls,
                        index = parent_controls.indexOf(this);
                    if (index >= 0)
                        parent_controls.splice(index, 1);
                    
                    if (name && parent.hasOwnProperty(name) && parent[name] === this)
                        delete parent[name];
                }
                
                if (value)
                {
                    var value_controls = value.controls;

// profiling: very expensive operation
//                    var index = value_controls.indexOf(this);
//                    if (index >= 0)
//                        parent_controls.splice(index, 1);
                    if (index === undefined)
                        value_controls.push(this);
                    else
                        value_controls.splice(index, 0, this);
                    
                    if (name)
                        value[name] = this;
                }
                
                this.raise('parent', value);
            }
        }
        Object.defineProperty(this, "parent",
        {
            enumerable: true,
            get: function() { return this._parent; },
            set: setParent
        });
        
        Object.defineProperty(this, 'wrapper',
        {
            enumerable: true,
            get: function() { return this._wrapper; },
            set: function(value)
            {
                var wrapper = this._wrapper;
                if (value !== wrapper)
                {
                    this._wrapper = value;

                    if (wrapper)
                    {
                        var wrapper_controls = wrapper.controls;
                        var index = wrapper_controls.indexOf(this);
                        if (index >= 0)
                            wrapper_controls.splice(index, 1);
                    }

                    if (value)
                    {
                        var value_controls = value.controls;

    // profiling: indexOf very expensive operation
    //                    var index = value_controls.indexOf(this);
    //                    if (index >= 0)
    //                        wrapper_controls.splice(index, 1);

                        value_controls.push(this);

                        // TODO value.refresh();
                    }
                }
            }
        });
        
        Object.defineProperty(this, 'length', { enumerable: true, get: function() { return this.controls.length; } });
        Object.defineProperty(this, 'first',  { enumerable: true, get: function() { return this.controls[0]; } });
        Object.defineProperty(this, 'last',   { enumerable: true, get: function() { return this.controls[this.controls.length-1]; } });
        
        // default html template
        this.outer_template = function(it) { return '<div' + it.printAttributes() + '>' + (it.attributes.$text || '') + it.printControls() + '</div>'; };
        controls.default_outer_template = this.outer_template;
        // default inner html template
        this.inner_template = function(it) { return (it.attributes.$text || '') + it.printControls(); };
        controls.default_inner_template = this.inner_template;
        // default inline template
        this.outer_inline_template = function(it) { return '<span' + it.printAttributes() + '>' + (it.attributes.$text || '') + it.printControls() + '</span>'; };
        controls.default_outer_inline_template = this.outer_inline_template;

        // snippets:
        // 
        // {{? it.attributes.$icon }}<span class="{{=it.attributes.$icon}}"></span>&nbsp;{{?}}
        // {{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}
        // include list of subcontrols html:
        // {{~it.controls :value:index}}{{=value.wrappedHTML()}}{{~}}

        this.innerHTML = function()
        {
            // assemble html
            return this.inner_template(this);
        };
        
        this.outerHTML = function()
        {
            // assemble html
            return this.outer_template(this);
        };
        
        this.wrappedHTML = function()
        {
            var wrapper = this._wrapper;
            return (wrapper) ? wrapper.wrappedHTML() : this.outerHTML();
        };
        
        // set template text or template function
        this.template = function(outer_template, inner_template)
        {
            if (outer_template)
            {
                if (!this.hasOwnProperty("outer_template"))
                    Object.defineProperty(this, "outer_template", { configurable: true, enumerable: true, writable: true });
                
                var type = typeof(outer_template);
                if (type === 'string')
                {
                    this.outer_template = doT.template(outer_template);        // template function
                    this.outer_template_text = outer_template;                 // save template text for serialization
                }
                else if (type === 'function')
                {
                    this.outer_template = outer_template;
                    this.outer_template_text = '@func';
                }
            }
            
            if (inner_template)
            {
                if (!this.hasOwnProperty("inner_template"))
                    Object.defineProperty(this, "inner_template", { configurable: true, enumerable: true, writable: true });
            
                type = typeof(inner_template);
                if (type === 'string')
                {
                    this.inner_template = doT.template(inner_template);        // template function
                    this.inner_template_text = inner_template;                 // save template text for serialization
                }
                else if (type === 'function')
                {
                    this.inner_template = inner_template;
                    this.inner_template_text = '@func';
                }
            }
            
            if (this._element)
                this.refresh();
        };
        
        this.toJSON = function()
        {
            var json = { __type: this.type(), id: this.id, name: this.name, attributes: this.attributes, controls: this.controls };
            
            var outer_template_text = this.outer_template_text;
            if (outer_template_text)
                json.outer_template = (outer_template_text === '@func')
                    ? '' + this.outer_template
                    : this.outer_template_text;
                    
            var inner_template_text = this.inner_template_text;
            if (inner_template_text)
                json.inner_template = (inner_template_text === '@func')
                    ? '' + this.inner_template
                    : this.inner_template_text;
                    
            return json;
        };
        
        // TODO: remove excess refresh calls
        this.refresh = function()
        {
            var element = this._element;
            if (element)
            {
                if (!element.parentNode)
                {
                    // orphaned element
                    this._element = undefined;
                }
                else
                try
                {
                    // Setting .outerHTML breaks hierarchy DOM, so you need a complete re-initialisation bindings to DOM objects.
                    // Remove wherever possible unnecessary calls .refresh()

                    var html = this.outerHTML();
                    if (html !== element.outerHTML)
                    {
                        this.detachAll();
                        element.outerHTML = html;
                        this.attachAll();
                    }
                }
                catch (e)
                {
                    // Uncaught Error: NoModificationAllowedError: DOM Exception 7
                    //  1. ? xml document
                    //  2. ? "If the element is the root node" ec orphaned element
                    this._element = undefined;
                }
            }
        };
        
        this.refreshInner = function()
        {
            var element = this._element;
            if (element)
                element.innerHTML = this.innerHTML();
        };
        
        // Attach to DOM element
        this.attach = function(something)
        {
            this.element = (typeof(something) === 'object') ? (something._element || something) : document.getElementById(something || this.id);
        };
        
        // Attach this and all nested controls to DOM by id
        this.attachAll = function()
        {
            if (!this._element)
                this.element = document.getElementById(this.id);
            
            for(var ctrls = this.controls, i = 0, c = ctrls.length; i < c; i++)
                ctrls[i].attachAll();
        };
        
        // Detach from DOM
        this.detach = function()
        {
            this.element = undefined;
        };
        
        // Detach this and all nested from DOM
        this.detachAll = function()
        {
            this.element = undefined;
            for(var ctrls = this.controls, i = 0, c = ctrls.length; i < c; i++)
                ctrls[i].detachAll();
        };
        
        // Replace control in the hierarchy tree
        this.replaceItself = function(control)
        {
            var controls = this.controls;

            // .controls may be a DataArray
            for(var i = controls.length - 1; i >= 0; i--)
                control.add(controls.shift());
            
            var parent = this.parent;
            if (!parent)
                control.parent = undefined;
            else
            {
                var index = parent.controls.indexOf(this);
                this.parent = undefined;
                setParent.call(control, parent, index);
            }
            var element = this._element;
            if (!element)
                control.element = undefined;
            else
            {
                control.element = element;
                control.refresh(); // rewrite dom
            }
        };
        
        // opcode {number} - 0 - insert before end, 1 - insert after begin, 2 - insert before, 3 - insert after
        this.createElement = function(node, opcode)
        {
            var element = this._element;
            if (element)
                throw new TypeError('Already exists!');
            
            if (!node && this.parent) {
                node = this.parent.element;
                opcode = 0;
            }
            
            if (node)
            {
                var insertAdjacentHTML = node.insertAdjacentHTML;
                if (insertAdjacentHTML)
                {
                    switch(opcode)
                    {
                        case 1:
                            insertAdjacentHTML.call(node, 'afterbegin', this.outerHTML());
                            break;
                        case 2:
                            insertAdjacentHTML.call(node, 'beforebegin', this.outerHTML());
                            break;
                        case 3:
                            insertAdjacentHTML.call(node, 'afterend', this.outerHTML());
                            break;
                        default:
                            // illegal invocation on call this method brfore element completed
                            insertAdjacentHTML.call(node, 'beforeend', this.outerHTML());
                    }
                }
                else
                {
                    // insertAdjacentHTML not implemented
                    
                    var fragment = document.createDocumentFragment();
                    var el = document.createElement('div');
                    el.innerHTML = this.outerHTML();
                    var nodes = el.childNodes, buf = [];
                    for(var i = 0, c = nodes.length; i < c; i++)
                        buf.push(nodes[i]);
                    for(var i = 0, c = buf.length; i < c; i++)
                        fragment.appendChild(buf[i]);
                    
                    switch(opcode)
                    {
                        case 1:
                            if (node.childNodes.length === 0)
                                node.appendChild(fragment);
                            else
                                node.insertBefore(node.firstChild, fragment);
                            break;
                        case 2:
                            var nodeparent = node.parentNode;
                            if (nodeparent)
                                nodeparent.insertBefore(fragment, node);
                            break;
                        case 3:
                            var nodeparent = node.parentNode;
                            if (nodeparent) {
                                var next_node = node.nextSibling;
                                if (next_node)
                                    nodeparent.insertBefore(fragment, next_node);
                                else
                                    nodeparent.appendChild(fragment);
                            }
                            break;
                        default:
                            node.appendChild(fragment);
                    }
                }
            }
            
            this.attachAll();
        };
        
        this.deleteElement = function()
        {
            var element = this._element;
            if (element)
            {
                var parent_node = element.parentNode;
                if (parent_node)
                    parent_node.removeChild(element);
                this._element = undefined;
            }
        };
        
        this.deleteAll = function()
        {
            this.deleteElement();
            
            var subcontrols = this.controls;
            for(var i = subcontrols.length - 1; i >= 0; i--)
                subcontrols[i].deleteAll();
        };
        
        var dom_events =
',change,DOMActivate,load,unload,abort,error,select,resize,scroll,blur,DOMFocusIn,DOMFocusOut,focus,focusin,focusout,\
click,dblclick,mousedown,mouseenter,mouseleave,mousemove,mouseover,mouseout,mouseup,wheel,keydown,keypress,keyup,oncontextmenu,\
compositionstart,compositionupdate,compositionend,DOMAttrModified,DOMCharacterDataModified,DOMNodeInserted,\
DOMNodeInsertedIntoDocument,DOMNodeRemoved,DOMNodeRemovedFromDocument,DOMSubtreeModified,';
        function force_event(_this, type, capture)
        {
            var events = _this.events;
            if (!events)
            {
                events = {};
                _this.events = events;
            }
            
            var key = (capture) ? ('#'/*capture*/ + type) : type;
            var event = events[key];
            if (!event)
            {
                event = new controls.Event();
                event.event = type;         // "event"
                event.is_dom_event = !!(dom_events.indexOf(',' + type + ',') >= 0);         // "event"
                event.capture = capture;    // "capture"
                events[key] = event;
                
                // DOM listener if attached
                
                if (dom_events.indexOf(type) >= 0)
                {
                    var element = _this._element;
                    if (element)
                        element.addEventListener(type, event.raise, capture);
                }
            }
            
            return event;
        };
        
        // Set or remove event listener. Event type may be DOM event as "click" or special control event as "type"
        //
        // type {string} - a string representing the event type to listen for. (without "on") example: "click"
        // [call_this {object}] - 
        // listener {string,function(event)} - event listener function or function body text
        // [capture {bool}] - 
        //
        this.listen = function(type, call_this/*optional*/, listener, capture/*optional*/)
        {
            if (typeof(call_this) === 'function')
            {
                capture = listener;
                listener = call_this;
                call_this = this;
            }
            
            if (!type || !listener)
                return this;
            
            var event = force_event(this, type, capture);
            
            // listener as string acceptable:
            var listener_func = (typeof listener === 'function') ? listener : Function('event', listener);
            
            event.addListener(call_this, listener_func);
            
            return this;
        };
        
        // Alias for listen()
        this.addListener = function(type, call_this/*optional*/, listener, capture)
        {
            return this.listen(type, call_this, listener, capture);
        };
        
        this.removeListener = function(type, listener, capture)
        {
            if (!type || !listener)
                return this;
            
            var event = force_event(this, type, capture);
            
            // listener as string inacceptable!
            event.removeListener(listener);
            
            return this;
        };
        
        this.raise = function(type)
        {
            if (!type)
                return false;

            var events = this.events;
            if (events) {
                var capture_event = events['#' + type],
                    event = events[type],
                    args = Array.prototype.slice.call(arguments, 1);
            
                if (capture_event)
                    capture_event.raise.apply(this, args);

                if (event)
                    event.raise.apply(this, args);
            }
        };
        
        this.parameter = function(name, value)
        {
            var parameters = this.parameters;
            
            if (arguments.length > 1)
            {
                if (value !== parameters[name])
                {
                    parameters[name] = value;
                    this.refresh();
                }
            }
            else
                return parameters[name] || parameters['/'+name];
        };
        
        // set attribute value
        this.attr = function(name, value)
        {
            var attributes = this.attributes;
            
            if (arguments.length === 0)
                return undefined;
            
            if (arguments.length === 1)
                return attributes[name];
            
            if (value !== attributes[name])
            {
                attributes[name] = value;
                
                if (this._element)
                    this.refresh();
            }
        };
        
        // set attributes
        this.attrs = function(_attributes)
        {
            var attributes = this.attributes;
            
            if (arguments.length > 0)
            {
                var updated = false;

                for(var prop in _attributes)
                {
                    var value = _attributes[prop];
                    if (value !== attributes[prop])
                    {
                        attributes[prop] = value;
                        updated = true;
                    }
                }

                if (updated && this._element)
                    this.refresh();
            }
            
            return attributes;
        };
        
        // get/set path.type/parameters
        this.type = function(type, apply_inherited)
        {
            // >> get type
            
            if (arguments.length === 0)
            {
                var inheritable = [];
                var unheritable = [];
                var parameters = this.parameters;
                for(var prop in parameters)
                {
                    if (prop[0] !== '/')
                    {
                        // not inheritable parameters
                        unheritable.push(prop + '=' + parameters[prop]);
                    }
                    else
                    {
                        // inheritable parameters
                        inheritable.push(prop.substr(1) + '=' + parameters[prop]);
                    }
                }
                
                var type = this.__type;
                if (inheritable.length > 0)
                    type += '/' + inheritable.join(';');
                if (unheritable.length > 0)
                    type += '#' + unheritable.join(';');

                return type;
            }
            
            // << get type
            
            // >> set type and parameters
            
            var parameters = {}; // replace parameters collection
            
            if (apply_inherited && this.parent)
            {
                // get inheritable parameters from this object for transfer to the created object

                var parent_parameters = parent.parameters;
                for(var prop in parent_parameters)
                if (prop[0] === '/')
                    parameters[prop] = parent_parameters[prop];
            }
            
            var __type = parse_type(type, parameters, this.__type);
            if (__type)
                this.__type = __type;
            
            this.parameters = parameters;

            this.raise('type');
            
            // no automatic refresh() calls
            
            // << set type and parameters
        };
        
        // Get html code of the selected attributes
        // 
        // attributes (optional, string) - attributes, comma separated list
        // exclude (optional, bool) - use first argument as filter (false) or exclude list (true)
        // example: it.printAttributes("style") - result only one style attribute 'style="..."'
        // example: it.printAttributes("-id") - result attributes all exclude id
        //
        this.printAttributes = function(filter)
        {
            var result = [];
            var attributes = this.attributes;
            
            if (filter)
            {
                // TODO: temporary inserted this checking:
                if (filter.indexOf(',') >= 0)
                    console.log('printAttributes() Use a space to separate of identifiers');
                
                if (filter[0] === '-')
                {
                    // exclusion defined

                    var exclude = filter.substr(1).split(' ');
                    for(var prop in this.attributes)
                    if (prop[0] !== '$' && exclude.indexOf(prop) < 0)
                    {
                        var value = attributes[prop];
                        if (value)
                            result.push(prop + '="' + value + '"');
                    }
                }
                else
                {
                    // list of attributes
                    
                    var attrs = filter.split(' ');
                    for(var i = 0, c = attrs.length; i < c; i++)
                    {
                        var key = attrs[i];
                        var value = attributes[key];
                        if (value)
                            result.push(key + '="' + value + '"');
                    }
                }
            }
            else
            {
                // unconditional out all attributes
                for(var prop in attributes)
                if (prop[0] !== '$')
                {
                    var value = attributes[prop];
                    if (value)
                        result.push(prop + '="' + value + '"');
                }
            }
            
            return (result.length) ? (' '+ result.join(' ')) : '';
        };
        
        this.printControls = function()
        {
            var result = [];
            for(var ctrls = this.controls, i = 0, c = ctrls.length; i < c; i++)
                result.push(ctrls[i].wrappedHTML());
            return result.join('');
        };
        
        // Set .$text attribute on this object and refresh DOM element.outerHTML
        this.text = function(_text)
        {
            var attributes = this.attributes;
            if (arguments.length)
            {
                if (_text !== attributes.$text)
                {
                    attributes.$text = _text;
                    this.refresh();
                }
            }
            return attributes.$text;
        };
        
        this.style = function(_style)
        {
            if (arguments.length)
            {
                var attributes = this.attributes, style = attributes.style;

                if (_style !== style)
                {
                    attributes.style = _style;
                    
                    var element = this._element;
                    if (element)
                        element.style = _style;
                    
                    this.raise('attributes', 'style', _style);
                };
            }
            
            return this.attributes.style;
        };
        
        this.class = function(set, remove)
        {
            var attributes = this.attributes;
            
            if (set || remove)
            {
                var _class = attributes.class;
                var classes = (_class) ? _class.split(' ') : [];
                
                if (remove)
                {
                    remove = remove.split(' ');
                    for(var i = 0, c = remove.length; i < c; i++)
                    {
                        var remove_class = remove[i];
                        var index = classes.indexOf(remove_class);
                        if (index >= 0)
                            classes.splice(index, 1);
                    }
                }
                
                if (set)
                {
                    set = set.split(' ');
                    for(var i = 0, c = set.length; i < c; i++)
                    {
                        var set_class = set[i];
                        if (classes.indexOf(set_class) < 0)
                            classes.push(set_class);
                    }
                }
                
                _class = classes.join(' ');
                if (_class !== attributes.class)
                {
                    attributes.class = _class;
                    
                    var element = this._element;
                    if (element)
                        element.className = _class;
                    
                    this.raise('attributes', 'class', _class);
                }
            }
            
            return attributes.class;
        };
        
        // Create control and insert to the .controls collection
        //
        // type
        //  {string} - type and parameters like 'layout/float=left'
        //  {object} - control object
        //  {string, semicolon separated list}
        //  {array} - array of any type arguments
        // [repeats] {Number} - optional, specify the number of created controls
        // [attrs_or_callback] {Object,Function} - pass attributes or callback function to initialize the created object
        // [this_arg] {Object} - 'this' argument for callback call
        //
        this.insert = function(index, type, /*optional*/ repeats, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg)
        {
            if (!type)
                return;
            
            // normalize arguments
            
            if (typeof repeats !== 'number')
            {
                this_arg = callback;
                callback = attributes;
                attributes = repeats;
                repeats = 1;
            }

            if (typeof attributes === 'function')
            {
                this_arg = callback;
                callback = attributes;
                attributes = undefined;
            }
                
            // type of first srgument
            
            if (Array.isArray(type))
            {
                // collection detected
                var result;
                
                for(var i = 0, c = type.length; i < c; i++)
                    result = this.add(type[i], repeats, attributes, callback, this_arg);
                
                return result;
            }
            
            if (typeof type === 'object')
            {
                // it is a control?
                var add_control = type;
                if (add_control.hasOwnProperty('__type'))
                    //add_control.parent = this;
                    setParent.call(type, this, index);
                
                return;
            }
            
            // parse name for new control
            
            var name;
            var colonpos = type.indexOf(':');
            var leftpos = type.indexOf('{');
            if (colonpos >= 0 && (leftpos < 0 || colonpos < leftpos))
            {
                // name: syntax detected
                name = type.substr(0, colonpos);
                type = type.substr(colonpos + 1);
            }
            
            // get inheritable parameters from this object for transfer to the created object
            
            var inheritable_parameters = this.parameters;
            var parameters = {};
            for(var prop in inheritable_parameters)
            if (prop[0] === '/')
                parameters[prop] = inheritable_parameters[prop];
            
            // resolve constructor
            var __type = parse_type(type, parameters/*, this.__type*/);
            var constructor = resolve_ctr(__type, parameters);
            
            // type error processing
            if (!constructor)
            {
                if (!type_error_mode)
                    throw new TypeError('Type ' + __type + ' not registered!');
                else
                {
                    // route to Stub
                    parameters['#{type}'] = type; // pass original type
                    parameters['#{__type}'] = __type;
                    parameters['#{callback}'] = callback;
                    parameters['#{this_arg}'] = this_arg;
                    constructor = resolve_ctr('controls.Stub', parameters);
                }
            }
            
            var result;
            
            // loop for create control(s)
            
            for(var i = 0; i < repeats; i++)
            {
                // prepare parameters and attributes
                
                var params = {};
                var attrs = {class:''};
                
                for(var prop in parameters)
                {
                    params[prop] = parameters[prop];
                    if (prop[0] === '$')
                        attrs[prop.substr(1)] = parameters[prop];
                }
                
                if (attributes)
                for(var prop in attributes)
                    attrs[prop] = attributes[prop];
            
                // create control(s)
                
                var new_control = new constructor(params, attrs);

                if (name)
                    new_control.name = name;
                
                // reflect after creation
                new_control.raise('type');
                
                // set parent property
                setParent.call(new_control, this, index);
            
                // callback
                if (callback)
                    callback.call(this_arg || this, new_control);
                
                result = new_control;
            }

            return result;
        };
        
        this.add = function(type, /*optional*/ repeats, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg)
        {
            return this.insert(this.controls.length, type, repeats, attributes, callback, this_arg);
        };
        
        this.unshift = function(type, /*optional*/ repeats, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg)
        {
            return this.insert(0, type, repeats, attributes, callback, this_arg);
        };
        
        // Remove subcontrol from .controls collection
        //
        this.remove = function(control)
        {
            if (!arguments.length)
            {
                // .remove() without arguments removes this control from parent .controls collection
                this.parent = undefined;
                return;
            }
            
            if (control)
                control.parent = undefined;
        };
        
        // Remove all subcontrols from .controls collection
        //
        this.removeAll = function()
        {
            for(var ctrls = this.controls, i = ctrls.length - 1; i >= 0; i--)
                this.remove(ctrls[i]);
        };
        
        function route_data_event()
        {
            var args = Array.prototype.slice.call(arguments);
            args.unshift('data');
            this.raise.apply(this, args);
        };
        
        this.bind = function(data_object, post_mode)
        {
            var this_data = this.data;
            if (data_object !== this_data)
            {
                this.data = data_object;

                if (this_data)
                {
                    this_data.removeListener(route_data_event);
                    this_data.unsubscribe(route_data_event);
                }

                if (data_object)
                {
                    if (post_mode)
                        data_object.subscribe(this, route_data_event);
                    else
                        data_object.listen(this, route_data_event);
                }
                
                route_data_event.call(this);
            }
        };
    
        this.$builder = function () { return controls.$builder(this); };
        
        this.every      = function(delegate, thisArg)   { return this.controls.every(delegate,   thisArg || this); };
        this.filter     = function(delegate, thisArg)   { return this.controls.filter(delegate,  thisArg || this); };
        this.forEach    = function(delegate, thisArg)   { return this.controls.forEach(delegate, thisArg || this); };
        this.map        = function(delegate, thisArg)   { return this.controls.map(delegate,     thisArg || this); };
        this.some       = function(delegate, thisArg)   { return this.controls.some(delegate,    thisArg || this); };
    
    };
    
    function extract_func_code(func)
    {
        if (typeof func === 'function')
        {
            func = func.toString();
            var first_par = func.indexOf('{');
            var last_par = func.lastIndexOf('}');
            return func.substr(first_par + 1, last_par - first_par - 1);
        }

        return func;
    }
    
    // Parse full type to base __type and parameters
    // 
    // type {string} - type string include parameters
    // parameters {object} - parameters (;-separated list) parsed from type string will be assigned to the passed parameters object
    // namespace {string} - base type or context namespace example: 'bootstrap.Label' or 'bootstrap'
    //
    function parse_type(type, parameters, namespace)
    {
        // remove {reference part}
        if (type.slice(-1) === '}')
        {
            var openpos = type.indexOf('{');
            if (openpos >= 0)
            {
                parameters['#{href}'] = type.substr(openpos + 1, type.length - openpos - 2);
                type = type.substr(0, openpos).trim();
            }
        }
        
        // get __type
        
        var dotpos = type.indexOf('.'), slashpos = type.indexOf('/'), numberpos = type.indexOf('#');
        
        var typelen = -1;
        if (slashpos >= 0)
            typelen = slashpos;
        if (numberpos >= 0 && (numberpos < typelen || typelen < 0))
            typelen = numberpos;
        
        var __type = (typelen < 0) ? type : type.substr(0, typelen);
        
        // fix type prefix - namespace
        if (__type && (dotpos < 0 || (typelen >= 0 && dotpos > typelen)))
        {
            if (namespace)
            {
                var dotpos = namespace.indexOf('.');
                if (dotpos >= 0)
                    namespace = namespace.substr(0, dotpos + 1);
                else
                    namespace += '.';
            }
            else
                namespace = 'controls.';
            
            __type = namespace + __type;
        }
        
        if (arguments.length < 2)
            return __type;
        
        // parse parameters
            
        if (typelen >= 0)
        {
            var paramstr = type.substr(typelen);
            var inheritable, unheritable;
            
            // unheritable starts with #
            if (numberpos > slashpos)
                unheritable = type.substr(numberpos + 1);
            else if (numberpos >= 0)
                unheritable = type.substr(numberpos + 1, slashpos - numberpos - 1);
            // unheritable starts with /
            if (slashpos > numberpos)
                inheritable = type.substr(slashpos + 1);
            else if (slashpos >= 0)
                inheritable = type.substr(slashpos + 1, numberpos - slashpos - 1);
            
            if (inheritable)
            {
                inheritable = inheritable.split(';'); // ';' - separated list
                for(var i = 0, c = inheritable.length; i < c; i++)
                {
                    var parameter = inheritable[i];
                    if (parameter)
                    {
                        parameter = parameter.split('=');
                        var parname = parameter[0], parvalue = parameter[1];
                        if (parname)
                        {
                            if (parvalue === undefined)
                                parvalue = true;
                            else if (parvalue)
                                parvalue = parvalue.trim();
                                
                            // inheritable writed to parameters hash under '/'+parametername key
                            parameters['/' + parname.trim()] = parvalue;
                        }
                    }
                }
            }

            if (unheritable)
            {
                unheritable = unheritable.split(';'); // ';' - separated list
                for(var i = 0, c = unheritable.length; i < c; i++)
                {
                    var parameter = unheritable[i];
                    if (parameter)
                    {
                        parameter = parameter.split('=');
                        var parname = parameter[0], parvalue = parameter[1];
                        if (parname)
                        {
                            if (parvalue === undefined)
                                parvalue = true;
                            else if (parvalue)
                                parvalue = parvalue.trim();
                            
                            parameters[parname.trim()] = parvalue;
                        }
                    }
                }
            }
        }
        
        return __type;
    };
    
    // Resolve __type and parameters to control constructor
    //
    // __type - base type, example "controls.Custom"
    // parameters - parameters parsed from original type
    //
    function resolve_ctr(__type, parameters)
    {
        // after parse and before ctr resolve apply alias
        
        var constructor;
            __type = __type.toLowerCase();
        
        // map __type -> subtypes array
        var subtypes_array = controls.subtypes[__type]; 
        if (subtypes_array)
        for(var i = 0, c = subtypes_array.length; i < c; i++) // iterate subtypes array
        {
            // each subtypes array item is key parameters object and contains the constructor reference
            var key_parameters = subtypes_array[i];
            
            // check for matching all key params values
            var hit = true;
            for(var prop in parameters)
            if ('__ctr,??'.indexOf(prop) < 0 && key_parameters[prop] !== parameters[prop])
            {
                hit = false;
                break;
            }
            if (hit)
            {
                constructor = key_parameters.__ctr;
                break;
            }
        }
        
        if (!constructor)
        {
            constructor = controls[__type];
            
            // apply if alias
            if (constructor && constructor.isAlias && constructor.__type !== __type)
            {
                // apply alias parameters
                var alias_parameters = constructor.parameters;
                for(var prop in alias_parameters)
                    parameters[prop] = alias_parameters[prop];
                
                constructor = resolve_ctr(constructor.__type, parameters);
            }
        }
        
        return constructor;
    };
    controls.resolveType = resolve_ctr;
    
    // Unresolved type error processing mode
    // 0 - throw TypeError, 1 - create Stub
    //
    var type_error_mode = 0;
    controls.createOrStub = function(type, /*optional*/ parameters, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg)
    {
        type_error_mode = 1;
        try {
            return controls.create.apply(this, arguments);
        } catch (e) {}
        finally
        {
            type_error_mode = 0;
        }
    };
    
    // Create control
    //
    // syntax: .create(type, attributes); .create(type, parameters, attributes);
    // type - type and parameters
    // parameters - optional, parameters
    // attributes - optional, set attributes to control
    // return created control
    //
    controls.create = function(type, /*optional*/ parameters, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg)
    {
        switch(arguments.length)
        {
            case 0:  throw new SyntaxError('Invalid Type argument value!');
            case 1:  attributes = {}; parameters = {}; break;
            case 2:
                if (typeof parameters === 'function')
                {
                    this_arg = attributes;
                    callback = parameters;
                    attributes = {};
                    parameters = {};
                }
                else
                {
                    attributes = parameters || {};
                    parameters = {}; 
                }
                break;
            default:
                if (typeof attributes === 'function')
                {
                    this_arg = callback;
                    callback = attributes;
                    attributes = parameters || {};
                    parameters = {};
                }
                else if (typeof parameters === 'function')
                {
                    this_arg = attributes;
                    callback = parameters;
                    attributes = {};
                    parameters = {};
                }
                else
                {
                    attributes = attributes || {};
                    parameters = parameters || {};
                }
        }
        
        var __type = parse_type(type, parameters),
            constructor = resolve_ctr(__type, parameters);
        
        if (!constructor)
        {
            if (!type_error_mode)
                throw new TypeError('Type ' + __type + ' not registered!');
            else
            {
                // route to Stub
                parameters['#{type}'] = type; // pass original type
                parameters['#{__type}'] = __type;
                parameters['#{callback}'] = callback;
                parameters['#{this_arg}'] = this_arg;
                constructor = resolve_ctr('controls.Stub', parameters);
            }
        }    
        
        if (!attributes.class)
            attributes.class = '';
        
        for(var prop in parameters)
        if (prop[0] === '$')
            attributes[prop.substr(1)] = parameters[prop];
                
        // create object
        
        var new_control = (constructor.is_constructor) // constructor or factory method ?
            ? new constructor(parameters, attributes)
            : constructor(parameters, attributes);
        
        // reflect after creation
        new_control.raise('type');
        
        return new_control;
    };
    
    controls.$builder = function(control)
    {
        if (!this.$move)
            return new controls.$builder(control);
        
        this.$default = 'controls.';
        this.$context = control;
        this.$context_stack = [];
    };
    function check_type(builder, type)
    {
        if (typeof type !== 'string')
            return type;
        
        var colonpos = type.indexOf(':'),
            dotpos = type.indexOf('.'),
            slashpos = type.indexOf('/'),
            numberpos = type.indexOf('#');
        
        if ((~dotpos && colonpos > dotpos) || (~slashpos && colonpos > slashpos) || (~numberpos && colonpos > numberpos))
            colonpos = -1;
        if ((~slashpos && dotpos > slashpos) || (~numberpos && dotpos > numberpos))
            dotpos = -1;
        
        if (dotpos < 0)
        {
            if (colonpos >= 0)
                type = type.substr(0, colonpos + 1) + builder.$default + type.substr(colonpos + 1);
            else
                type = builder.$default + type;
        }
        
        return type;
    }
    // $builder commands executed in the context of the control, avoid name conflicts.
    // Naming convention: $ command does not change the context. $$ command - changing context.
    controls.$builder.prototype =
    {
        // move the $builder context to
        $move: function(control)
        {
            this.$context = control;
        },
        // set default namespace
        $namespace : function(namespace)
        {
            if (namespace.indexOf('.') < 0)
                namespace = namespace + '.';
            
            this.$default = namespace;
        },
        // add [C]ontrol
        $C: function(type, repeats, attributes, callback, this_arg)
        {
            var context = this.$context;
            if (!context)
                throw new TypeError('$C: context undefined! ' + type);

            return context.add(check_type(this, type), repeats, attributes, callback, this_arg);
        },
        $$C: function(type, repeats, attributes, callback, this_arg)
        {
            if (typeof(repeats) !== 'number')
            {
                this_arg = callback;
                callback = attributes;
                attributes = repeats;
                repeats = 1;
            }
            
            if (typeof(attributes) === 'function')
            {
                this_arg = callback;
                callback = attributes;
                attributes = undefined;
            }
            
            var context = this.$context;
            if (!context)
                throw new TypeError('$builder $$C: context undefined! ' + type);
            
            var control;
            
            if (callback)
            {
                this.$context_stack.push(this.$context);
                
                control = context.add(check_type(this, type), repeats, attributes, function(control)
                {
                    this.$context = control;
                    callback.call(this_arg || control, control);
                }, this);
                
                this.$context = this.$context_stack.pop();
            }
            else
            {
                control = context.add(check_type(this, type), repeats, attributes);
                this.$context = control;
            }
            
            return control;
        },
        
        // add [T]emplate
        $T: function(template, repeats, attributes, callback, this_arg)
        {
            if (typeof(repeats) !== 'number')
            {
                this_arg = callback;
                callback = attributes;
                attributes = repeats;
                repeats = 1;
            }
            
            if (typeof(attributes) === 'function')
            {
                this_arg = callback;
                callback = attributes;
                attributes = undefined;
            }
            
            var context = this.$context;
            if (!context)
                throw new TypeError('$T: context undefined!');
            
            var attrs = attributes || {};
            attrs.$template = template;
            
            return context.add('controls.Custom', repeats, attrs, callback, this_arg);
        },
        $$T: function(template, repeats, attributes, callback, this_arg)
        {
            if (typeof(repeats) !== 'number')
            {
                this_arg = callback;
                callback = attributes;
                attributes = repeats;
                repeats = 1;
            }
            
            if (typeof(attributes) === 'function')
            {
                this_arg = callback;
                callback = attributes;
                attributes = undefined;
            }
            
            var context = this.$context;
            if (!context)
                throw new TypeError('$$T: context undefined! ');
            
            var attrs = attributes || {};
            attrs.$template = template;
            
            var control;
            
            if (callback)
            {
                this.$context_stack.push(this.$context);
                
                control = context.add('controls.Custom', repeats, attrs, function(control)
                {
                    this.$context = control;
                    callback.call(this_arg || control, control);
                }, this);
                
                this.$context = this.$context_stack.pop();
            }
            else
            {
                control = context.add('controls.Custom', repeats, attrs);
                this.$context = control;
            }
            
            return control;
        },
        
        // add te[X]t
        $X: function(text, repeats, attributes, callback, this_arg)
        {
            if (typeof(repeats) !== 'number')
            {
                this_arg = callback;
                callback = attributes;
                attributes = repeats;
                repeats = 1;
            }
            
            if (typeof(attributes) === 'function')
            {
                this_arg = callback;
                callback = attributes;
                attributes = undefined;
            }
            
            var context = this.$context;
            if (!context)
                throw new TypeError('$X: context undefined!');
            
            var attrs = attributes || {};
            attrs.$text = text;
            
            return context.add('controls.Container', repeats, attrs, callback, this_arg);
        },
        $$X: function(text, repeats, attributes, callback, this_arg)
        {
            if (typeof(repeats) !== 'number')
            {
                this_arg = callback;
                callback = attributes;
                attributes = repeats;
                repeats = 1;
            }
            
            if (typeof(attributes) === 'function')
            {
                this_arg = callback;
                callback = attributes;
                attributes = undefined;
            }
            
            var context = this.$context;
            if (!context)
                throw new TypeError('$$X: context undefined!');
            
            var attrs = attributes || {};
            attrs.$text = text;
            
            var control;
            
            if (callback)
            {
                this.$context_stack.push(this.$context);
                
                control = context.add('controls.Container', repeats, attrs, function(control)
                {
                    this.$context = control;
                    callback.call(this_arg || control, control);
                }, this);
                
                this.$context = this.$context_stack.pop();
            }
            else
            {
                control = context.add('controls.Container', repeats, attrs);
                this.$context = control;
            }
            
            return control;
        },
        
        // [E]ncode text
        $E: function(text, repeats, attributes, callback, this_arg)
        {
            return this.$X(controls.encodeHTML(text), repeats, attributes, callback, this_arg);
        },
        $$E: function(text, repeats, attributes, callback, this_arg)
        {
            return this.$$X(controls.encodeHTML(text), repeats, attributes, callback, this_arg);
        },
        $encode: function(text) { return controls.encodeHTML(text); },
        
        forEach: function(callback, this_arg)
        {
            var control = this.$context;
            if (control)
                control.controls.forEach(callback, this_arg || this);
        },
        $$forEach: function(callback, this_arg)
        {
            var control = this.$context;
            if (control)
            {
                this.$context_stack.push(this.$context);
                
                var controls = control.controls;
                for(var prop in controls)
                {
                    var control = controls[prop];
                    this.$context = control;
                    callback.call(this_arg || this, control);
                }
                
                this.$context = this.$context_stack.pop();
            }
        }
    };
    
    controls.defCommand = function(command, func)
    {
        controls.$builder.prototype[command] = func;
    };
    
    'p'.split(',').forEach(function(tag)
    {
        controls.defCommand('$' + tag, function(text,_class,style) { this.$C(tag, {$text:text, class:_class, style:style}); });
        controls.defCommand('$$' + tag, function(text,_class,style) { this.$$C(tag, {$text:text, class:_class, style:style}); });
    });
    
    'h1,h2,h3,h4,h5,h6'.split(',').forEach(function(tag)
    {
        controls.defCommand('$' + tag, function(text,id,_class,style) { if(id)id=id.replace(/ /g,'-'); this.$C(tag, {$text:text, id:id, class:_class, style:style}); });
        controls.defCommand('$$' + tag, function(text,id,_class,style) { if(id)id=id.replace(/ /g,'-'); this.$$C(tag, {$text:text, id:id, class:_class, style:style}); });
    });
    
    controls.$test = function(control, callback)
    {
        if (!this.$move)
            return new controls.$test(control, callback);
        
        this.$default = 'controls.';
        this.$context = control;
        this.$context_stack = [];
        
        callback.call(this);
    };
    controls.$test.prototype = controls.$builder.prototype;
    
    // controls.reviverJSON()
    // 
    // use with JSON.parse(json, controls.reviverJSON), this function restores controls
    //
    controls.reviverJSON = function reviverJSON(key, value)
    {
        if (typeof(value) === 'object' && value !== null && value.hasOwnProperty('__type'))
        {
            var parameters = {},
                __type = parse_type(value.__type, parameters),
                constructor = resolve_ctr(__type, parameters);
            
            if (!constructor)
                throw new TypeError('controls.reviverJSON(): ' + __type + ' constructor not registered!');
            
            var new_control;
            
            var revive_func = constructor.revive;
            if (revive_func)
                new_control = revive_func(constructor, parameters, value);
            else
                new_control = controls.reviveControl(constructor, parameters, value);
            
            // reflect after creation
            new_control.raise('type');

            return new_control;
        }

        return value;
    };
    
    // revive json object recursively
    controls.revive = function revive(json_object)
    {
        if (json_object)
        {
            for (var prop in json_object)
            if (json_object.hasOwnProperty(prop))
            { 
                var item = json_object[prop];
                if (Array.isArray(item) || (typeof(item) === 'object' && item.hasOwnProperty('__type')))
                    json_object[prop] = revive(item);
            }
            
            if (typeof(json_object) === 'object' && json_object.hasOwnProperty('__type'))
                json_object = reviverJSON(null, json_object);
        }
        
        return json_object;
    };
    
    // Typical control revive function
    controls.reviveControl = function(constructor, parameters, data)
    {
        if (data)
        {
            var control = new constructor(parameters, data.attributes);
            if (data.controls)
                control.controls = data.controls;
            if (data.template)
                control.template(data.template);

            // Restore events

//            var data_events = data.events; // json object collection of serialized controls.Event
//            if (data_events)
//            {
//                var events = {};
//                for(var key in data_events)
//                    events[key] = new controls.Event(data_events[key]);
//                
//                control.events = events;
//            }

            return control;
        }
    };
    
    controls.decodeHTML = function(text)
    {
        return text ? text.replace(DECODE_HTML_MATCH, function(match) { return String.fromCharCode(parseInt(match.slice(2))); }) : text;
    };
    
    controls.encodeHTML = function(text)
    {
        return text ? text.replace(ENCODE_HTML_MATCH, function(match) { return ENCODE_HTML_PAIRS[match] || match; }) : text;
    };
    
    controls.extend = function(object, source)
    {
        for(var prop in source)
            object[prop] = source[prop];
        return object;
    };
    
    controls.delay = function(func, delay)
    {
        return setTimeout(function() { return func.apply(null, Array.prototype.slice.call(arguments, 2)); }, delay);
    };
    
    
    (function(){
        
        // Elementals //////////////////////////////////////////////////////////////
        
        function getgentemplate(tagname) {
            return 'function c' + tagname + '(p, a) { controls.controlInitialize(this, \'controls.' + tagname + '\', p, a, c' + tagname + '.outer_template); }\
c' + tagname + '.prototype = controls.control_prototype;\
c' + tagname + '.outer_template = function(it) { return \'<' + tagname + '\' + it.printAttributes() + \'>\' + (it.attributes.$text || \'\') + it.printControls() + \'</' + tagname + '>\'; };\
controls.typeRegister(\'controls.' + tagname + '\', c' + tagname + ');';
        }
        Function('controls', HTML_TAGS.split(',').map(function(tagname) { return getgentemplate(tagname.toLowerCase()); }).join(''))(controls);
    
        // Templated ///////////////////////////////////////////////////////////////

        controls.createTemplatedControl('controls.Area',    function(it){ return '<area'    + it.printAttributes() + '>'; });
        controls.createTemplatedControl('controls.Hr',      function(it){ return '<hr'      + it.printAttributes() + '>'; });
        controls.createTemplatedControl('controls.Meta',    function(it){ return '<meta'    + it.printAttributes() + '>'; });
        controls.createTemplatedControl('controls.Param',   function(it){ return '<param'   + it.printAttributes() + '>'; });
        controls.createTemplatedControl('controls.Source',  function(it){ return '<source'  + it.printAttributes() + '>'; });
        controls.createTemplatedControl('controls.Track',   function(it){ return '<track'   + it.printAttributes() + '>'; });
    })();
    
    
    // Special /////////////////////////////////////////////////////////////////

            
    // Container
    // 
    // without own html
    // 
    function Container(parameters, attributes)
    {
        controls.controlInitialize(this, 'controls.Container', parameters, attributes, controls.default_inner_template);
    };
    Container.prototype = controls.control_prototype;
    controls.typeRegister('controls.Container', Container);
    
    // Custom
    // 
    // set template after creating the control
    // 
    function Custom(parameters, attributes)
    {
        controls.controlInitialize(this, 'controls.Custom', parameters, attributes,
            attributes.$template || attributes.$outer_template,
            attributes.$inner_template);
    };
    Custom.prototype = controls.control_prototype;
    controls.typeRegister('controls.Custom', Custom);

    // Stub
    // 
    // Stub control created on type error if type_error_mode
    // 
    function Stub(parameters, attributes)
    {
        this.isStub = true;
        
//        var original_type = parameters['#{type}'];
//        var original__type = parameters['#{__type}'];
//        var callback = parameters['#{callback}'];
//        var this_arg = parameters['#{this_arg}'];
//        var hrefs = parameters['#{href}'];
//        if (hrefs)
//            hrefs = hrefs.split(/,| |;/g);
        
//        var save_attributes = {};
//        for(var prop in attributes)
//        if (attributes.hasOwnProperty(prop))
//            save_attributes[prop] = attributes[prop];
        
        controls.controlInitialize(this, 'controls.Stub', parameters, attributes, function(it) { return '<div' + it.printAttributes() + '>' + it.printControls() + '</div>'; } );
        
        this.class('stub');
        
        var state = 0; // 0 - stub, > 0 - resources loaded, < 0 - load error
        Object.defineProperty(this, "state",
        {
            enumerable: true, 
            get: function() { return state; },
            set: function(value)
            {
                if (value !== state)
                {
                    state = value;
                    if (value === 0)
                        this.class(null, 'stub-loading stub-error');
                    else if (value < 0)
                        this.class('stub-error', 'stub-loading');
                    else
                        this.class('stub-loading', 'stub-error');
                    
                    this.raise('state');
                    
                    if (this.state > 0)
                        this.tryReplace();
                }
            }
        });
        
        // try create control and replace stub on success
        this.tryReplace = function()
        {
            var params = controls.extend({}, this.parameters),
                attrs = controls.extend({}, this.attributes);
            for(var prop in this.parameters)
            if (prop.substr(0,2) === '#{')
                delete params[prop];
            var control = controls.create(parameters['#{type}'], params, attrs);
            if (control) {
                control.class(null, 'stub stub-loading stub-error');
                this.replaceItself(control);
            }
        };
    };
    Stub.prototype = controls.control_prototype;
    controls.typeRegister('controls.Stub', Stub);
    
    // Head
    //
    function Head(parameters, attributes)
    {
        controls.controlInitialize(this, 'controls.Head', parameters, attributes, function(it) { return '<head>' + (it.attributes.$text || '') + it.printControls() + '</head>'; });
        this.attach    = function() { Head.prototype.attach.call(this, document.head); };
        this.attachAll = function() { Head.prototype.attach.call(this, document.head); Head.prototype.attachAll.call(this); };
    };
    Head.prototype = controls.control_prototype;
    controls.typeRegister('controls.Head', Head);
    
    // controls.Body <BODY></BODY>
    // 
    // 
    function Body(parameters, attributes)
    {
        controls.controlInitialize(this, 'controls.Body', parameters, attributes, function(it) { return '<body' + it.printAttributes('-id') + '>' + (it.attributes.$text || '') + it.printControls() + '</body>'; });
        this.attach = function(force_body)
        {
            Body.prototype.attach.call(this, document.body);
        };
        this.attachAll = function() { Body.prototype.attach.call(this, document.body); Body.prototype.attachAll.call(this); };
    };
    Body.prototype = controls.control_prototype;
    controls.typeRegister('controls.Body', Body);
    

    // Layouts /////////////////////////////////////////////////////////////////


    // Layout
    // Parameters:
    // float=left, float=right
    // 
    // var layout = controls.create('controls.Layout#float=left');
    // layout.cellSet.class(...);
    // 
    function Layout(parameters, attributes)
    {
        controls.controlInitialize(this, 'controls.Layout', parameters, attributes, Layout.template);
        var clearfix = false; // use clearfix if float
        
        this.cellSet = new Container();
        this.cellSet.listen('attributes', this, function(event)
        {
            var attr_name = event.name,
                attr_value = event.value,
                remove = (attr_value === undefined || attr_value === null);
            
            var element = this._element;
            if (element)
            {
                var nodes = element.childNodes; // element.querySelectorAll('[data-type=layout-item]');
                for(var i = nodes.length - 1; i>=0; i--)
                {
                    var node = nodes[i];
                    if (remove)
                        node.removeAttribute(attr_name);
                    else
                        node.setAttribute(attr_name, attr_value);
                }
            }
        });
        
        this.listen('type', function()
        {
            var parameters = this.parameters,
                floatvalue;
            
            for(var prop in parameters)
            if (prop === 'float' || prop === '/float')
                floatvalue = parameters[prop];
            
            if (floatvalue)
                this.cellSet.style('float:' + floatvalue);
            
            clearfix = floatvalue;
        });
    };
    Layout.prototype = controls.control_prototype;
    Layout.template = doT.template(
'<div{{=it.printAttributes()}}>\
{{~it.controls :value:index}}<div data-type="layout-item"{{=it.cellSet.printAttributes("-id")}}>{{=value.wrappedHTML()}}</div>{{~}}\
{{?it.clearfix}}<div style="clear:both;"></div>{{?}}</div>');
    controls.typeRegister('controls.Layout', Layout);

    
    function List(parameters, attributes)
    {
        controls.controlInitialize(this, 'controls.List', parameters, attributes, List.template);
        
        this.itemSet = new Container();
        this.itemSet.listen('attributes', this, function(event)
        {
            var attr_name = event.name;
            var attr_value = event.value;
            var remove = (attr_value === undefined || attr_value === null);
            
            var element = this._element;
            if (element)
            {
                var nodes = element.childNodes; // element.querySelectorAll('[data-type=layout-item]');
                for(var i = nodes.length - 1; i>=0; i--)
                {
                    var node = nodes[i];
                    if (remove)
                        node.removeAttribute(attr_name);
                    else
                        node.setAttribute(attr_name, attr_value);
                }
            }
        });
    };
    List.prototype = controls.control_prototype;
    List.template = doT.template(
'<ul{{=it.printAttributes()}}>\
{{~it.controls :value:index}}<li{{=it.itemSet.printAttributes("-id")}}>{{=value.wrappedHTML()}}</li>{{~}}\
</ul>');
    controls.typeRegister('controls.List', List);
    
   
};


// A known set of crutches
if (typeof module !== 'undefined' && typeof require === 'function' && module.exports)
{
    module.exports = new Controls(require('dot'));
    // browserify support:
    if (typeof window !== 'undefined') window.controls = module.exports;
}
else if (typeof define === 'function' && define.amd)
{
    var instance;
    define(['doT'], function(doT) { if (!instance) instance = new Controls(doT); return instance; });
}
else if (!this.controls || this.controls.VERSION < VERSION)
{
    if (typeof doT === 'undefined') throw new TypeError('controls.js: doT.js not found!');
    this.controls = new Controls(doT);
}
}).call(this);



},{"dot":2}],4:[function(require,module,exports){

// not implemented
// The reason for having an empty file and not throwing is to allow
// untraditional implementation of this module.

},{}]},{},[3])
;