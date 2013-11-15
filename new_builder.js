    controls.$builder = function(control) {
        if (!this.$move)
            return new controls.$builder(control);
        
        this.$default = 'controls.';
        this.$context = control;
        this.$context_stack = [];
    };
    function check_type(builder, type) {
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
        
        if (dotpos < 0) {
            if (colonpos >= 0)
                type = type.substr(0, colonpos + 1) + builder.$default + type.substr(colonpos + 1);
            else
                type = builder.$default + type;
        }
        
        return type;
    }
    // $builder commands executed in the context of the control, avoid name conflicts.
    // Naming convention: $ command does not change the context. $$ command - changing context.
    controls.$builder.prototype = {
        // move the $builder context to
        $move: function(control) {
            this.$context = control;
        },
        // set default namespace
        $namespace : function(namespace) {
            if (namespace.indexOf('.') < 0)
                namespace = namespace + '.';
            
            this.$default = namespace;
        },
        // add [C]ontrol
        $C: function(type, repeats, attributes, callback, this_arg) {
            var context = this.$context;
            if (!context)
                throw new TypeError('$C: context undefined! ' + type);

            return context.add(check_type(this, type), repeats, attributes, callback, this_arg);
        },
        $$C: function(type, repeats, attributes, callback, this_arg) {
            if (typeof(repeats) !== 'number') {
                this_arg = callback;
                callback = attributes;
                attributes = repeats;
                repeats = 1;
            }
            
            if (typeof(attributes) === 'function') {
                this_arg = callback;
                callback = attributes;
                attributes = undefined;
            }
            
            var context = this.$context;
            if (!context)
                throw new TypeError('$builder $$C: context undefined! ' + type);
            
            var control;
            
            if (callback) {
                this.$context_stack.push(this.$context);
                
                control = context.add(check_type(this, type), repeats, attributes, function(control) {
                    this.$context = control;
                    callback.call(this_arg || control, control);
                }, this);
                
                this.$context = this.$context_stack.pop();
            }
            else {
                control = context.add(check_type(this, type), repeats, attributes);
                this.$context = control;
            }
            
            return control;
        },
        
        // add [T]emplate
        $T: function(template, repeats, attributes, callback, this_arg) {
            if (typeof(repeats) !== 'number') {
                this_arg = callback;
                callback = attributes;
                attributes = repeats;
                repeats = 1;
            }
            
            if (typeof(attributes) === 'function') {
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
        $$T: function(template, repeats, attributes, callback, this_arg) {
            if (typeof(repeats) !== 'number') {
                this_arg = callback;
                callback = attributes;
                attributes = repeats;
                repeats = 1;
            }
            
            if (typeof(attributes) === 'function') {
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
            
            if (callback) {
                this.$context_stack.push(this.$context);
                
                control = context.add('controls.Custom', repeats, attrs, function(control) {
                    this.$context = control;
                    callback.call(this_arg || control, control);
                }, this);
                
                this.$context = this.$context_stack.pop();
            }
            else {
                control = context.add('controls.Custom', repeats, attrs);
                this.$context = control;
            }
            
            return control;
        },
        
        // add te[X]t
        $X: function(text, repeats, attributes, callback, this_arg) {
            if (typeof(repeats) !== 'number') {
                this_arg = callback;
                callback = attributes;
                attributes = repeats;
                repeats = 1;
            }
            
            if (typeof(attributes) === 'function') {
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
        $$X: function(text, repeats, attributes, callback, this_arg) {
            if (typeof(repeats) !== 'number') {
                this_arg = callback;
                callback = attributes;
                attributes = repeats;
                repeats = 1;
            }
            
            if (typeof(attributes) === 'function') {
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
            
            if (callback) {
                this.$context_stack.push(this.$context);
                
                control = context.add('controls.Container', repeats, attrs, function(control) {
                    this.$context = control;
                    callback.call(this_arg || control, control);
                }, this);
                
                this.$context = this.$context_stack.pop();
            }
            else {
                control = context.add('controls.Container', repeats, attrs);
                this.$context = control;
            }
            
            return control;
        },
        
        // [E]ncode text
        $E: function(text, repeats, attributes, callback, this_arg) {
            return this.$X(controls.encodeHTML(text), repeats, attributes, callback, this_arg);
        },
        $$E: function(text, repeats, attributes, callback, this_arg) {
            return this.$$X(controls.encodeHTML(text), repeats, attributes, callback, this_arg);
        },
        $encode: function(text) { return controls.encodeHTML(text); },
        
        forEach: function(callback, this_arg) {
            var control = this.$context;
            if (control)
                control.controls.forEach(callback, this_arg || this);
        },
        $$forEach: function(callback, this_arg) {
            var control = this.$context;
            if (control) {
                this.$context_stack.push(this.$context);
                
                var controls = control.controls;
                for(var prop in controls) {
                    var control = controls[prop];
                    this.$context = control;
                    callback.call(this_arg || this, control);
                }
                
                this.$context = this.$context_stack.pop();
            }
        }
    };
    
    controls.defCommand = function(command, func) {
        controls.$builder.prototype[command] = func;
    };
    
    'p'.split(',').forEach(function(tag) {
        controls.defCommand('$' + tag, function(text,_class,style) { this.$C(tag, {$text:text, class:_class, style:style}); });
        controls.defCommand('$$' + tag, function(text,_class,style) { this.$$C(tag, {$text:text, class:_class, style:style}); });
    });
    
    'h1,h2,h3,h4,h5,h6'.split(',').forEach(function(tag) {
        controls.defCommand('$' + tag, function(text,id,_class,style) { if(id)id=id.replace(/ /g,'-'); this.$C(tag, {$text:text, id:id, class:_class, style:style}); });
        controls.defCommand('$$' + tag, function(text,id,_class,style) { if(id)id=id.replace(/ /g,'-'); this.$$C(tag, {$text:text, id:id, class:_class, style:style}); });
    });
    


var builder = controls.builder();
builder
        .xtempl('div', function(div) {
            div.listen('click', function() {
            });
        })
        ._add('div')
        ._text('div')
        ._templ('<div></div>');