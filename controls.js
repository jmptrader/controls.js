//     controls.js 0.1
//     purpose: UI framework, code generation tool
//     status: proposal, example, valid prototype, under development
//     http://
//     (c) 2013 Vadim Baklanov
//     License: MIT
//
// dependency doT.js


"use strict"; (function() {
    
function Controls(doT)
{
    var controls = this;
    controls.VERSION = '0.1';
    controls.id_generator = 53504; // don't use it out of the controls! per session id generator
    
    var IDENTIFIERS = ',id,parent,element,add,remove,style,class,__type,parameters,attributes,controls,first,last,data,';
    var HTML_TAGS = 'A,Abbr,Address,Article,Aside,B,Base,Bdi,Bdo,Blockquote,Button,Canvas,Cite,Code,Col,Colgroup,Command,Datalist,Dd,Del,Details,\
Dfn,Div,Dl,Dt,Em,Embed,Fieldset,Figcaption,Figure,Footer,Form,Gnome,Header,I,Img,Input,Ins,Kbd,Keygen,Label,Legend,Li,Link,Map,Mark,Menu,Meter,Nav,\
Noscript,Object,Ol,Optgroup,Option,Output,P,Pre,Progress,Ruby,Rt,Rp,S,Samp,Script,Section,Select,Small,Span,Strong,Style,Sub,Summary,Sup,\
Table,TBody,Td,Textarea,Tfoot,Th,Thead,Time,Title,Tr,U,Ul,Var,Video,Wbr';
    var ENCODE_HTML_MATCH = /&(?!#?\w+;)|<|>|"|'|\//g;
    var ENCODE_HTML_PAIRS = { "<": "&#60;", ">": "&#62;", '"': '&#34;', "'": '&#39;', "&": "&#38;", "/": '&#47;' };
    controls.subtypes = {}; // Registered subtypes
    
    // Initialize control object
    // 
    // type (string) - path.type and initial set of parameters
    //  format: path.type[/inheritable parameters or modificators separated commas][#unique parameters]
    //  parameters:
    //  1. [+]parameter name - inside this definition add the parameter set to true
    //  2. -parameter name - remove parameter from inheritance
    //  3. parameter name=value - add parameter set to value
    //  example: bootstrap.BtnGroup/-size,style=info#orient=vertical
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
        {
            Object.defineProperty(object, "outer_template",
            {
                configurable: true, enumerable: true, writable: true,
                value: (typeof(outer_template) === 'string') ? doT.template(outer_template) : outer_template
            });
        }

        if (inner_template)
        {
            Object.defineProperty(object, "inner_template",
            {
                configurable: true, enumerable: true, writable: true,
                value: (typeof(inner_template) === 'string') ? doT.template(inner_template) : inner_template
            });
        }
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
        var key_parameters = {};
        var __type = parse_type(type, key_parameters) .toLowerCase();
        
        constructor.is_constructor = true;
        constructor.revive = revive;
        
        if (__type.length < type.length) // type is subtype with parameters, register to controls.subtypes
        {
            var subtypes_array = controls.subtypes[__type];
            if (!subtypes_array)
            {
                subtypes_array = [];
                controls.subtypes[__type] = subtypes_array;
            }
            key_parameters.__ctr = constructor;
            subtypes_array.push(key_parameters);
        }
        else
        {
            // check name conflict
            if (controls[__type])
                throw new TypeError('Type ' + type + ' already registered!');
            
            controls[__type] = constructor;
        }
    };
    
    controls.factoryRegister = function(type, factory_method)
    {
        var key_parameters = {};
        var __type = parse_type(type, key_parameters) .toLowerCase();
        
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
        var parameters = {};
        var __type = parse_type(type, parameters) .toLowerCase();
        
        var constructor = resolve_ctr(__type, parameters);
        if (!constructor)
            throw new TypeError('Type ' + __type + ' not registered!');
            
        controls[alias.toLowerCase()] = { __type: __type, parameters: parameters, isAlias: true };
    };
    
    //
    controls.createTemplatedControl = function(__type, outer_template, inner_template)
    {
        var name = __type;
        var dotpos = name.indexOf('.');
        if (dotpos >= 0)
            name = __type.substr(dotpos + 1);
        var gencode =
'var outer_template = (typeof(outer_template) === "string") ? doT.template(outer_template) : outer_template;\
var inner_template = (typeof(inner_template) === "string") ? doT.template(inner_template) : inner_template;\
var __type = __type;\
function ' + name + '(p, a)\
{\
    controls.controlInitialize(this, __type, p, a, outer_template, inner_template);\
};\
' + name + '.prototype = controls.control_prototype;\
controls.typeRegister(__type, ' + name + ');';
        Function('controls, __type, outer_template, inner_template', gencode) (controls, __type, outer_template, inner_template);
    };
  
    // >> HTML cache
    
    // Caching outerHTML() innerHTML() calculations Optionally only for controls with the set HashControl prop
    // Caсhe dated for one day removed
    controls.html_cache = localStorage.getItem('html_cache');
    var html_cache_date = parseInt(localStorage.getItem('html_cache_date'));
    if ((!controls.html_cache && !html_cache_date) || (Date.now().valueOf() - html_cache_date) > 86400000)
    {
        // Initial state of cache
        localStorage.setItem('html_cache', '');
        localStorage.setItem('html_cache_date', Date.now().valueOf());
        controls.html_cache = {};
    }
    controls.html_cache_modified = false;
        setInterval(function()
        {
            if (controls.html_cache_modified)
            {
                localStorage.setItem('html_cache');
                controls.html_cache_modified = false;
            }
        }, 10000);
    
// >> Events
    
    controls.Event = function(listeners_data)
    {
        var listeners = new Array();
        this.listeners = listeners;

        this.raise = function(_event_data)
        {
            var event_data = {event:_event_data, sender:this};
            for(var i = 0, c = listeners.length; i < c; i+=2)
                listeners[i].call(listeners[i+1], event_data);
        };
        
//        // revive JSON
//        if (listeners_data)
//        {
//            for(var i = 0, c = listeners_data.length; i < c; i+=2)
//            {
//                var json_listener = listeners_data[i];
//                var listener_func = (json_listener instanceof Function) ? json_listener : Function('event', json_listener);
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
            var listeners = this.listeners;
            var index = listeners.indexOf(listener);
            if (index >= 0)
                listeners.splice(index, 2);
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
    
    var post_events = {};
    setInterval(function()
    {
        for(var prop in post_events)
        if (--post_events[prop] <= 0)
        {
            delete post_events[prop];
            prop.raise();
        };
    } , 30);
    
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
                return;
            
            if (!this.event)
                this.event = new controls.Event(this);
            
            this.event.addListener(call_this, listener);
        },
                
        removeListener: function(listener)
        {
            var event = this.event;
            if (event)
                event.removeListener(listener);
        },
        
        subscribe: function(call_this/*optional*/, listener)
        {
            if (typeof(call_this) === 'function')
            {
                listener = call_this;
                call_this = this;
            }
            
            if (!listener)
                return;
            
            if (!this.post_event)
                this.post_event = new controls.Event(this);
            
            this.post_event.addListener(call_this, listener);
        },
        
        unsubscribe: function(listener)
        {
            var post_event = this.post_event;
            if (post_event)
                post_event.removeListener(listener);
        },
                
        raise: function(event_data, latency)
        {
            var event = this.event;
            if (event)
                event.raise(event_data);
            
            var post_event = this.post_event;
            if (post_event)
                post_events[this] = latency || 1;
        }
    };
    
    var data_array_common =
    {
        push: function(item)
        {
            var proto = Object.getPrototypeOf(this);
            for(var i = 0, c = arguments.length; i < c; i++)
                proto.push.call(this, arguments[i]);
            this.state_id += c;
            this.last_operation = 1;
            this.last_changed = this.length - 1;
            this.raise();
        }
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
    // data - an array of values ​​for the initial filling of the data array
    //
    function DataArray(parameters, attributes) // factory method
    {
        var array = [];
        
        if (attributes)
        {
            // $data
            var data = attributes.$data;
            if (data)
            {
                for(var i = 0, c = data.length; i < c; i++)
                    array[i] = data[i];
            }
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
        this.__defineGetter__('$', function() { return (this._element) ? $(this._element) : $('#' + this.id); });
        
        this.__defineGetter__('name', function() { return this._name; });
        this.__defineSetter__('name', function(value)
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
        });
        
        this.__defineGetter__('parent', function() { return this._parent; });
        this.__defineSetter__('parent', function(value)
        {
            var parent = this._parent;
            if (value !== parent)
            {
                this._parent = value;
                
                var name = this._name;
                
                if (parent)
                {
                    var parent_controls = parent.controls;
                    var index = parent_controls.indexOf(this);
                    if (index >= 0)
                        parent_controls.slice(index, 1);
                    
                    if (name && parent.hasOwnProperty(name) && parent[name] === this)
                        delete parent[name];
                }
                
                if (value)
                {
                    var value_controls = value.controls;

// profiling: very expensive operation
//                    var index = value_controls.indexOf(this);
//                    if (index >= 0)
//                        parent_controls.slice(index, 1);

                    value_controls.push(this);
                    
                    if (name)
                        value[name] = this;
                    
                    value.refresh();
                }
            }
        });
        
        this.__defineGetter__('first', function() { return this.controls[0]; });
        this.__defineGetter__('last', function() { return this.controls[this.controls.length-1]; });

        // default html template
        this.outer_template = doT.template('<div{{=it.printAttributes()}}>{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}{{~it.controls :value:index}}{{=value.outerHTML()}}{{~}}</div>');
        // default inner html template
        this.inner_template = doT.template('{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}{{~it.controls :value:index}}{{=value.outerHTML()}}{{~}}');
                
        // snippets:
        // 
        // {{? it.attributes.$icon }}<span class="{{=it.attributes.$icon}}"></span>&nbsp;{{?}}
        // {{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}
        // include list of subcontrols html:
        // {{~it.controls :value:index}}{{=value.outerHTML()}}{{~}}

        this.innerHTML = function()
        {
            var hash_control = this.HashControl;
            if (hash_control)
            {
                // use controls.html_cache caching
                
                var hash_value = hash_control.outerHTML(); // Avoid excess computing in hash control, see outerHTML()
                var html;
                var cache_id = this.id + 'inner';
                
                if (hash_value === this.HashValue)
                {
                    // hit hash, get html from cache
                    html = controls.html_cache[cache_id];
                    if (!html)
                    {
                        html = this.inner_template(this);
                        controls.html_cache[cache_id] = html;
                    }
                }
                else
                {
                    // if hash does not match then assembly html
                    html = this.inner_template(this);
                    controls.html_cache[cache_id] = html;
                    this.HashValue = hash_value;
                }
                
                return html;
            }
            
            // assemble html
            return controls.innerHTMLtemplate(this);
        };
        
        this.outerHTML = function()
        {
            var hash_control = this.HashControl;
            if (hash_control)
            {
                // HashControl attribute and that means using cache
                
                if (hash_control === this)
                {
                     // This is a hash-control!
                     // Hash control is not cached, but is calculated once and stores its state. In order that would recalculate
                     //  the hash control, you need to reset the state by assigning HashValue to 0 null or undefinde
                     
                    var hash_value = this.HashValue;
                    
                    if (!hash_value) // hash value in hash control calculated once
                    {
                        hash_value = this.outer_template(this);
                        
                        if (!hash_value)
                            console.log('908FB5 Must have a non-empty value!');
                        
                        this.HashValue = hash_value;
                    }
                    
                    return hash_value;
                }
                else
                {
                    // use controls.html_cache caching
                
                    var hash_value = hash_control.outerHTML(); // Avoid excess computing in hash control, see outerHTML()
                    var html;
                    var cache_id = this.id;
                    
                    if (hash_value === this.HashValue)
                    {
                        // hit hash, get html from cache
                        html = controls.html_cache[cache_id];
                        if (!html)
                        {
                            html = this.outer_template(this);
                            controls.html_cache[cache_id] = html;
                        }
                    }
                    else
                    {
                        // if hash does not match then assembly html
                        html = this.outer_template(this);
                        controls.html_cache[cache_id] = html;
                        this.HashValue = hash_value;
                    }
                    
                    return html;
                }
            }
            
            // assemble html
            return this.outer_template(this);
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
            
            if (outer_template)
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
            if (!something)
            {
                this.element(document.getElementById(this.id));
            }
            else if (typeof(something) === 'string')
            {
                this.element(document.getElementById(something));
            }
            else if (typeof(something) === 'object')
            {
                var control_element = something._element;
                this.element(control_element ? control_element : something);
            }
        };
        
        // Attach this and all nested controls to DOM by id
        this.attachAll = function()
        {
            if (!this._element)
                this.element(document.getElementById(this.id));
            
            var subcontrols = this.controls;
            for(var i = subcontrols.length - 1; i >= 0; i--)
                subcontrols[i].attachAll();
        };
        
        // Detach from DOM
        this.detach = function()
        {
            this.element(undefined);
        };
        
        // Detach this and all nested from DOM
        this.detachAll = function()
        {
            this.element(undefined);
            
            var subcontrols = this.controls;
            for(var i = subcontrols.length - 1; i >= 0; i--)
                subcontrols[i].detachAll();
        };
        
        function force_event(_this, type, capture)
        {
            var dom_events =
',DOMActivate,load,unload,abort,error,select,resize,scroll,blur,DOMFocusIn,DOMFocusOut,focus,focusin,focusout,\
click,dblclick,mousedown,mouseenter,mouseleave,mousemove,mouseover,mouseout,mouseup,wheel,keydown,keypress,keyup,oncontextmenu,\
compositionstart,compositionupdate,compositionend,DOMAttrModified,DOMCharacterDataModified,DOMNodeInserted,\
DOMNodeInsertedIntoDocument,DOMNodeRemoved,DOMNodeRemovedFromDocument,DOMSubtreeModified,';
            
            var events = _this.events;
            if (!events)
            {
                events = {};
                _this.events = events;
            }
            
            var key = (capture) ? ('#' + type) : type;
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
                return;
            
            var event = force_event(this, type, capture);
            
            // listener as string acceptable:
            var listener_func = (listener instanceof Function) ? listener : Function('event', listener);
            
            event.addListener(call_this, listener_func);
        };
        
        // Alias for listen()
        this.addListener = function(type, call_this/*optional*/, listener, capture)
        {
            this.listen(type, call_this, listener, capture);
        };
        
        this.removeListener = function(type, listener, capture)
        {
            if (!type || !listener)
                return;
            
            var event = force_event(this, type, capture);
            
            // listener as string inacceptable!
            event.removeListener(listener);
        };
        
        this.raise = function(type, event_data, capture_mode)
        {
            if (!type)
                return false;
            
            var event = force_event(this, type, capture_mode);
            event.raise(event_data);
        };
        
        // The associated element of control
        //
        this.element = function(attach_to_element)
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
            {
                var key = '#' + name;
                return (parameters.hasOwnProperty(key)) ? parameters[key] : parameters[name];
            }
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
                    if (prop[0] === '#')
                    {
                        // not inheritable parameters
                        unheritable.push(prop.substr(1) + '=' + parameters[prop]);
                    }
                    else
                    {
                        // inheritable parameters
                        inheritable.push(prop + '=' + parameters[prop]);
                    }
                }
                
                var type = this.__type;
                if (inheritable.length > 0)
                    type += '/' + inheritable.join();
                if (unheritable.length > 0)
                    type += '#' + unheritable.join();

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
                if (prop.indexOf('#') !== 0)
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
                if (filter[0] === '-')
                {
                    // exclusion defined

                    var exclude = filter.substr(1).split(/ |,|;/g);
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
                    
                    var attrs = filter.split(/ |,|;/g);
                    for(var i = 0, c = attrs.length; i < c; i++)
                    {
                        var key = attrs[i];
                            result.push(key + '="' + attributes[key] + '"');
                    }
                }
            }
            else
            {
                // unconditional, out all attributes
                for(var prop in attributes)
                if (prop[0] !== '$')
                    result.push(prop + '="' + attributes[prop] + '"');
            }
            
            return (result.length === 0) ? '' : (' '+ result.join(' '));
        };
        
        // Set .$text attribute on this object and refresh DOM element.outerHTML
        this.text = function(_text)
        {
            if (arguments.length > 0)
            {
                var attributes = this.attributes;
                var text = attributes.$text;

                if (_text !== text)
                {
                    attributes.$text = _text;
                    this.refresh();
                }
            }
            return this.attributes.$text;
        };
        
        this.style = function(_style)
        {
            if (_style)
            {
                var attributes = this.attributes;
                var style = attributes.style;

                if (_style !== style)
                {
                    attributes.style = _style;
                    
                    var element = this._element;
                    if (element)
                        element.style = _style;
                    
                    this.raise('attributes', {type:'style',data:_style});
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
                    remove = remove.split(/\s|,|;/g);
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
                    set = set.split(/\s|,|;/g);
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
                    
                    this.raise('attributes', {type:'class',data:_class});
                }
            }
            
            return attributes.class;
        };
        
        // Create control and add to the .controls collection
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
        this.add = function(type, /*optional*/ repeats, /*optional*/ attributes, /*optional*/ callback, /*optional*/ this_arg)
        {
            if (!type)
                return;
            
            // normalize arguments
            
            if (typeof(repeats) !== 'number')
            {
                this_arg = callback;
                callback = attributes;
                attributes = repeats;
                repeats = 1;
            }

            if (attributes instanceof Function)
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
            
            if (typeof(type) === 'object')
            {
                // it is a control?
                var add_control = type;
                if (add_control.hasOwnProperty('__type'))
                    add_control.parent = this;
                
                return;
            }
            
            // parse name for new control
            
            var name;
            var colonpos = type.indexOf(':');
            if (colonpos >= 0)
            {
                // name: syntax detected
                name = type.substr(0, colonpos);
                type = type.substr(colonpos + 1);
            }
            
            // get inheritable parameters from this object for transfer to the created object
            
            var this_parameters = this.parameters;
            var parameters = {};
            for(var prop in this_parameters)
            if (prop[0] !== '#')
                parameters[prop] = this_parameters[prop];
            
            // resolve constructor
            
            var __type = parse_type(type, parameters, this.__type);
            var constructor = resolve_ctr(__type, parameters);
            if (!constructor)
                throw new TypeError('Type ' + __type + ' not registered!');
                
            var result;
            
            // loop for create control(s)
            
            for(var i = 0; i < repeats; i++)
            {
                // prepare parameters and attributes
                
                var params = {};
                for(var prop in parameters)
//                if (parameters.hasOwnProperty(prop))
                    params[prop] = parameters[prop];
            
                var attrs = {class:''};
                if (attributes)
                for(var prop in attributes)
//                if (attributes.hasOwnProperty(prop))
                    attrs[prop] = attributes[prop];
            
                // create control(s)
                
                var new_control = new constructor(params, attrs);

                if (name)
                    new_control.name = name;
                
                // reflect after creation
                new_control.raise('type');
                
                // set parent property
                new_control.parent = this;
            
                // callback
                if (callback)
                {
                    callback.call(this_arg || this, new_control);
                }
                
                result = new_control;
            }
            
            // refresh dom
            if (repeats > 0 && this._element)
                this.refresh();
            
            return result;
        };
        
        // Remove subcontrol from .controls collection
        //
        this.remove = function(control)
        {
            if (arguments.length === 0)
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
            var controls = this.controls;
            
            for(var i = controls.length - 1; i >= 0; i--)
                this.remove(controls[i]);
        };
        
        function route_data_event(event_data)
        {
            this.raise('data', event_data);
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
        if (func instanceof Function)
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
    // parameters {object} - parameters parsed from type string will be assigned to the passed parameters object
    // namespace {string} - base type or context namespace example: 'bootstrap.Label' or 'bootstrap'
    //
    function parse_type(type, parameters, namespace)
    {
        // get __type
        
        var dotpos = type.indexOf('.');
        var slashpos = type.indexOf('/');
        var numberpos = type.indexOf('#');
        
        var typelen = -1;
        if (slashpos >= 0)
            typelen = slashpos;
        if (numberpos >= 0 && (numberpos < typelen || typelen < 0))
            typelen = numberpos;
        
        var __type = (typelen < 0) ? type : type.substr(0, typelen);
        
        // fix type prefix
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
            
            if (numberpos > slashpos)
                unheritable = type.substr(numberpos + 1);
            else if (numberpos >= 0)
                unheritable = type.substr(numberpos + 1, slashpos - numberpos - 1);
            
            if (slashpos > numberpos)
                inheritable = type.substr(slashpos + 1);
            else if (slashpos >= 0)
                inheritable = type.substr(slashpos + 1, numberpos - slashpos - 1);
            
            if (inheritable)
            {
                inheritable = inheritable.split(',');
                for(var i = 0, c = inheritable.length; i < c; i++)
                {
                    var parameter = inheritable[i];
                    if (parameter)
                    {
                        parameter = parameter.split('=');
                        var parname = parameter[0];
                        var parvalue = parameter[1];
                        if (parname || parvalue)
                        {
                            if (parvalue === undefined)
                                parvalue = true;
                                
                            parameters[parname] = parvalue;
                        }
                    }
                }
            }

            if (unheritable)
            {
                unheritable = unheritable.split(',');
                for(var i = 0, c = unheritable.length; i < c; i++)
                {
                    var parameter = unheritable[i];
                    if (parameter)
                    {
                        parameter = parameter.split('=');
                        var parname = parameter[0];
                        var parvalue = parameter[1];
                        if (parname || parvalue)
                        {
                            if (parvalue === undefined)
                                parvalue = true;
                            
                            parameters['#' + parname] = parvalue;
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
            if (prop !== '__ctr' && key_parameters[prop] !== parameters[prop])
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
                
                return resolve_ctr(constructor.__type, parameters);
            }
        }
        
        return constructor;
    };
    
    // Create control
    //
    // type - type and parameters
    // attributes - set attributes to control
    // parameters - inherited parameters
    //
    controls.create = function(type, attributes)
    {
        var parameters = {};
        var __type = parse_type(type, parameters);
        var constructor = resolve_ctr(__type, parameters);
        if (!constructor)
            throw new TypeError('Type ' + __type + ' not registered!');
        
        var attrs = attributes || {};
        if (!attrs.class)
            attrs.class = '';
        
        // create object
        
        var new_control = (constructor.is_constructor) // constructor or factory method ?
            ? new constructor(parameters, attrs)
            : constructor(parameters, attrs);
        
        // reflect after creation
        new_control.raise('type');
        
        return new_control;
    };
    
    controls.$builder = function(control)
    {
        if (!this.$move)
            return new controls.$builder(control);
        
        this.$context = control;
        this.$context_stack = [];
    };
    controls.$builder.prototype =
    {
        // move the $builder context to
        $move: function(control)
        {
            this.$context = control;
        },
        
        // add [C]ontrol
        $C: function(type, repeats, attributes, callback, this_arg)
        {
            var context = this.$context;
            if (!context)
                throw new TypeError('$builder $C: context undefined! ' + type);
            
            return context.add(type, repeats, attributes, callback, this_arg);
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
                
                control = context.add(type, repeats, attributes, function(control)
                {
                    this.$context = control;
                    callback.call(this_arg || control, control);
                }, this);
                
                this.$context = this.$context_stack.pop();
            }
            else
            {
                control = context.add(type, repeats, attributes);
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
                throw new TypeError('$builder $T: context undefined!');
            
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
                throw new TypeError('$builder $$T: context undefined! ');
            
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
                throw new TypeError('$builder $X: context undefined!');
            
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
                throw new TypeError('$builder $$X: context undefined!');
            
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
        
        $forEach: function(callback, this_arg)
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
    
    controls.defCommand_Wrap = function(new_cmd_tag, wrapped_cmd_tag, before, after)
    {
        var proto = controls.$builder.prototype;
        before = before.replace(/\"/g,'\\\"').replace(/\'/g,'\\\'');
        after = after.replace(/\"/g,'\\\"').replace(/\'/g,'\\\'');
        proto['$' + new_cmd_tag] = Function('content', 'this.$' + wrapped_cmd_tag + '("' + before + '" + content + "' + after + '");');
        proto['$$' + new_cmd_tag] = Function('content', 'this.$$' + wrapped_cmd_tag + '("' + before + '" + content + "' + after + '");');
    };
    
    'p,h1,h2,h3,h4,h5,h6'.split(',').forEach(function(tag) { controls.defCommand_Wrap(tag, 'X', '<' + tag + '>', '</' + tag + '>'); });
    
    controls.defCommand_Func = function(command, func)
    {
        controls.$builder.prototype[command] = func;
    };
    
    // controls.reviverJSON()
    // 
    // use with JSON.parse(json, controls.reviverJSON), this function restores controls
    //
    controls.reviverJSON = function reviverJSON(key, value)
    {
        if (typeof(value) === 'object' && value !== null && value.hasOwnProperty('__type'))
        {
            var parameters = {};
            var __type = parse_type(value.__type, parameters);
            var constructor = resolve_ctr(__type, parameters);
            
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
    
    controls.encodeHTML = function(text)
    {
        return text ? text.replace(ENCODE_HTML_MATCH, function(match) { return ENCODE_HTML_PAIRS[match] || match; }) : text;
    };
    
    
    // Special /////////////////////////////////////////////////////////////////
    
    
    // Container
    // 
    // without own html
    // 
    function Container(parameters, attributes)
    {
        controls.controlInitialize(this, 'controls.Container', parameters, attributes, Container.template);
    };
    Container.prototype = controls.control_prototype;
    Container.template = doT.template('{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}{{~it.controls :value:index}}{{=value.outerHTML()}}{{~}}');
    controls.typeRegister('controls.Container', Container);
    
    // Custom
    // 
    // set template after creating the control
    // 
    function Custom(parameters, attributes)
    {
        var outer_template, inner_template;
        // $template
        var $template = attributes.$template;
        if ($template)
        {
            outer_template = $template;
            delete attributes.$template;
        }
        // $outer_template
        var $outer_template = attributes.$outer_template;
        if ($outer_template)
        {
            outer_template = $outer_template;
            delete attributes.$outer_template;
        }
        // $inner_template
        var $inner_template = attributes.$inner_template;
        if ($inner_template)
        {
            inner_template = $inner_template;
            delete attributes.$inner_template;
        }
        
        controls.controlInitialize(this, 'controls.Custom', parameters, attributes, outer_template, inner_template);
    };
    Custom.prototype = controls.control_prototype;
    controls.typeRegister('controls.Custom', Custom);
    
    function Head(parameters, attributes)
    {
        controls.controlInitialize(this, 'controls.Head', parameters, attributes, Head.template);
        this.attach    = function() { Head.prototype.attach.call(this, document.head); };
        this.attachAll = function() { Head.prototype.attach.call(this, document.head); Head.prototype.attachAll.call(this); };
    };
    Head.prototype = controls.control_prototype;
    Head.template = doT.template('<head>{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}{{~it.controls :value:index}}{{=value.outerHTML()}}{{~}}</head>');
    controls.typeRegister('controls.Head', Head);
    
    // controls.Body <BODY></BODY>
    // 
    // 
    function Body(parameters, attributes)
    {
        controls.controlInitialize(this, 'controls.Body', parameters, attributes, Body.template);
        this.attach    = function() { Body.prototype.attach.call(this, document.body); };
        this.attachAll = function() { Body.prototype.attach.call(this, document.body); Body.prototype.attachAll.call(this); };
    };
    Body.prototype = controls.control_prototype;
    Body.template = doT.template('<body{{=it.printAttributes("-id")}}>{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}{{~it.controls :value:index}}{{=value.outerHTML()}}{{~}}</body>');
    controls.typeRegister('controls.Body', Body);
    
    
    // Elementals //////////////////////////////////////////////////////////////
    
    
    var gencode = '';
    var genplate =
'function %%NAME%%(p, a)\
{\
    controls.controlInitialize(this, \'controls.%%NAME%%\', p, a, %%NAME%%.outer_template);\
};\
%%NAME%%.prototype = controls.control_prototype;\
%%NAME%%.outer_template = doT.template(\'%%OPENTAG%%{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}{{~it.controls :value:index}}{{=value.outerHTML()}}{{~}}%%CLOSETAG%%\');\
controls.typeRegister(\'controls.%%NAME%%\', %%NAME%%);\n';

    HTML_TAGS.split(',').forEach(function(tag)
    {
        var taglowercase = tag.toLowerCase();
        gencode += genplate
                .replace(/%%NAME%%/g, tag)
                .replace(/%%OPENTAG%%/g, '<'+taglowercase+'{{=it.printAttributes()}}>')
                .replace(/%%CLOSETAG%%/g, '</'+taglowercase+'>');
    });
    Function('doT,controls', gencode)(doT,controls);
    
    
    // Templated ///////////////////////////////////////////////////////////////
    
    controls.createTemplatedControl('controls.Area',        '<area{{=it.printAttributes()}}>'   );
    controls.createTemplatedControl('controls.Hr',          '<hr{{=it.printAttributes()}}>'     );
    controls.createTemplatedControl('controls.Meta',        '<meta{{=it.printAttributes()}}>'   );
    controls.createTemplatedControl('controls.Param',       '<param{{=it.printAttributes()}}>'  );
    controls.createTemplatedControl('controls.Source',      '<source{{=it.printAttributes()}}>' );
    controls.createTemplatedControl('controls.Track',       '<track{{=it.printAttributes()}}>'  );
    
    
    // Html tags
    
    
    // Heading,H1,H2,H3,H4,H5,H6
    // 
    // Parameters
    //  level - hading level
    // Attributes
    //  $text - inner text
    // 
    function Heading(parameters/*level*/, attributes/*$text*/) // function-constructor
    {
        this.level = '1';
        controls.controlInitialize(this, 'controls.Heading', parameters, attributes, Heading.template);
        
        this.listen('type', function()
        {
            var level = '1';
            var parameters = this.parameters;
            for(var prop in parameters)
            if (prop === '#level' || prop === 'level')
                level = parameters[prop];
            
            this.level = level;
        });
    };
    Heading.prototype = controls.control_prototype;
    Heading.template = doT.template(
'<h{{=it.level}}{{=it.printAttributes()}}>\
{{? it.attributes.$text }}{{=it.attributes.$text}}{{?}}{{~it.controls :value:index}}{{=value.outerHTML()}}{{~}}\
</h{{=it.level}}>\n');
    controls.typeRegister('controls.Heading', Heading);
    controls.typeAlias('controls.H1', 'controls.Heading#level=1');
    controls.typeAlias('controls.H2', 'controls.Heading#level=2');
    controls.typeAlias('controls.H3', 'controls.Heading#level=3');
    controls.typeAlias('controls.H4', 'controls.Heading#level=4');
    controls.typeAlias('controls.H5', 'controls.Heading#level=5');
    controls.typeAlias('controls.H6', 'controls.Heading#level=6');
    
    
    // Frame <iframe src=...></iframe>
    // 
    // controls.create('controls.Frame', {src: 'http://www.ibm.com'});
    // 
    function Frame(parameters, attributes/* must have "src" */) // function-constructor
    {
        if (!attributes || !attributes.src)
            throw new TypeError('controls.Frame: Must be defined "src" attribute!');
        
        controls.controlInitialize(this, 'controls.Frame', parameters, attributes, Frame.template);
    };
    Frame.prototype = controls.control_prototype;
    Frame.template = doT.template('<iframe{{=it.printAttributes()}}></iframe>\n');
    controls.typeRegister('controls.Frame', Frame);
    

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
            var event_type = event.type;
            var controls = this.controls;
            var id = this.id;
            var attributes = this.cellSet.attributes;
            for(var i = controls.length - 1; i >= 0; i--)
            {
                var cell_id = id + '.' + i;
                var cell = document.getElementById(cell_id);
                if (cell)
                    cell[event_type] = attributes[event_type];
            }
        });
        
        this.listen('type', function()
        {
            var parameters = this.parameters;
            var floatvalue;
            
            for(var prop in parameters)
            if (prop === 'float' || prop === '#float')
                floatvalue = parameters[prop];
            
            if (floatvalue)
                this.cellSet.style('float:' + floatvalue);
            
            clearfix = floatvalue;
        });
    };
    Layout.prototype = controls.control_prototype;
    Layout.template = doT.template(
'<div{{=it.printAttributes()}}>\
{{~it.controls :value:index}}<div id="{{=it.id+"."+index}}"{{=it.cellSet.printAttributes("-id")}}>{{=value.outerHTML()}}</div>{{~}}\
{{?it.clearfix}}<div style="clear:both;"></div>{{?}}</div>');
    controls.typeRegister('controls.Layout', Layout);

    
    
};

// export controls object
if (typeof module !== 'undefined' && module.exports)
    // modular environment
/*TODO*/    module.exports = Controls;
else if (typeof define === 'function' && define.amd)
    // AMD
    define(['doT'], function(doT) { return new Controls(doT); });
else if (!this.controls || this.controls.VERSION < '0.1')
{
    // client
    if (!doT) throw new TypeError('controls.js: doT.js not found!');
    this.controls = new Controls(doT);
}
}).call(this);
// << define controls object

