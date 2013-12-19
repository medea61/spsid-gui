/* JSON-RPC connection to SPSID */

qx.Class.define('spsidgui.SpsidRPC', {
    extend : qx.core.Object,
    type : "singleton",
    
    construct : function()
    {
        this._url = qx.core.Environment.get('spsidgui.db.url');
    },
    
    members : {

        _url : null,
        _next_id : 1,

        _call : function(handler, target, methodName, args) {

            var req = new qx.io.request.Xhr(this._url, 'POST');
            req.setRequestHeader('Content-Type', 'application/json');
            req.setTimeout(20*1000);
            
            var rpcData =
                {
                    "jsonrpc" : "2.0",
                    "method" : methodName,
                    "id" : this._next_id,
                    "params" : args
                };

            req.setRequestData(qx.lang.Json.stringify(rpcData));
            req.setParser(qx.io.request.Xhr.PARSER["json"]);
            req.setUserData("SpsidRPC.target", target);
            req.addListener("success", function(e) {
                var req = e.getTarget();
                var resp = req.getResponse();

                if( resp['error'] ) {
                    var errmsg = 
                        'RPC Error ' + resp['error']['code'] +
                        ': ' + resp['error']['message'];
                    
                    console.log(errmsg);
                    alert(errmsg);
                }
                else {
                    handler(req.getUserData("SpsidRPC.target"), resp['result']);
                }
            });

            req.addListener("fail", function(e) {
                var req = e.getTarget();
                var errmsg;
                
                var resp = req.getResponse();

                if( resp && resp['error'] ) {
                    errmsg = 
                        'RPC Error ' + resp['error']['code'] +
                        ': ' + resp['error']['message'];
                    if( resp['error']['data'] != undefined ) {
                        errmsg += ' -- ' + resp['error']['data'];
                    }
                } else {
                    errmsg = 'RPC call failed: ';
                    if( req.getStatus() != undefined ) {
                        errmsg += req.getStatus() + ' ';
                    }
                    if( req.getStatusText() != undefined ) {
                        errmsg += req.getStatusText();
                    }
                    var rawtext = req.getResponseText();
                    if( rawtext != undefined && rawtext.length > 0 ) {
                        errmsg += "\n Raw message: " + rawtext;
                    }
                }
                console.log(errmsg);
                alert(errmsg);
            });

            req.send();
            
            this._next_id++;            
        },

        create_object : function(handler, target, objclass, attr) {
            this._call(handler, target,
                       'create_object',
                       {'objclass' : objclass,
                        'attr' : attr});
        },

        modify_object : function(handler, target, id, mod_attr) {
            this._call(handler, target,
                       'modify_object',
                       {'id' : id,
                        'mod_attr' : mod_attr});
        },

        validate_object : function(handler, target, attr) {
            this._call(handler, target, 'validate_object', {'attr' : attr});
        },
            
        delete_object : function(handler, target, id) {
            this._call(handler, target,
                       'delete_object',
                       {'id' : id});
        },

        get_object : function(handler, target, id) {
            this._call(handler, target,
                       'get_object',
                       {'id' : id});
        },

        get_object_log : function(handler, target, id) {
            this._call(handler, target,
                       'get_object_log',
                       {'id' : id});
        },

        search_objects : function(handler, target, container, objclass) {

            var args = Array.prototype.slice.call(arguments);
            args.splice(0,4);
            
            this._call(handler, target,
                       'search_objects',
                       {'container' : container,
                        'objclass' : objclass,
                        'search_attrs' : args});
        },

        search_prefix : function(handler, target,
                                 objclass, attr_name, attr_prefix) {
            this._call(handler, target,
                       'search_prefix',
                       {'objclass' : objclass,
                        'attr_name' : attr_name,
                        'attr_prefix' : attr_prefix});
        },

        search_fulltext : function(handler, target,
                                   objclass, search_string) {
            this._call(handler, target,
                       'search_fulltext',
                       {'objclass' : objclass,
                        'search_string' : search_string});
        },

        contained_classes : function(handler, target, container) {
            this._call(handler, target,
                       'contained_classes',
                       {'container' : container});
        },

        get_schema : function(handler, target) {
            this._call(handler, target,
                       'get_schema',
                       {});
        },

        new_object_default_attrs :
        function(handler, target, container, objclass, templatekeys) {
            this._call(handler, target,
                       'new_object_default_attrs',
                       {'container' : container,
                        'objclass' : objclass,
                        'templatekeys' : templatekeys});
        }
    }
});

