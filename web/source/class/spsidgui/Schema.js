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
             'spsid.object.id': true,
             'spsid.object.container': true
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
         }
     },

     members : {

         _applySchema : function (s) {
             if( s['attr'] == undefined ) {
                 s['attr'] = {};
             }
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
             return(this.getSchema()['display'] != undefined);
         },

         displayDescr : function() {
             return(this.hasDisplay() ?
                    this.getSchema()['display']['class_descr'] :
                    this.getObjclass());
         },

         displaySequence : function() {
             return(this.hasDisplay() ?
                    this.getSchema()['display']['sequence'] : null);
         },
         
         displayNameAttribute : function() {
             return(this.hasDisplay() ?
                    this.getSchema()['display']['name_attr'] : null);
         },
         
         displayReadOnly : function() {
             return(this.hasDisplay() &&
                    this.getSchema()['display']['read_only']);
         },

         attrProperty : function(attr_name, prop) {
             var p = this.getSchema()['attr'][attr_name];
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
             return( this.attrProperty(attr_name, 'protected') ?
                     true : false );
         },
         
         isAttrHidden : function(attr_name) {
             return( ( spsidgui.Schema.alwaysHidden[attr_name] ||
                       this.attrProperty(attr_name, 'hidden') ) ?
                     true : false );
         },

         isAttrDictionary : function(attr_name) {
             return( this.attrProperty(attr_name, 'dictionary') != undefined );
         },

         getAttrDictionary : function(attr_name) {
             return( this.attrProperty(attr_name, 'dictionary') );
         },
             
         isAttrBoolean : function(attr_name) {
             return( this.attrProperty(attr_name, 'boolean') ?
                     true : false );
         },

         isAttrInsignificant : function(attr_name) {
             return( this.attrProperty(attr_name, 'insignificant') ?
                     true : false );
         },
         
         getAttrDefaultVal : function(attr_name) {
             return( this.attrProperty(attr_name, 'default') );
         },
         
         isAttrTemplateKey : function(attr_name) {
             return( this.attrProperty(attr_name, 'templatekey') ?
                     true : false );
         },
         
         isAttrTemplateMember : function(attr_name) {
             return(
                 this.attrProperty(attr_name, 'templatemember') != undefined );
         },

         isAttrActiveTemplateMember : function(attr_name, keyattr, keyval) {
             var tmplmap = this.attrProperty(attr_name, 'templatemember');
             qx.core.Assert.assertNotNull(
                 tmplmap,
                 "isAttrActiveTemplateMember() is called on a " +
                     "non-templatemember attribute");

             if( tmplmap[keyattr] != undefined ) {
                 for(var i=0; i < tmplmap[keyattr].length; i++) {
                     if( tmplmap[keyattr][i] == keyval ) {
                         return(true);
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

         getAttributeNames : function() {
             var ret = new qx.data.Array();
             for(var attr_name in this.getSchema()['attr']) {
                 ret.push(attr_name);
             }
             ret.sort();
             return(ret);
         }
     }
 }
);
     
