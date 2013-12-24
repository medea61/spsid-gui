qx.Class.define
("spsidgui.DisplayObject",
 {
     extend : qx.ui.container.Composite,

     construct : function(objID, buttonsRow) {

         this.initObjectID(objID);

         var layout = new qx.ui.layout.Grid(4, 0);
         layout.setColumnMinWidth(0, 180);
         layout.setColumnFlex(0, 0);
         layout.setColumnFlex(1, 1);
         
         this.base(arguments, layout);

         this.buttonsRow = buttonsRow;
         
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
         buttonsRow : null,
         buttonsRowPopulated : false,
                           
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

             if( this.getNameLabel() ) {
                 this.getNameLabel().setValue(obj.getObjectName());
             }

             var buttonsRow = this.buttonsRow;
             if( ! buttonsRow || this.buttonsRowPopulated ) {
                 return;
             }
             
             if( schema.canUseTreeBrowser() )
             {
                 var treeButton = new qx.ui.form.Button("Tree");
                 treeButton.setUserData("objID", objID);
                 treeButton.addListener(
                     "execute",
                     function(e) {
                         var oid = e.getTarget().getUserData("objID");
                         var obj = spsidgui.SpsidObject.getInstance(oid);
                         spsidgui.TreeBrowserWindow.openInstance(obj);
                     });
                 buttonsRow.add(treeButton);
             }

             if( obj.isEditable() ) {
                 var editButton = new qx.ui.form.Button("Edit");
                 editButton.setUserData("objID", objID);
                 editButton.addListener(
                     "execute",
                     function(e) {
                         var oid = e.getTarget().getUserData("objID");
                         spsidgui.EditObject.openEditInstance(oid);
                     });
                 buttonsRow.add(editButton);
             }

             this.buttonsRowPopulated = true;
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
                      
             

         

         
