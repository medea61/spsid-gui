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

        _call : function(handler, methodName, args) {

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
            
            req.addListener("success", function(e) {
                var req = e.getTarget();
                var resp = req.getResponse();

                if( resp['error'] ) {
                    throw new Error(
                        'RPC Error ' + resp['error']['code'] +
                            ': ' + resp['error']['message']);
                }

                handler(resp['result']);
            });

            req.addListener("fail", function(e) {
                var req = e.getTarget();
                var resp = req.getResponse();

                var errmsg;
                if( resp['error'] ) {
                    errmsg = 
                        'RPC Error ' + resp['error']['code'] +
                        ': ' + resp['error']['message'];
                } else {
                    errmsg =
                        'RPC call failed: ' + req.getStatus() +
                        ' ' + req.getStatusText();
                }
                alert(errmsg);
            });

            req.send();
            
            this._next_id++;            
        },

        create_object : function(handler, objclass, attr) {
            this._call(handler,
                       'create_object',
                       {'objclass' : objclass,
                        'attr' : attr});
        },

        modify_object : function(id, mod_attr) {
            this._call(function() {},
                       'modify_object',
                       {'id' : id,
                        'mod_attr' : mod_attr});
        },

        delete_object : function(id) {
            this._call(function() {},
                       'delete_object',
                       {'id' : id});
        },

        get_object : function(handler, id) {
            this._call(handler,
                       'get_object',
                       {'id' : id});
        },

        search_objects : function(handler, container, objclass) {

            var args = Array.prototype.slice.call(arguments);
            args.shift;
            args.shift;
            args.shift;
            
            this._call(handler,
                       'search_objects',
                       {'container' : container,
                        'objclass' : objclass,
                        'search_attrs' : args});
        },

        search_prefix : function(handler, objclass, attr_name, attr_prefix) {
            this._call(handler,
                       'search_prefix',
                       {'objclass' : objclass,
                        'attr_name' : attr_name,
                        'attr_prefix' : attr_prefix});
        },

        contained_classes : function(handler, container) {
            this._call(handler,
                       'contained_classes',
                       {'container' : container});
        },

        get_schema : function(handler) {
            this._call(handler,
                       'get_schema',
                       {});
        }        
    }
});

