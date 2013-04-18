qx.Class.define
("spsidgui.DisplayObject",
 {
     extend : qx.ui.container.Composite,

     construct : function(objID) {

         this.initObjectID(objID);

         var layout = new qx.ui.layout.Grid(4, 0);
         layout.setColumnMinWidth(0, 180);
         layout.setColumnFlex(0, 0);
         layout.setColumnFlex(1, 1);
         
         this.base(arguments, layout);

         var myself = this;
         var obj = spsidgui.SpsidObject.getInstance(objID);

         obj.addListener("loaded", this._onObjectLoaded, this);
         obj.addListener("deleted", this._onObjectDeleted, this);
     },

     destruct : function()
     {
         var objID = this.getObjectID();
         var obj = spsidgui.SpsidObject.getInstance(objID);
         if( obj != undefined ) {
             obj.removeListener("loaded", this._onObjectLoaded, this);
             obj.removeListener("deleted", this._onObjectDeleted, this);
         }
     },
     
     properties : {
         objectID :  {
             check: "String",
             deferredInit : true
         },

         nameLabel : {
             check : "Object",
             nullable : true
         },

         destroyOnObjectDelete : {
             check : "Object",
             nullable : true
         }
     },

     members :
     {
         containerButton : null,
         contentButton : null,
         editButton : null,
         
         addControlButtons : function(container) {
             
             var objID = this.getObjectID();
             
             var refreshButton = new qx.ui.form.Button("Refresh");
             refreshButton.setUserData("objID", objID);
             refreshButton.addListener(
                 "execute", function(e) {
                     var oid = e.getTarget().getUserData("objID");
                     var obj = spsidgui.SpsidObject.getInstance(oid);
                     obj.refresh();
                 });
             container.add(refreshButton);
         
             var containerButton = new qx.ui.form.Button("Container");
             containerButton.setUserData("objID", objID);
             containerButton.setEnabled(false);
             containerButton.addListener(
                 "execute",
                 function(e) {
                     var oid = e.getTarget().getUserData("objID");
                     var obj = spsidgui.SpsidObject.getInstance(oid);
                     if( obj.getReady() ) {
                         var cntr = obj.getAttr('spsid.object.container');
                         if( cntr != undefined && cntr != 'NIL' ) {
                             spsidgui.ObjectWindow.openInstance(cntr);
                         }
                     }
                 });
             container.add(containerButton);
             this.containerButton = containerButton;

             var contentButton = new qx.ui.form.Button("Contents");
             contentButton.setUserData("objID", objID);
             contentButton.setEnabled(false);
             contentButton.addListener(
                 "execute",
                 function(e) {
                     var oid = e.getTarget().getUserData("objID");
                     spsidgui.ContainedObjWindow.openInstance(oid);
                 });
             container.add(contentButton);
             this.contentButton = contentButton;
                      
             var editButton = new qx.ui.form.Button("Edit");
             editButton.setUserData("objID", objID);
             editButton.setEnabled(false);
             editButton.addListener(
                 "execute",
                 function(e) {
                     var oid = e.getTarget().getUserData("objID");
                     spsidgui.EditObject.openEditInstance(oid);
                 });
             container.add(editButton);
             this.editButton = editButton;
         },
         
         buildContent : function() {

             this.clear();
             
             var objID = this.getObjectID();
             var obj = spsidgui.SpsidObject.getInstance(objID);
             
             if( ! obj.getReady() ) {
                 return;
             }

             var d = spsidgui.DisplayObject.prepareForDisplay(obj);
             
             var nRow = 0;
             for( var i=0; i<d.attrnames.length; i++) {
                 var attr_name = d.attrnames[i];
                 
                 var attrLabel = new qx.ui.basic.Label(attr_name);
                 attrLabel.set({selectable : true,
                                paddingLeft: 5});

                 if( d.tooltips[attr_name] != undefined ) {
                     var tt = new qx.ui.tooltip.ToolTip(d.tooltips[attr_name]);
                     attrLabel.setToolTip(tt);
                 }
                 
                 this.add(attrLabel, {row: nRow, column: 0});

                 var val = obj.getAttr(attr_name);
                 
                 if( d.is_boolean[attr_name] ) {
                     if( val === "1" ) {
                         val = "true";
                     }
                     else {
                         val = "false";
                     }
                 }
                 
                 var valLabel;
                 if ( d.is_objref[attr_name] ) {
                     valLabel = new spsidgui.ObjectRefWidget();
                     valLabel.setObjectID(val);
                 }
                 else {
                     valLabel = new qx.ui.basic.Label(val);
                 }
                 
                 valLabel.setSelectable(true);
                 if( d.hilite[attr_name] ) {
                     valLabel.set({font: "bold"});
                 }
                 
                 this.add(valLabel, {row: nRow, column: 1});
                 nRow++;
             }

             this.updateButtons();

             if( this.getNameLabel() ) {
                 this.getNameLabel().setValue(obj.getObjectName());
             }
         },

         updateButtons : function() {
             // disable some buttons according to schema attributes

             var objID = this.getObjectID();
             var obj = spsidgui.SpsidObject.getInstance(objID);
             
             if( ! obj.getReady() ) {
                 return;
             }

             var buttons = {
                 containerButton : true,
                 contentButton : true,
                 editButton : true
             };             

             var schema = spsidgui.Application.schema[
                 obj.getAttr('spsid.object.class')];

             if( schema != undefined ) {
                 if( schema['root_object'] && this.containerButton ) {
                     buttons.containerButton = false;
                 }
                 
                 if( schema['no_children'] && this.contentButton ) {
                     buttons.contentButton = false;
                 }
                 
                 if( schema.display &&
                     schema.display['read_only'] && this.editButton ) {
                     buttons.editButton = false;
                 }
             }

             var v = obj.getAttr('spsid_gui.edit.locked');
             if( v != undefined && v != 0 ) {
                 buttons.editButton = false;
             }

             for(var b in buttons) {
                 if( this[b] != undefined ) {
                     this[b].setEnabled(buttons[b]);
                 }
             }
         },

         clear : function() {
             var removed = this.removeAll();
             for(var i=0; i<removed.length; i++) {
                 removed[i].dispose();
             }
         },
         
         _onObjectLoaded : function () {
             this.buildContent();
         },
         
         _onObjectDeleted : function() {
             if( this.getDestroyOnObjectDelete() != undefined ) {
                 this.getDestroyOnObjectDelete().destroy();
             }
             this.destroy();             
         }
     },

     statics :
     {
         prepareForDisplay : function (obj) {
             
             var attr = obj.getAttrCache();
             var klass = attr['spsid.object.class'];
             var d = {};
             spsidgui.DisplayObject.schemaParams(klass, d);

             var hide = {'spsid.object.id': 1,
                         'spsid.object.container': 1};
             
             var attrnames = new Array;
             for( var attr_name in attr ) {
                 if( ! hide[attr_name] ) {
                     attrnames.push(attr_name);
                 }
             }
             attrnames.sort();
             d["attrnames"] = attrnames;
             
             return(d);
         },

         schemaParams : function (klass, d) {
             var schema = spsidgui.Application.schema[klass];
             var hilite = {};
             var tooltips = {};
             var mandatory = {};
             var is_boolean = {};
             var default_val = {};
             var is_objref = {};
             var objref_class = {};
             var is_protected = {"spsid.object.class" : true};
             var is_dictionary = {};
             var dictionary = {};
             
             
             if( schema != undefined && schema.display != undefined ) {
                 
                 if( schema.mandatory != undefined ) {
                     for (var name in schema.mandatory) {
                         if( schema.mandatory[name] ) {
                             mandatory[name] = true;
                         }
                     }
                 }
                 
                 if( schema.display.info_attr != undefined ) {
                     for (var i=0; i< schema.display.info_attr.length; i++) {
                         hilite[schema.display.info_attr[i]] = true;
                     }
                 }

                 if( schema.display.name_attr != undefined ) {
                     hilite[schema.display.name_attr] = true;
                 }

                 if( schema.display.attr_help != undefined ) {
                     for(var name in schema.display.attr_help) {
                         tooltips[name] = schema.display.attr_help[name];
                     }
                 }
                 
                 if( schema.display['boolean'] != undefined ) {
                     for(var name in schema.display['boolean']) {
                         if( schema.display['boolean'][name] ) {
                             is_boolean[name] = true;
                         }
                     }
                 }
                 
                 if( schema.display['default'] != undefined ) {
                     for(var name in schema.display['default']) {
                         default_val[name] = schema.display['default'][name];
                     }
                 }

                 if( schema.object_ref != undefined ) {
                     for(var name in schema.object_ref) {
                         is_objref[name] = true;
                         objref_class[name] = schema.object_ref[name];
                     }
                 }
                 
                 if( schema.display['protected'] != undefined ) {
                     for(var name in schema.display['protected']) {
                         if( schema.display['protected'][name] ) {
                             is_protected[name] = true;
                         }
                     }
                 }

                 if( schema.display['dictionary'] != undefined ) {
                     for(var name in schema.display['dictionary']) {
                         var values = schema.display['dictionary'][name];
                         dictionary[name] = [];
                         is_dictionary[name] = true;
                         for(var i=0; i<values.length; i++) {
                             dictionary[name].push(values[i]);
                         }
                     }
                 }
             }

             d["hilite"] = hilite;
             d["tooltips"] = tooltips;
             d["mandatory"] = mandatory;
             d["is_boolean"] = is_boolean;
             d["default_val"] = default_val;
             d["is_objref"] = is_objref;
             d["objref_class"] = objref_class;
             d["is_protected"] = is_protected;
             d["is_dictionary"] = is_dictionary;
             d["dictionary"] = dictionary;
         }
     }
 });
                      
             

         

         
