qx.Class.define
("spsidgui.EditObject",
 {
     extend : spsidgui.AppWindow,

     construct : function(objID) {
         this.initObjectID(objID);
         this.base(arguments);
         
         this.addListener('close', function(e) {
             var objID = this.getObjectID();
             delete spsidgui.EditObject._instances[objID];
             this.destroy();
         }, this);
     },
     
     properties : {
         objectID :  {
             check: "String",
             deferredInit : true
         }
     },

     statics :
     {
         _instances : {},
         
         openInstance : function(objID) {
             if( ! this._instances[objID] ) {
                 var w = new spsidgui.EditObject(objID);
                 this._instances[objID] = w;
             }
             else {
                 this._instances[objID].open();
             }
             return(this._instances[objID]);
         }
     },

     members :
     {
         editZone : null,
         editedAttributes : null,
         modified : false,
         
         initWindow : function() {
             this.setShowStatusbar(false);
             this.setWidth(500);
             this.setHeight(300);
         },
         
         initContent : function() {
             
             var objID = this.getObjectID();
             var box = new qx.ui.container.Composite(new qx.ui.layout.VBox(0));
             
             var editLayout =  new qx.ui.layout.Grid(4, 0);
             editLayout.setColumnMinWidth(0, 180);
             editLayout.setColumnFlex(0, 0);
             editLayout.setColumnFlex(1, 1);
             var editZone = new qx.ui.container.Composite(editLayout);
             box.add(editZone, {flex: 1});
             this.editZone = editZone;

             this.editedAttributes = {};
             
             var buttonsRow = spsidgui.Application.buttonRow();

             var obj = spsidgui.SpsidObject.getInstance(objID);

             var addAttrButton = new qx.ui.form.MenuButton("Add Attribute");
             buttonsRow.add(addAttrButton);

             buttonsRow.add(new qx.ui.core.Spacer(50));

             var saveButton = new qx.ui.form.MenuButton("Save");
             buttonsRow.add(saveButton);

             var cancelButton = new qx.ui.form.MenuButton("Cancel");
             buttonsRow.add(cancelButton);

             buttonsRow.add(new qx.ui.core.Spacer(50));

             var deleteButton = new qx.ui.form.MenuButton("Delete Object");
             buttonsRow.add(deleteButton);
             
             box.add(buttonsRow);             
             this.add(box);

             if( obj.getReady() ) {
                 this._objectLoaded(obj);
             }

             var win = this;
             obj.addListener(
                 "loaded",
                 function(e) { win._objectLoaded(e.getTarget()) });
         },
         
         _objectLoaded : function(obj) {

             this._updateCaption();

             if( this.modified ) {
                 return;
             }
             
             var editZone = this.editZone;
             
             var removed = editZone.removeAll();
             for(var i=0; i<removed.length; i++) {
                 removed[i].dispose();
             }

             var d = spsidgui.DisplayObject.prepareForDisplay(obj);
             
             var nRow = 0;
             for( var i=0; i<d.attrnames.length; i++) {
                 var attr_name = d.attrnames[i];
                 
                 var attrLabel = new qx.ui.basic.Label(attr_name);
                 attrLabel.setPaddingRight(10);
                 if( d.hilite[attr_name] ) {
                     attrLabel.set({font: "bold"});
                 }
                 
                 if( d.tooltips[attr_name] != undefined ) {
                     var tt = new qx.ui.tooltip.ToolTip(d.tooltips[attr_name]);
                     attrLabel.setToolTip(tt);
                 }
                 
                 editZone.add(attrLabel, {row: nRow, column: 0});

                 var val = obj.getAttr(attr_name);
                 var valEdit = new qx.ui.form.TextField(val);
                 valEdit.setLiveUpdate(true);
                 valEdit.setUserData("origValue", val);
                 valEdit.setUserData("attrName", attr_name);
                 valEdit.addListener(
                     "changeValue",
                     function(e)
                     {
                         var field = e.getTarget();
                         var val = e.getData();
                         var attr_name = field.getUserData("attrName");
                         if( val != field.getUserData("origValue") ) {
                             this.editedAttributes[attr_name] = val;
                             field.setBackgroundColor("#f0e68c");
                             if( ! this.modified ) {
                                 this.modified = true;    
                                 this._updateCaption();
                             }
                         }
                         else {
                             field.resetBackgroundColor();
                             delete this.editedAttributes[attr_name];
                             if( Object.keys(
                                 this.editedAttributes).length == 0 ) {
                                 
                                 this.modified = false;
                                 this._updateCaption();
                             }
                         }
                     },
                     this);
                 
                 editZone.add(valEdit, {row: nRow, column: 1});
                 nRow++;
             }
         },
         
         _updateCaption : function() {
             var objID = this.getObjectID();
             var obj = spsidgui.SpsidObject.getInstance(objID);
             var str = "";
             if( this.modified ) {
                 str += "[modified] ";
             }
             str += 'Edit ' + obj.getObjectName() + ' -- ' +
                 obj.getAttr('spsid.object.class');
             
             this.setCaption(str);
         }
     },
 });

