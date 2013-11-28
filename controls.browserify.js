;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//     controls.js
//     UI framework, code generation tool
//     status: proposal, example, valid prototype, under development
//     demo:   http://aplib.github.io/controls.js/
//     issues: https://github.com/aplib/markdown-site-template/issues
//     (c) 2013 vadim b.
//     License: MIT

(function() { "use strict";

    var controls = {
        VERSION: '0.6.12'/*#.#.##*/,
        id_generator: 53504,
        // assignable default template engine
        template: function(templ) { return new Function('return \'' + templ.replace(/'/g, "\\'") + '\''); },
        subtypes: {} // Registered subtypes
    };
    
    var IDENTIFIERS = ',add,attach,attributes,class,data,element,first,id,__type,controls,last,name,each,forEach,parameters,parent,remove,style,';
    var ENCODE_HTML_MATCH = /&(?!#?\w+;)|<|>|"|'|\//g;
    var ENCODE_HTML_PAIRS = { "<": "&#60;", ">": "&#62;", '"': '&#34;', "'": '&#39;', "&": "&#38;", "/": '&#47;' };
    var DECODE_HTML_MATCH = /&#(\d{1,8});/g;    
    
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
    controls.controlInitialize = function(object, __type, parameters, _attributes, outer_template, inner_template) {

        var attributes = _attributes || {};
        
        if (!attributes.id)
            attributes.id = (++controls.id_generator).toString(16); // set per session uid
        
        object.id           = attributes.id;    // This should be a unique identifier. Value  will be assigned to the 'id' attribute of DOM element.
        object.__type       = __type;
        object.parameters   = parameters || {};
        object.attributes   = attributes;       // The object contains data to generate html code,  $icon, class, style, $text etc
        object.controls     = [];               // This is a collection of nested objects
        
        if (outer_template)
        Object.defineProperty(object, "outer_template", {
            enumerable: true, writable: true,
            value: outer_template
        });

        if (inner_template)
        Object.defineProperty(object, "inner_template", {
            enumerable: true, writable: true,
            value: inner_template
        });
    
        return object;
    };
    
    // plug in control constructor to the controls infrastructure
    // 
    // __type {string} - unique type identifier contains namespace and name, like 'controls.Button'
    // constructor {function} - constructor function
    // [template] {string,function} - text or template function
    // [revive] {function} -  json revive function
    //
    controls.typeRegister = function(type, constructor, revive) {
        controls.factoryRegister(type, constructor);
        constructor.is_constructor = true;
        constructor.revive = revive;
    };
    
    controls.factoryRegister = function(type, factory_method) {
        var key_parameters = {},
            __type = parse_type(type, key_parameters) .toLowerCase();
        
        if (__type.length < type.length) { // type is subtype with parameters, register to controls.subtypes
            var subtypes_array = controls.subtypes[__type];
            if (!subtypes_array) {
                subtypes_array = [];
                controls.subtypes[__type] = subtypes_array;
            }
            key_parameters.__ctr = factory_method;
            subtypes_array.push(key_parameters);
        }
        else {
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
    controls.typeAlias = function(alias, type) {
        var parameters = {},
            __type = parse_type(type, parameters) .toLowerCase(),
            constructor = resolve_ctr(__type, parameters);
        if (!constructor)
            throw new TypeError('Type ' + __type + ' not registered!');
            
        controls[alias.toLowerCase()] = { __type: __type, parameters: parameters, isAlias: true };
    };
    
    controls.parse = function(text) {
        try {
            return JSON.parse(text) || {};
        } catch(e) { console.log(e); }
        return {};
    };
    
    
// >> Events

    function force_event(object, type, capture) {
        var events = object.events;
        if (!events)
            object.events = events = {};

        var key = (capture) ? ('#'/*capture*/ + type) : type;
        var event = events[key];
        if (!event) {
            events[key] = event = new controls.Event(object, type, capture);

            // add DOM listener if attached
            if (event.is_dom_event) {
                var element = object._element;
                if (element)
                    element.addEventListener(type, event.raise, capture);
            }
        }
        return event;
    };

    var dom_events =
',change,DOMActivate,load,unload,abort,error,select,resize,scroll,blur,DOMFocusIn,DOMFocusOut,focus,focusin,focusout,\
click,dblclick,mousedown,mouseenter,mouseleave,mousemove,mouseover,mouseout,mouseup,wheel,keydown,keypress,keyup,oncontextmenu,\
compositionstart,compositionupdate,compositionend,DOMAttrModified,DOMCharacterDataModified,DOMNodeInserted,\
DOMNodeInsertedIntoDocument,DOMNodeRemoved,DOMNodeRemovedFromDocument,DOMSubtreeModified,';
    
    controls.Event = function(default_call_this, type, capture, listeners_data) {
        var listeners = this.listeners = [],
            call_this = this.call_this = default_call_this; // owner of the event object
        this.type = type;
        this.capture = capture;
        this.is_dom_event = (dom_events.indexOf(',' + type + ',') >= 0);
        
        // revive from JSON data
        if (listeners_data)
        for(var i = 0, c = listeners_data.length; i < c; i+=2) {
            var listener_ = listeners_data[i];
            listeners.push((typeof listener_ === 'function') ? listener_ : Function('event', listener_));
            var c_this =  listeners_data[i+1];
            listeners.push((c_this === call_this) ? null : call_this);
        }

        this.raise = function() {
            for(var i = 0, c = listeners.length; i < c; i+=2)
                listeners[i].apply(listeners[i+1] || call_this, arguments);
        };
    };
    controls.Event.prototype = {
        addListener: function(call_this/*optional*/, listener) {
            if (arguments.length > 1)
                this.listeners.push(listener, (call_this === this.call_this) ? null : call_this);
            else
                this.listeners.push(call_this, null);
        },

        removeListener: function(listener) {
            var listeners = this.listeners,
                index = listeners.indexOf(listener);
            if (index >= 0)
                listeners.splice(index, 2);
        },
        
        clear: function() {
            this.listeners.length = 0;
        },

        toJSON: function() {
            var jsonlisteners = [],
                listeners = this.listeners;
            // Serialize listeners
            for(var i = 0, c = listeners.length; i < c; i+=2) {
                var event_func = listeners[i],
                    call_this = listeners[i+1];
                if (!event_func.no_serialize) {
                    jsonlisteners.push(extract_func_code(event_func));
                    jsonlisteners.push();
                }
            }
            return {type:this.type, capture:this.capture, listeners:jsonlisteners};
        }
    };
    
    // Post processing
    
    var post_events = [];
    setInterval(function() {
        if (post_events.length > 0)
        for(var i = 0, c = post_events.length; i < c; i++) {
            try {
                post_events[i].post_event.raise();
            }
            catch(e) { console.log(e); }
            
            post_events.length = 0;
        };
        
    }, 30);
    
// >> Data objects
    
    var data_object_common = {
        listen: function(call_this/*optional*/, listener) {
            var event = this.event || (this.event = new controls.Event(this));
            event.addListener.apply(event, arguments);
            return this;
        },
        listen_: function(call_this/*optional*/, listener) {
            if (typeof listener === 'function') listener.no_serialize = true;
            else call_this.no_serialize = true;
            return this.listen.apply(this, arguments);
        },
        removeListener: function(listener) {
            var event = this.event;
            if (event)
                event.removeListener(listener);
            
            return this;
        },
        subscribe: function(call_this/*optional*/, listener) {
            if (typeof(call_this) === 'function') {
                listener = call_this;
                call_this = this;
            }
            
            if (!listener)
                return this;
            
            var post_event = this.post_event || (this.post_event = new controls.Event(this));
            post_event.addListener.apply(post_event, arguments);
            
            return this;
        },
        unsubscribe: function(listener) {
            var post_event = this.post_event;
            if (post_event)
                post_event.removeListener(listener);
            
            return this;
        },
        raise: function() {
            var event = this.event;
            if (event)
                event.raise.apply(this, arguments);
            
            var post_event = this.post_event;
            if (post_event) {
                var index = post_events.indexOf(this);
                if (index < 0 || index !== post_events.length - 1) {
                    if (index >= 0)
                        post_events.splice(index, 1);
                    post_events.push(this);
                }
            }
        },
        set: function(name, value) {
            this.state_id++;
            this[name] = value;
            this.last_name = name;
            this.raise();
        },
        setx: function(collection) {
            var modified;
            for(var prop in collection)
            if (collection.hasOwnProperty(prop)) {
                modified = true;
                this.state_id++;
                this[prop] = collection[prop];
                this.last_name = collection;
            }
            if (modified)
                this.raise();
        }
    };
    
    function DataObject(parameters, attributes) {
        this.state_id = Number.MIN_VALUE;
    }
    DataObject.prototype = data_object_common;
    controls.typeRegister('DataObject', DataObject);
    
    var data_array_common = {
        // ops: 1 - insert, 2 - remove, ...
        push: function(item) {
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
        
    function LocalStorageAdapter(parameters, attributes) {
    };
    LocalStorageAdapter.prototype = {
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
    function DataArray(parameters, attributes) { // factory method
        var array = [];
        
        if (attributes) {
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
        
        if (parameters && parameters.adapter) {
            this.adapter = controls.create(parameters.adapter);
            if (!this.adapter)
                throw new TypeError('Invalid data adapter type "' + parameters.adapter + '"!');
        }
        
        return array;
    }
    controls.factoryRegister('DataArray', DataArray);
    
// >> Controls prototype
    
    controls.control_prototype = new function() {
        
        this.initialize = function(__type, parameters, _attributes, outer_template, inner_template) {
            return controls.controlInitialize(this, __type, parameters, _attributes, outer_template, inner_template);
        };
        
        Object.defineProperty(this, 'name', {
            enumerable: true, 
            get: function() { return this._name; },
            set: function(value) {
                if (IDENTIFIERS.indexOf(',' + value + ',') >= 0)
                    throw new SyntaxError('Invalid name "' + value + '"!');

                var name = this._name;
                if (value !== name) {
                    this._name = value;

                    var parent = this._parent;
                    if (parent) {
                        if (name && parent.hasOwnProperty(name) && parent[name] === this)
                            delete parent[name];

                        if (value)
                            parent[value] = this;
                    }
                }
            }
        });
        
        // The associated element of control
        Object.defineProperty(this, 'element', {
            enumerable: true,
            get: function() { return this._element; },
            set: function(attach_to_element) {
                if (arguments.length === 0)
                    return this._element;

                var element = this._element;
                if (attach_to_element !== element) {
                    this._element = attach_to_element;

                    var events = this.events;
                    if (events)
                    for(var event_type in events) {
                        var event = events[event_type];
                        if (event.is_dom_event) {
                            // remove event raiser from detached element
                            if (element)
                                element.removeEventListener(event.type, event.raise, event.capture);
                            // add event raiser as listener for attached element
                            if (attach_to_element)
                                attach_to_element.addEventListener(event.type, event.raise, event.capture);
                        }
                    }
                    this.raise('element', attach_to_element);
                }
            }
        });
        
        function setParent(value, index) {
            var parent = this._parent;
            if (value !== parent) {
                this._parent = value;
                var name = this._name;
                
                if (parent) {
                    var parent_controls = parent.controls,
                        index = parent_controls.indexOf(this);
                    if (index >= 0)
                        parent_controls.splice(index, 1);
                    
                    if (name && parent.hasOwnProperty(name) && parent[name] === this)
                        delete parent[name];
                }
                
                if (value) {
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
        
        Object.defineProperties(this, {
            parent: {
                enumerable: true,
                get: function() { return this._parent; },
                set: setParent
            },
        
            wrapper: {
                enumerable: true,
                get: function() { return this._wrapper; },
                set: function(value) {
                    var wrapper = this._wrapper;
                    if (value !== wrapper) {
                        this._wrapper = value;

                        if (wrapper) {
                            var wrapper_controls = wrapper.controls;
                            var index = wrapper_controls.indexOf(this);
                            if (index >= 0)
                                wrapper_controls.splice(index, 1);
                        }

                        if (value) {
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
            },
        
            length: { enumerable: true, get: function() { return this.controls.length; } },
            first:  { enumerable: true, get: function() { return this.controls[0]; } },
            last:   { enumerable: true, get: function() { return this.controls[this.controls.length-1]; } }
        });
        
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

        this.innerHTML = function() {
            // assemble html
            return this.inner_template(this);
        };
        
        this.outerHTML = function() {
            // assemble html
            return this.outer_template(this);
        };
        
        this.wrappedHTML = function() {
            var wrapper = this._wrapper;
            return (wrapper) ? wrapper.wrappedHTML() : this.outerHTML();
        };
        
        // set template text or template function
        this.template = function(outer_template, inner_template) {
            if (outer_template) {
                if (typeof outer_template === 'string')
                    outer_template = controls.template(outer_template);
                if (!this.hasOwnProperty("outer_template"))
                    Object.defineProperty(this, "outer_template", { configurable:true, enumerable:true, writable:true, value:outer_template });
                else
                    this.outer_template = outer_template;
            }
            if (inner_template) {
                if (typeof outer_template === 'string')
                    inner_template = controls.template(inner_template);
                if (!this.hasOwnProperty("inner_template"))
                    Object.defineProperty(this, "inner_template", { configurable:true, enumerable:true, writable:true, value:inner_template });
                else
                    this.inner_template = inner_template;
            }
            return this;
        };
        
        this.toJSON = function() {
            var json = {
                __type: this.type(),
                attributes: this.attributes
            };
            
            var name = this.name;
            if (name)
                json.name = name;
            
            var ctrls = this.controls;
            if (ctrls.length)
                json.controls = ctrls;
            
            if (this.hasOwnProperty('outer_template'))
                json.outer_template = extract_func_code(this.outer_template);
            if (this.hasOwnProperty('inner_template'))
                json.inner_template = extract_func_code(this.inner_template);
            
            var events = this.events;
            if (events) {
                var jevents = [];
                for(var prop in events) {
                    var event = events[prop],
                        listeners = event.listeners,
                        serialize = false;
                    for(var i = 0, c = listeners.length; i < c; i+=2)
                        if (!listeners[i].no_serialize) {
                            serialize = true;
                            break;
                        }
                    if (serialize)
                        jevents.push(event);
                }
                if (jevents.length)
                    json.events = jevents;
            }
            return json;
        };
        
        // TODO: remove excess refresh calls
        this.refresh = function() {
            var element = this._element;
            if (element) {
                if (!element.parentNode) {
                    // orphaned element
                    this._element = undefined;
                }
                else
                try {
                    // Setting .outerHTML breaks hierarchy DOM, so you need a complete re-initialisation bindings to DOM objects.
                    // Remove wherever possible unnecessary calls .refresh()

                    var html = this.outerHTML();
                    if (html !== element.outerHTML) {
                        this.detachAll();
                        element.outerHTML = html;
                        this.attachAll();
                    }
                }
                catch (e) {
                    // Uncaught Error: NoModificationAllowedError: DOM Exception 7
                    //  1. ? xml document
                    //  2. ? "If the element is the root node" ec orphaned element
                    this._element = undefined;
                }
            }
            return this;
        };
        
        this.refreshInner = function() {
            var element = this._element;
            if (element)
                element.innerHTML = this.innerHTML();
            return this;
        };
        
        // Attach to DOM element
        this.attach = function(some) {
            this.element = (!arguments.length)
                ? document.getElementById(this.id)
                : (typeof(some) === 'string') ? document.getElementById(some) : (some && (some._element || some));
            return this;
        };
        
        // Attach this and all nested controls to DOM by id
        this.attachAll = function() {
            if (!this._element)
                this.element = document.getElementById(this.id);
            for(var ctrls = this.controls, i = 0, c = ctrls.length; i < c; i++)
                ctrls[i].attachAll();
            return this;
        };
        
        // Detach from DOM
        this.detach = function() {
            this.element = undefined;
            return this;
        };
        
        // Detach this and all nested from DOM
        this.detachAll = function() {
            this.element = undefined;
            for(var ctrls = this.controls, i = 0, c = ctrls.length; i < c; i++)
                ctrls[i].detachAll();
            return this;
        };
        
        // Replace control in the hierarchy tree
        this.replaceItself = function(control) {
            var controls = this.controls;

            // .controls may be a DataArray
            for(var i = controls.length - 1; i >= 0; i--)
                control.add(controls.shift());
            
            var parent = this.parent;
            if (!parent)
                control.parent = undefined;
            else {
                var index = parent.controls.indexOf(this);
                this.parent = undefined;
                setParent.call(control, parent, index);
            }
            var element = this._element;
            if (!element)
                control.element = undefined;
            else {
                control.element = element;
                control.refresh(); // rewrite dom
            }
        };
        
        // opcode {number} - 0 - insert before end, 1 - insert after begin, 2 - insert before, 3 - insert after
        this.createElement = function(node, opcode) {
            var element = this._element,
                parent = this.parent;
        
            if (element)
                throw new TypeError('Element already exists!');
            
            if (!node && parent) {
                node = parent.element;
                opcode = 0;
            }
            
            if (!node)
                throw new TypeError('Failed to create element!');
            
            if (node.insertAdjacentHTML) {
                var pos;
                switch(opcode) {
                    case 1: pos = 'afterbegin'; break;
                    case 2: pos = 'beforebegin'; break;
                    case 3: pos = 'afterend'; break;
                    default: pos = 'beforeend';
                }
                // illegal invocation on call this method before element completed
                node.insertAdjacentHTML(pos, this.outerHTML());
                
            } else {

                var fragment = document.createDocumentFragment(),
                    el = document.createElement('div');
                el.innerHTML = this.outerHTML();
                var buf = Array.prototype.slice.call(el.childNodes);
                for(var i = 0, c = buf.length; i < c; i++)
                    fragment.appendChild(buf[i]);

                switch(opcode) {
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
            return this.attachAll();
        };
        
        this.deleteElement = function() {
            var element = this._element;
            if (element) {
                var parent_node = element.parentNode;
                if (parent_node)
                    parent_node.removeChild(element);
                this._element = undefined;
            }
            return this;
        };
        
        this.deleteAll = function() {
            this.deleteElement();
            for(var ctrls = this.controls, i = ctrls.length - 1; i >= 0; i--)
                ctrls[i].deleteAll();
            return this;
        };
        
        // Set or remove event listener. Event type may be DOM event as "click" or special control event as "type"
        //
        // type {string} - a string representing the event type to listen for. (without "on") example: "click"
        // [call_this {object}] - 
        // listener {string,function(event)} - event listener function or function body text
        // [capture {bool}] - 
        //
        this.listen = function(type, call_this/*optional*/, listener, capture/*optional*/) {
            if (typeof(call_this) === 'function') {
                capture = listener;
                listener = call_this;
                call_this = null;
            }
            if (type && listener)
                force_event(this, type, capture)
                    .addListener(call_this, listener);
            return this;
        };
        
        // set listener and check listener as no_serialize
        this.listen_ = function(type, call_this, listener, capture) {
            if (typeof(call_this) === 'function') {
                capture = listener;
                listener = call_this;
                call_this = null;
            }
            if (type && listener) {
                force_event(this, type, capture)
                    .addListener(call_this, listener);
                listener.no_serialize = true;
            }
            return this;
        };
        
        // Alias for listen()
        this.addListener = function(type, call_this/*optional*/, listener, capture) {
            return this.listen(type, call_this, listener, capture);
        };
        
        this.removeListener = function(type, listener, capture) {
            if (type && listener)
                force_event(this, type, capture).removeListener(listener);
            return this;
        };
        
        this.raise = function(type) {
            var events = this.events;
            if (type && events) {
                var capture_event = events['#' + type],
                    event = events[type],
                    args = Array.prototype.slice.call(arguments, 1);
            
                if (capture_event)
                    capture_event.raise.apply(this, args);

                if (event)
                    event.raise.apply(this, args);
            }
            return this;
        };
        
        this.parameter = function(name, value) {
            var parameters = this.parameters;
            
            if (arguments.length > 1) {
                if (value !== parameters[name]) {
                    parameters[name] = value;
                    this.refresh();
                }
            }
            else
                return parameters[name] || parameters['/'+name];
        };
        
        this._parameter = function(name, value) {
            this.parameter(name, value);
            return this;
        };
        
        // set attribute value
        this.attr = function(name, value) {
            var attributes = this.attributes;
            
            if (arguments.length === 0)
                return undefined;
            
            if (arguments.length === 1)
                return attributes[name];
            
            if (value !== attributes[name]) {
                attributes[name] = value;
                
                if (this._element)
                    this.refresh();
            }
        };
        
        this._attr = function(name, value) {
            this.attr(name, value);
            return this;
        };
        
        // set attributes
        this.attrs = function(_attributes) {
            var attributes = this.attributes;
            
            if (arguments.length > 0) {
                var updated = false;

                for(var prop in _attributes) {
                    var value = _attributes[prop];
                    if (value !== attributes[prop]) {
                        attributes[prop] = value;
                        updated = true;
                    }
                }

                if (updated && this._element)
                    this.refresh();
            }
            return attributes;
        };
        
        this._attrs = function(_attributes) {
            this.attrs(_attributes);
            return this;
        };
        
        // get/set path.type/parameters
        this.type = function(type, apply_inherited) {
            // >> get type
            
            if (arguments.length === 0) {
                var inheritable = '', unheritable = '', parameters = this.parameters;
                for(var prop in parameters) {
                    if (prop[0] !== '/') {
                        // not inheritable parameters
                        if (unheritable) unheritable += ';';
                        unheritable += prop + '=' + parameters[prop];
                    } else {
                        // inheritable parameters
                        if (inheritable) inheritable += ';';
                        inheritable += prop.substr(1) + '=' + parameters[prop];
                    }
                }
                
                var type = this.__type;
                if (inheritable)
                    type += '/' + inheritable;
                if (unheritable.length > 0)
                    type += '#' + unheritable;

                return type;
            }
            
            // << get type
            
            // >> set type and parameters
            
            var parameters = {}; // replace parameters collection
            
            if (apply_inherited && this.parent) {
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
        
        this._type = function(type, apply_inherited) {
            this.type(type, apply_inherited);
            return this;
        };
        
        // Get html code of the selected attributes
        // 
        // attributes (optional, string) - attributes, comma separated list
        // exclude (optional, bool) - use first argument as filter (false) or exclude list (true)
        // example: it.printAttributes("style") - result only one style attribute 'style="..."'
        // example: it.printAttributes("-id") - result attributes all exclude id
        //
        this.printAttributes = function(filter) {
            var result = '', attributes = this.attributes;
            
            if (filter) {
                // TODO: temporary inserted this checking:
                if (filter.indexOf(',') >= 0)
                    console.log('printAttributes() Use a space to separate of identifiers');
                
                if (filter[0] === '-') {
                    // exclusion defined
                    var exclude = filter.substr(1).split(' ');
                    for(var prop in attributes)
                    if (prop[0] !== '$' && exclude.indexOf(prop) < 0) {
                        var value = attributes[prop];
                        if (value)
                            result += ' ' + prop + '="' + value + '"';
                    }
                }
                else {
                    // list of attributes
                    
                    var attrs = filter.split(' ');
                    for(var i = 0, c = attrs.length; i < c; i++) {
                        var key = attrs[i],
                            value = attributes[key];
                        if (value)
                            result += ' ' + key + '="' + value + '"';
                    }
                }
            }
            else {
                // unconditional out all attributes
                for(var prop in attributes)
                if (prop[0] !== '$') {
                    var value = attributes[prop];
                    if (value)
                        result += ' ' + prop + '="' + value + '"';
                }
            }
            
            return result;
        };
        
        this.printControls = function() {
            var result = '', ctrls = this.controls;
            for(var i = 0, c = ctrls.length; i < c; i++)
                result += ctrls[i].wrappedHTML();
            return result;
        };
        
        // Set .$text attribute on this object and refresh DOM element.outerHTML
        this.text = function(text) {
            var attributes = this.attributes;
            if (arguments.length) {
                if (text !== attributes.$text) {
                    attributes.$text = text;
                    this.refresh();
                }
            }
            return attributes.$text;
        };
        
        this._text = function(text) {
            this.text(text);
            return this;
        };
        
        this.style = function(style) {
            var attributes = this.attributes;
            
            if (arguments.length) {
                if (style !== attributes.style) {
                    attributes.style = style;
                    
                    var element = this._element;
                    if (element)
                        element.style = style;
                    
                    this.raise('attributes', 'style', style);
                };
                return style;
            }
            
            return attributes.style;
        };
        
        this._style = function(style) {
            this.style(style);
            return this;
        };
        
        this.class = function(set, remove) {
            var attributes = this.attributes;
            
            if (set || remove) {
                var _class = attributes.class;
                var classes = (_class) ? _class.split(' ') : [];
                
                if (remove) {
                    remove = remove.split(' ');
                    for(var i = 0, c = remove.length; i < c; i++) {
                        var remove_class = remove[i];
                        var index = classes.indexOf(remove_class);
                        if (index >= 0)
                            classes.splice(index, 1);
                    }
                }
                
                if (set) {
                    set = set.split(' ');
                    for(var i = 0, c = set.length; i < c; i++) {
                        var set_class = set[i];
                        if (classes.indexOf(set_class) < 0)
                            classes.push(set_class);
                    }
                }
                
                _class = classes.join(' ');
                if (_class !== attributes.class) {
                    attributes.class = _class;
                    
                    var element = this._element;
                    if (element)
                        element.className = _class;
                    
                    this.raise('attributes', 'class', _class);
                }
            }
            
            return attributes.class;
        };
        
        this._class = function(set, remove) {
            this.class(set, remove);
            return this;
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
        this.insert = function(index, type, /*optional*/ repeats, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg) {
            if (!type)
                return;
            
            // normalize arguments
            
            if ('object function'.indexOf(typeof repeats) >= 0) {
                this_arg = callback;
                callback = attributes;
                attributes = repeats;
                repeats = 1;
            }

            if (typeof attributes === 'function') {
                this_arg = callback;
                callback = attributes;
                attributes = undefined;
            }
                
            // type of first srgument
            
            if (Array.isArray(type)) {
                // collection detected
                var result;
                for(var i = index, c = index + type.length; i < c; i++)
                    result = this.insert(i, type[i], repeats, attributes, callback, this_arg);
                return result;
            }
            
            if (typeof type === 'object') {
                // it is a control?
                var add_control = type;
                if (add_control.hasOwnProperty('__type'))
                    setParent.call(type, this, index);
                return add_control;
            }
            
            // parse name for new control
            
            var name;
            var colonpos = type.indexOf(':');
            var leftpos = type.indexOf('{');
            if (colonpos >= 0 && (leftpos < 0 || colonpos < leftpos)) {
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
            if (!constructor) {
                if (!type_error_mode)
                    throw new TypeError('Type ' + __type + ' not registered!');
                else {
                    // route to Stub
                    parameters['#{type}'] = type; // pass original type
                    parameters['#{__type}'] = __type;
                    parameters['#{callback}'] = callback;
                    parameters['#{this_arg}'] = this_arg;
                    constructor = resolve_ctr('controls.stub', parameters);
                }
            }
            
            var result;
            
            // loop for create control(s)
            
            for(var i = 0, c = repeats || 1; i < c; i++) {
                // prepare parameters and attributes
                
                var params = {},
                    attrs = {class:''};
                
                for(var prop in parameters) {
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
        
        this.add = function(type, /*optional*/ repeats, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg) {
            return this.insert(this.controls.length, type, repeats, attributes, callback, this_arg);
        };
        
        this._add = function(type, /*optional*/ repeats, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg) {
            this.insert(this.controls.length, type, repeats, attributes, callback, this_arg);
            return this;
        };
        
        this.unshift = function(type, /*optional*/ repeats, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg) {
            return this.insert(0, type, repeats, attributes, callback, this_arg);
        };
        
        this._unshift = function(type, /*optional*/ repeats, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg) {
            this.insert(0, type, repeats, attributes, callback, this_arg);
            return this;
        };
        
        this.add_text = function(text, /*optional*/ repeats, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg) {
            if (typeof repeats === 'object') {
                this_arg = callback;
                callback = attributes;
                attributes = repeats;
                repeats = 1;
            }
            attributes = attributes || {};
            attributes.$text = text;
            return this.add('controls.container', repeats, attributes, callback, this_arg);
        };
        
        this._add_text = function(text, repeats, attributes, callback, this_arg) {
            this.add_text(text, repeats, attributes, callback, this_arg);
            return this;
        };
        
        this.add_p = function(text, /*optional*/ repeats, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg) {
            if (typeof repeats === 'object') {
                this_arg = callback;
                callback = attributes;
                attributes = repeats;
                repeats = 1;
            }
            attributes = attributes || {};
            attributes.$text = text;
            return this.add('p', repeats, attributes, callback, this_arg);
        };
        
        this._add_p = function(text, /*optional*/ repeats, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg) {
            this.add_p(text, repeats, attributes, callback, this_arg);
            return this;
        };
        
        this.add_templ = function(template, /*optional*/ repeats, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg) {
            if (typeof repeats === 'object') {
                this_arg = callback;
                callback = attributes;
                attributes = repeats;
                repeats = 1;
            }
            attributes = attributes || {};
            attributes.$template = template;
            return this.add('controls.custom', repeats, attributes, callback, this_arg);
        };
        
        this._add_templ = function(template, repeats, attributes, callback, this_arg) {
            this.add_templ(template, repeats, attributes, callback, this_arg);
            return this;
        };
        
        // Remove subcontrol from .controls collection
        //
        this.remove = function(control) {
            if (!arguments.length) {
                // .remove() without arguments removes this control from parent .controls collection
                this.parent = undefined;
                return;
            }
            
            if (control)
                control.parent = undefined;
            return this;
        };
        
        // Remove all subcontrols from .controls collection
        //
        this.removeAll = function() {
            for(var ctrls = this.controls, i = ctrls.length - 1; i >= 0; i--)
                this.remove(ctrls[i]);
            return this;
        };
        
        function route_data_event() {
            var args = Array.prototype.slice.call(arguments);
            args.unshift('data');
            this.raise.apply(this, args);
        };
        
        this.bind = function(data_object, post_mode) {
            var this_data = this.data;
            if (data_object !== this_data) {
                this.data = data_object;

                if (this_data) {
                    this_data.removeListener(route_data_event);
                    this_data.unsubscribe(route_data_event);
                }

                if (data_object) {
                    if (post_mode)
                        data_object.subscribe(this, route_data_event);
                    else
                        data_object.listen_(this, route_data_event);
                }
                
                route_data_event.call(this);
            }
            return this;
        };
    
        this.every      = function(delegate, thisArg)   { return this.controls.every(delegate,   thisArg || this); };
        this.filter     = function(delegate, thisArg)   { return this.controls.filter(delegate,  thisArg || this); };
        this.each       = function(delegate, thisArg)   { return this.controls.forEach(delegate, thisArg || this); };
        this.forEach    = this.each;
        this.map        = function(delegate, thisArg)   { return this.controls.map(delegate,     thisArg || this); };
        this.some       = function(delegate, thisArg)   { return this.controls.some(delegate,    thisArg || this); };
    };
    
    function extract_func_code(func) {
        if (typeof func === 'function') {
            func = func.toString();
            var first_par = func.indexOf('{'),
                last_par = func.lastIndexOf('}');
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
    function parse_type(type, parameters, namespace) {
        // remove {reference part}
        if (type.slice(-1) === '}') {
            var openpos = type.indexOf('{');
            if (openpos >= 0) {
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
        if (__type && (dotpos < 0 || (typelen >= 0 && dotpos > typelen))) {
            if (namespace) {
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
            
        if (typelen >= 0) {
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
            
            if (inheritable) {
                inheritable = inheritable.split(';'); // ';' - separated list
                for(var i = 0, c = inheritable.length; i < c; i++) {
                    var parameter = inheritable[i];
                    if (parameter) {
                        parameter = parameter.split('=');
                        var parname = parameter[0], parvalue = parameter[1];
                        if (parname) {
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

            if (unheritable) {
                unheritable = unheritable.split(';'); // ';' - separated list
                for(var i = 0, c = unheritable.length; i < c; i++) {
                    var parameter = unheritable[i];
                    if (parameter) {
                        parameter = parameter.split('=');
                        var parname = parameter[0], parvalue = parameter[1];
                        if (parname) {
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
    function resolve_ctr(__type, parameters) {
        // after parse and before ctr resolve apply alias
        
        var constructor;
        __type = __type.toLowerCase();
        
        // map __type -> subtypes array
        var subtypes_array = controls.subtypes[__type]; 
        if (subtypes_array)
        for(var i = 0, c = subtypes_array.length; i < c; i++) { // iterate subtypes array
            // each subtypes array item is key parameters object and contains the constructor reference
            var key_parameters = subtypes_array[i];
            
            // check for matching all key params values
            var hit = true;
            for(var prop in parameters)
            if ('__ctr,??'.indexOf(prop) < 0 && key_parameters[prop] !== parameters[prop]) {
                hit = false;
                break;
            }
            if (hit) {
                constructor = key_parameters.__ctr;
                break;
            }
        }
        
        if (!constructor) {
            constructor = controls[__type];
            
            // apply if alias
            if (constructor && constructor.isAlias && constructor.__type !== __type) {
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
    controls.createOrStub = function(type, /*optional*/ parameters, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg) {
        type_error_mode = 1;
        try {
            return controls.create.apply(this, arguments);
        } catch (e) {}
        finally {
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
    controls.create = function(type, /*optional*/ parameters, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg) {
        switch(arguments.length) {
            case 0:  throw new SyntaxError('Invalid Type argument value!');
            case 1:  attributes = {}; parameters = {}; break;
            case 2:
                if (typeof parameters === 'function') {
                    this_arg = attributes;
                    callback = parameters;
                    attributes = {};
                    parameters = {};
                }
                else {
                    attributes = parameters || {};
                    parameters = {}; 
                }
                break;
            default:
                if (typeof attributes === 'function') {
                    this_arg = callback;
                    callback = attributes;
                    attributes = parameters || {};
                    parameters = {};
                }
                else if (typeof parameters === 'function') {
                    this_arg = attributes;
                    callback = parameters;
                    attributes = {};
                    parameters = {};
                }
                else {
                    attributes = attributes || {};
                    parameters = parameters || {};
                }
        }
        
        var __type = parse_type(type, parameters),
            constructor = resolve_ctr(__type, parameters);
        
        if (!constructor) {
            if (!type_error_mode)
                throw new TypeError('Type ' + __type + ' not registered!');
            else {
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

    controls.text = function(text, /*optional*/ repeats, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg) {
        if (typeof repeats === 'object') {
            this_arg = callback;
            callback = attributes;
            attributes = repeats;
            repeats = 1;
        }
        attributes = attributes || {};
        attributes.$text = text;
        return controls.create('controls.container', repeats, attributes, callback, this_arg);
    };

    controls.p = function(text, /*optional*/ repeats, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg) {
        if (typeof repeats === 'object') {
            this_arg = callback;
            callback = attributes;
            attributes = repeats;
            repeats = 1;
        }
        return controls.create('controls.p', repeats, controls.extend({}, attributes), callback, this_arg);
    };

    controls.templ = function(template, /*optional*/ repeats, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg) {
        if (typeof repeats === 'object') {
            this_arg = callback;
            callback = attributes;
            attributes = repeats;
            repeats = 1;
        }
        attributes = attributes || {};
        attributes.$template = template;
        return controls.create('controls.custom', repeats, attributes, callback, this_arg);
    };
        
    // controls.reviverJSON()
    // 
    // use with JSON.parse(json, controls.reviverJSON), this function restores controls
    //
    controls.reviverJSON = function reviverJSON(key, value) {
        if (typeof(value) === 'object' && value !== null && value.hasOwnProperty('__type')) {
            var parameters = {},
                __type = parse_type(value.__type, parameters),
                constructor = resolve_ctr(__type, parameters);
            
            if (!constructor) {
                //throw new TypeError('controls.reviverJSON(): ' + __type + ' constructor not registered!');
                console.log('controls.reviverJSON(): ' + __type + ' constructor not registered!');
                // route to Stub
                parameters['#{type}'] = value.__type; // pass original type
                parameters['#{__type}'] = __type;
//                parameters['#{callback}'] = callback;
//                parameters['#{this_arg}'] = this_arg;
                constructor = resolve_ctr('controls.stub', parameters);
            }
            
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
    controls.revive = function revive(json_object) {
        if (json_object) {
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
    
    // Default control revive function
    controls.reviveControl = function(constructor, parameters, data) {
        if (data) {
            var control = constructor.is_constructor ? new constructor(parameters, data.attributes) : constructor(parameters, data.attributes);
            if (data.controls)
                control.controls = data.controls;
            
            var outer_template = data.outer_template;
            if (outer_template)
                control.template(new Function('it', outer_template));
            
            var inner_template = data.inner_template;
            if (inner_template)
                control.template(null, new Function('it', inner_template));
            
            // Restore events
            var data_events = data.events; // json object collection of serialized controls.Event
            if (data_events) {
                var events = control.events = {};
                for(var i = 0, c = data_events.length; i < c; i++) {
                    var item = data_events[i];
                    events[item.capture ? ('#' + item.type) : item.type] = new controls.Event(control, item.type, item.capture, item.listeners);
                }
            }
            return control;
        }
    };
    
    controls.decodeHTML = function(text) {
        return text ? text.replace(DECODE_HTML_MATCH, function(match) { return String.fromCharCode(parseInt(match.slice(2))); }) : text;
    };
    
    controls.encodeHTML = function(text) {
        return text ? text.replace(ENCODE_HTML_MATCH, function(match) { return ENCODE_HTML_PAIRS[match] || match; }) : text;
    };
    
    controls.extend = function(object, source) {
        for(var prop in source)
            object[prop] = source[prop];
        return object;
    };
    
    controls.delay = function(func, delay) {
        return setTimeout(function() { return func.apply(null, Array.prototype.slice.call(arguments, 2)); }, delay);
    };
    
    
    // Elementals //////////////////////////////////////////////////////////////
    
    
    (function(){
        function gencode(tagname, closetag) {
            return '\nfunction c' + tagname + '(p, a) { controls.controlInitialize(this, \'controls.' + tagname + '\', p, a, c' + tagname + '.outer_template); }\n\
c' + tagname + '.prototype = controls.control_prototype;\n'
+ (closetag
    ? 'c' + tagname + '.outer_template = function(it) { return \'<' + tagname + '\' + it.printAttributes() + \'>\' + (it.attributes.$text || \'\') + it.printControls() + \'</' + tagname + '>\'; };\n'
    : 'c' + tagname + '.outer_template = function(it) { return \'<' + tagname + '\' + it.printAttributes() + \'>\'; };\n')
+ 'controls.typeRegister(\'controls.' + tagname + '\', c' + tagname + ');\n';
        }
        
        Function('controls', 'a,abbr,address,article,aside,b,base,bdi,bdo,blockquote,button,canvas,cite,code,col,colgroup,command,datalist,dd,del,details,\
dfn,div,dl,dt,em,embed,fieldset,figcaption,figure,footer,form,gnome,h1,h2,h3,h4,h5,h6,header,i,iframe,img,ins,kbd,keygen,label,legend,li,link,map,mark,menu,meter,nav,\
noscript,object,ol,optgroup,option,output,p,pre,progress,ruby,rt,rp,s,samp,script,section,small,span,strong,style,sub,summary,sup,\
table,tbody,td,textarea,tfoot,th,thead,time,title,tr,u,ul,var,video,wbr'
            .split(',').map(function(tagname) { return gencode(tagname.toLowerCase(), true); }).join(''))(controls);
    
        Function('controls', 'area,hr,meta,param,source,track'
            .split(',').map(function(tagname) { return gencode(tagname.toLowerCase(), false); }).join(''))(controls);
    })();
    
    
    // Special /////////////////////////////////////////////////////////////////

            
    // Container
    // 
    // without own html
    // 
    function Container(parameters, attributes) {
        controls.controlInitialize(this, 'controls.container', parameters, attributes, controls.default_inner_template);
    };
    Container.prototype = controls.control_prototype;
    controls.typeRegister('controls.container', Container);
    
    // Custom
    // 
    // set template after creating the control
    // 
    function Custom(parameters, attributes) {
        controls.controlInitialize(this, 'controls.custom', parameters, attributes,
            attributes.$template || attributes.$outer_template,
            attributes.$inner_template);
    };
    Custom.prototype = controls.control_prototype;
    controls.typeRegister('controls.custom', Custom);

    // Stub
    // 
    // Stub control created on type error if type_error_mode
    // 
    function Stub(parameters, attributes) {
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
        
        controls.controlInitialize(this, 'controls.stub', parameters, attributes, function(it) { return '<div' + it.printAttributes() + '>' + it.printControls() + '</div>'; } );
        this.class('stub');
        
        var state = 0; // 0 - stub, > 0 - resources loaded, < 0 - load error
        Object.defineProperty(this, "state", {
            enumerable: true, 
            get: function() { return state; },
            set: function(value) {
                if (value !== state) {
                    state = value;
                    if (value === 0)    this.class(null, 'stub-loading stub-error');
                    else if (value < 0) this.class('stub-error', 'stub-loading');
                    else                this.class('stub-loading', 'stub-error');
                    
                    this.raise('state');
                    
                    if (this.state > 0)
                        this.tryReplace();
                }
            }
        });
        
        // try create control and replace stub on success
        this.tryReplace = function() {
            var parameters = this.parameters,
                params = {},
                attrs = {},
                attributes = this.attributes;
        
            for(var prop in parameters)
            if (prop[0] !== '#' && prop[1] !== '{')
                params[prop] = parameters[prop];
            
            for(var prop in attributes)
                attrs[prop] = attributes[prop];
        
            var control = controls.create(parameters['#{type}'], params, attrs);
            if (control) {
                control.class(null, 'stub stub-loading stub-error');
                this.replaceItself(control);
                // raise event
                this.raise('control', control);
            }
        };
    };
    Stub.prototype = controls.control_prototype;
    controls.typeRegister('controls.stub', Stub);
    
    // Head
    function Head(parameters, attributes) {
        controls.controlInitialize(this, 'controls.head', parameters, attributes, Head.template);
        this.attach    = function() { this.element = document.head; return this; };
        this.attachAll = function() { this.element = document.head; return Head.prototype.attachAll.call(this); return this; };
    };
    Head.prototype = controls.control_prototype;
    Head.template = function(it) { return '<head>' + (it.attributes.$text || '') + it.printControls() + '</head>'; };
    controls.typeRegister('controls.head', Head);
    
    // Body
    function Body(parameters, attributes) {
        controls.controlInitialize(this, 'controls.body', parameters, attributes, Body.template);
        this.attach    = function() { this.element = document.body; return this; };
        this.attachAll = function() { this.element = document.body; return Body.prototype.attachAll.call(this); return this; };
    };
    Body.prototype = controls.control_prototype;
    Body.template = function(it) { return '<body' + it.printAttributes('-id') + '>' + (it.attributes.$text || '') + it.printControls() + '</body>'; };
    controls.typeRegister('controls.body', Body);
    

    // Layouts /////////////////////////////////////////////////////////////////


    // Layout
    // Parameters:
    // float=left, float=right
    // 
    // var layout = controls.create('controls.Layout#float=left');
    // layout.cellSet.class(...);
    // 
    function Layout(parameters, attributes) {
        this.initialize('controls.layout', parameters, attributes, Layout.template);
        var clearfix = false; // use clearfix if float
        
        this.cellSet = new Container();
        this.cellSet.listen_('attributes', this, function(event) {
            var attr_name = event.name,
                attr_value = event.value,
                remove = (attr_value === undefined || attr_value === null);
            
            var element = this._element;
            if (element) {
                var nodes = element.childNodes; // element.querySelectorAll('[data-type=layout-item]');
                for(var i = nodes.length - 1; i>=0; i--) {
                    var node = nodes[i];
                    if (remove)
                        node.removeAttribute(attr_name);
                    else
                        node.setAttribute(attr_name, attr_value);
                }
            }
        });
        
        this.listen_('type', function() {
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
    Layout.template = function(it) {
        var out = '<div' + it.printAttributes() + '>',
            ctrls = it.controls, cell = '<div data-type="layout-item"' + it.cellSet.printAttributes("-id") + '>';
        for(var i = 0, c = ctrls.length; i < c; i++)
            out += cell + ctrls[i].wrappedHTML() + '</div>';
        return out + (it.clearfix) ? '<div style="clear:both;"></div></div>' : '</div>';
    };
    controls.typeRegister('controls.layout', Layout);

    
    function List(parameters, attributes) {
        this.initialize('controls.list', parameters, attributes, List.template);
        
        this.itemSet = new Container();
        this.itemSet.listen_('attributes', this, function(event) {
            var attr_name = event.name;
            var attr_value = event.value;
            var remove = (attr_value === undefined || attr_value === null);
            
            var element = this._element;
            if (element) {
                var nodes = element.childNodes; // element.querySelectorAll('[data-type=layout-item]');
                for(var i = nodes.length - 1; i>=0; i--) {
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
    List.template = function(it) {
        var out ='<ul' + it.printAttributes() + '>',
            ctrls = it.controls, item = '<li' + it.itemSet.printAttributes("-id") + '>';
        for(var i = 0, c = ctrls.length; i < c; i++)
            out += item + ctrls[i].wrappedHTML() + '</li>';
        return out + '</ul>';
    };
    controls.typeRegister('controls.list', List);
    
    
    // Input
    // 
    function Input(parameters, attributes) {
        this.initialize('controls.input', parameters, attributes, Input.template)
        .listen_('change', function() {
            this.attributes.value = this.element.value;
        })
        .listen_('element', function(element) {
            if (element)
                element.value = this.attributes.value || '';
        });
        Object.defineProperty(this, 'value', {
            get: function() { return this.attributes.value; },
            set: function(value) {
                var element = this._element;
                if (element)
                    element.value = value;
                else
                    this.attributes.value = value;
            }
        });
    };
    Input.prototype = controls.control_prototype;
    Input.template = function(it) { return '<input' + it.printAttributes() + '>' + (it.attributes.$text || '') + '</input>'; };
    controls.typeRegister('controls.input', Input);
    
    
    // Select
    // 
    // Attributes:
    //  $data {DataArray}
    //
    function Select(parameters, attributes) {
        this.initialize('controls.select', parameters, attributes, Select.template, Select.inner_template)
        .bind(attributes.hasOwnProperty('$data')
            ? controls.create('DataArray', {$data: attributes.$data})
            : controls.create('DataArray'))
        .listen_('data', this.refreshInner) // event routed from data object
        .listen_('change', function() {
            this.attributes.value = this.element.value;
        })
        .listen_('element', function(element) {
            if (element)
                element.value = this.attributes.value;
        });
        
        Object.defineProperty(this, 'value', {
            get: function() { return this.attributes.value; },
            set: function(value) {
                var element = this._element;
                if (element)
                    element.value = value;
                else
                    this.attributes.value = value;
            }
        });
    };
    Select.prototype = controls.control_prototype;
    Select.template = function(it) { return '<select' + it.printAttributes() + '>' + (it.attributes.$text || '') + it.data.map(function(item){ return '<option value=' + item + '>' + item + '</option>'; }).join('') + '</select>'; };
    Select.inner_template = function(it) { return (it.attributes.$text || '') + it.data.map(function(item){ return '<option value=' + item + '>' + item + '</option>'; }).join(''); };
    controls.typeRegister('controls.select', Select);


    // exports
    if (typeof module !== 'undefined' && module.exports) module.exports = controls;
    if (typeof define === 'function' && define.amd) define(controls);
    if (typeof window !== 'undefined' && (!window.controls || window.controls.VERSION < controls.VERSION))
        window.controls = controls;
})();

},{}]},{},[1])
;