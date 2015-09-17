qx.Class.define
("spsidgui.Schema",
 {
     extend : qx.core.Object,

     properties : {
         objclass : {
             check: "String",
             nullable : true
         },
         schema :  {
             check: "Map",
             nullable : true,
             apply : "_applySchema"
         }
     },

     statics : {
         instances : null,
         rootObjectClass : null,
         alwaysHidden : {
             'spsid.object.id' : true,
             'spsid.object.container' : true
         },         
         alwaysProtected : {
             'spsid.object.class' : true,
             'spsid.object.container' : true
         },

         load : function () {
             qx.core.Assert.assertNull(
                 spsidgui.Schema.instances,
                 "spsidgui.Schema.load() is executed twice");

             spsidgui.Schema.instances = {};
             
             var rpc = spsidgui.SpsidRPC.getInstance();
             rpc.get_schema(function(target, result) {
                 for(var objclass in result) {
                     var o = new spsidgui.Schema();
                     o.setObjclass(objclass);
                     o.setSchema(result[objclass]);                     
                     spsidgui.Schema.instances[objclass] = o;

                     if( o.isRootObject() ) {
                         spsidgui.Schema.rootObjectClass = objclass;
                     }
                 }
             }, {});
         },

         getInstance : function(objclass) {
             qx.core.Assert.assertNotNull(
                 spsidgui.Schema.instances,
                 "spsidgui.Schema.load() is never executed");

             if( spsidgui.Schema.instances[objclass] == undefined ) {
                 var o = new spsidgui.Schema();
                 o.setObjclass(objclass);
                 o.setSchema({});                     
                 spsidgui.Schema.instances[objclass] = o;
             }
             
             return(spsidgui.Schema.instances[objclass]);
         },

         getRootObjectClass : function() {
             return(spsidgui.Schema.rootObjectClass);
         },

         enumerate : function(handler) {
             for(var klass in spsidgui.Schema.instances) {
                 var schema = spsidgui.Schema.instances[klass];
                 if( ! handler(schema) ) {
                     break;
                 }
             }
         }
     },

     members : {

         _applySchema : function (s) {
             if( s['attr'] == undefined ) {
                 s['attr'] = {};
             }
         },

         getSchemaDisplay : function(prop) {
             return( this.getSchema()['display'][prop] );
         },

         getSchemaAttr : function(attr) {
             return( this.getSchema()['attr'][attr] );
         },
         
         isSingleInstance : function() {
             return(this.getSchema()['single_instance'] ? true:false);
         },

         isRootObject : function() {
             return(this.getSchema()['root_object'] ? true:false);
         },
             
         isContainedIn : function(containerClass) {
             var s = this.getSchema();
             return( s['contained_in'] != undefined &&
                     s['contained_in'][containerClass] );
         },

         mayHaveChildren : function() {
             return( ! this.getSchema()['no_children'] );
         },

         hasDisplay : function() {
             return(('display' in this.getSchema()) ? true:false);
         },

         classDescription : function() {
             return(this.hasDisplay() ?
                    this.getSchemaDisplay('class_descr') :
                    this.getObjclass());
         },

         instanceDescription : function() {
             var descr;
             if( this.hasDisplay() )
             {
                 descr =  this.getSchemaDisplay('instance_descr');
                 if( descr == undefined || descr.length == 0 )
                 {
                     descr = this.getObjclass();
                 }
             }
             else
             {
                 descr = this.getObjclass();
             }
             return(descr);
         },

         displaySequence : function() {
             return(this.hasDisplay() ?
                    this.getSchemaDisplay('sequence') : null);
         },
         
         displayNameAttribute : function() {
             return(this.hasDisplay() ?
                    this.getSchemaDisplay('name_attr') : null);
         },

         displayFullNameAttribute : function() {
             if( !this.hasDisplay() ) {
                 return( null );
             }
             if( this.getSchemaDisplay('fullname_attr') != undefined ) {
                 return( this.getSchemaDisplay('fullname_attr') );
             }
             return( this.getSchemaDisplay('name_attr') );             
         },
             
         displayDescrAttributes : function() {
             if( this.hasDisplay() )
             {
                 return(this.getSchemaDisplay('descr_attr'));
             }
             else
             {
                 return(new qx.type.Array());
             }
         },
         
         displayReadOnly : function() {
             return(this.hasDisplay() &&
                    this.getSchemaDisplay('read_only'));
         },

         isTreeBrowserAllowed : function() {
             return((this.hasDisplay() &&
                     this.getSchemaDisplay('tree_browser')) ? true : false);
         },
         
         // recurrently climb up the tree to find a class which allows
         // tree browser
         canUseTreeBrowser : function() {
             if( this.isTreeBrowserAllowed() ) {
                 return(true);
             }

             var s = this.getSchema();
             if( s['contained_in'] == undefined ) {
                 return(false);
             }

             var found = false;
             for( var containerClass in s['contained_in'] ) {
                 if( s['contained_in'][containerClass] ) {
                     var containerSchema =
                         spsidgui.Schema.getInstance(containerClass);
                     
                     if( containerSchema.canUseTreeBrowser() ) {
                         found = true;
                         break;
                     }
                 }
             }
             
             return(found);
         },
         
         isFullTextSearchPossible : function() {
             if( this.hasDisplay() ) {
                 var attrlist = this.getSchemaDisplay('fullsearch_attr');
                 if( attrlist != undefined && attrlist.length > 0 ) {
                     return(true);
                 }
             }
             return(false);
         },

         attrProperty : function(attr_name, prop) {
             var p = this.getSchemaAttr(attr_name);
             if( p != undefined ) {
                 return( p[prop] );
             }
             else {
                 return null;
             }
         },
                 
         isAttrMandatory : function(attr_name) {
             return( this.attrProperty(attr_name, 'mandatory') ?
                     true : false );
         },

         isAttrUnique : function(attr_name) {
             return( this.attrProperty(attr_name, 'unique') ?
                     true : false );
         },

         attrDescr : function(attr_name) {
             return( this.attrProperty(attr_name, 'descr') );
         },

         isAttrHilite : function(attr_name) {
             return( this.attrProperty(attr_name, 'hilite') ?
                     true : false );
         },
         
         isAttrProtected : function(attr_name) {
             return( (spsidgui.Schema.alwaysProtected[attr_name] ||
                      this.attrProperty(attr_name, 'protected') ) ?
                     true : false );
         },
         
         isAttrHidden : function(attr_name) {
             return( ( spsidgui.Schema.alwaysHidden[attr_name] ||
                       this.attrProperty(attr_name, 'hidden') ) ?
                     true : false );
         },

         isAttrDictionary : function(attr_name) {
             var val = this.attrProperty(attr_name, 'dictionary');
             if( val != undefined ) {
                 qx.core.Assert.assert(
                     Array.isArray(val),
                     'dictionary property of ' + attr_name +
                         ' is not an array');
                 qx.core.Assert.assert(
                     (val.length > 0),
                     'dictionary property of ' + attr_name +
                         ' is an empty array');
                 return(true);
             }
             return(false);
         },

         getAttrDictionary : function(attr_name) {
             var ret = new qx.type.Array();
             ret.append(this.attrProperty(attr_name, 'dictionary'));
             return(ret);
         },
             
         isAttrBoolean : function(attr_name) {
             return( this.attrProperty(attr_name, 'boolean') ?
                     true : false );
         },

         isAttrInsignificant : function(attr_name) {
             return( this.attrProperty(attr_name, 'insignificant') ?
                     true : false );
         },
         
         isAttrCalculated : function(attr_name) {
             return( this.attrProperty(attr_name, 'calculated') ?
                     true : false );
         },
         
         isAttrTemplateKey : function(attr_name) {
             if( this.attrProperty(attr_name, 'templatekey') ) {
                 qx.core.Assert.assert(
                     this.isAttrDictionary(attr_name),
                     attr_name + " is a template key, but not a " +
                         "dictionary attribute");
                 return(true);
             }
             return(false);
         },
         
         isAttrTemplateMember : function(attr_name) {
             return(
                 this.attrProperty(attr_name, 'templatemember') != undefined );
         },

         isAttrActiveTemplateMember : function(attr_name, templatekeys) {
             var tmplmap = this.attrProperty(attr_name, 'templatemember');
             qx.core.Assert.assertNotNull(
                 tmplmap,
                 "isAttrActiveTemplateMember() is called on a " +
                     "non-templatemember attribute");

             for(var keyattr in templatekeys) {
                 var keyval = templatekeys[keyattr];
                 if( tmplmap[keyattr] != undefined ) {
                     for(var i=0; i < tmplmap[keyattr].length; i++) {
                         if( tmplmap[keyattr][i] == keyval ) {
                             return(true);
                         }
                     }
                 }
             }
             return(false);
         },
         
         isAttrObjref : function(attr_name) {
             return( this.attrProperty(attr_name, 'objref') == undefined ?
                     false : true );
         },

         getAttrObjref : function(attr_name) {
             return( this.attrProperty(attr_name, 'objref') );
         },

         getAttrReservedRefs : function(attr_name) {
             var ret = this.attrProperty(attr_name, 'reserved_refs');
             return( (ret != undefined) ? ret : {} );
         },

         getAttrRegexp : function(attr_name) {
             return( this.attrProperty(attr_name, 'regexp') );
         },
         
         checkAttrValue : function(attr_name, value) {
             var re = this.attrProperty(attr_name, 'regexp');
             if( re != undefined ) {
                 re = new RegExp(re);
                 return(re.test(value));
             }
             return(true);
         },

         getAttributeNames : function() {
             var ret = new qx.type.Array();
             for(var attr_name in this.getSchema()['attr']) {
                 ret.push(attr_name);
             }
             ret.sort();
             return(ret);
         }
     }
 }
);
     
