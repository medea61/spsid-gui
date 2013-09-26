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

             var schema = obj.getSchema();
             var attrnames = obj.getAttrListForDisplay();
             
             var nRow = 0;
             for( var i=0; i<attrnames.length; i++) {
                 var attr_name = attrnames[i];
                 
                 var attrLabel = new qx.ui.basic.Label(attr_name);
                 attrLabel.set({selectable : true,
                                paddingLeft: 5,
                                paddingRight: 5});

                 var descr = schema.attrDescr(attr_name);
                 if( descr != undefined ) {
                     var tt = new qx.ui.tooltip.ToolTip(descr);
                     attrLabel.setToolTip(tt);
                 }
                 
                 this.add(attrLabel, {row: nRow, column: 0});

                 var val = obj.getAttr(attr_name);
                 
                 if( schema.isAttrBoolean(attr_name) ) {
                     if( val === "1" ) {
                         val = "true";
                     }
                     else {
                         val = "false";
                     }
                 }
                 
                 var valLabel;
                 if( schema.isAttrObjref(attr_name) ) {
                     valLabel = new spsidgui.ObjectRefWidget();
                     valLabel.setObjectID(val);
                 }
                 else {
                     valLabel = new qx.ui.basic.Label(val);
                 }
                 
                 valLabel.setSelectable(true);
                 if( schema.isAttrHilite(attr_name) ) {
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

             var schema = spsidgui.Schema.getInstance(
                 obj.getAttr('spsid.object.class'));

             if( schema.isRootObject() && this.containerButton ) {
                 buttons.containerButton = false;
             }
                 
             if( ! schema.mayHaveChildren() && this.contentButton ) {
                 buttons.contentButton = false;
             }
                 
             if( schema.displayReadOnly() && this.editButton ) {
                 buttons.editButton = false;
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
     }
 });
                      
             

         

         
