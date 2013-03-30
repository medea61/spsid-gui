qx.Class.define
("spsidgui.EditObject",
 {
     extend : spsidgui.AppWindow,

     construct : function(objID) {
         if( objID != undefined ) {
             this.setObjectID(objID);
         }
         else {
             this.setNewObject(true);
             this.setModal(true);
         }
         
         this.base(arguments);
     },

     properties : {
         
         newObject : {
             check : "Boolean",
             init : false
         },

         objectID :  {
             check: "String",
             nullable : true
         },

         containerID :  {
             check: "String",
             nullable : true
         }
     },

     statics :
     {
         _edit_instances : {},
         _newobj_instance : null,
         
         openEditInstance : function(objID) {
             if( ! this._edit_instances[objID] ) {
                 var w = new spsidgui.EditObject(objID);
                 this._edit_instances[objID] = w;
                 
                 w.addListener('close', function(e) {
                     var objID = this.getObjectID();
                     delete spsidgui.EditObject._edit_instances[objID];
                     this.destroy();
                 }, w);
             }
             else {
                 this._edit_instances[objID].open();
             }

             this._edit_instances[objID].setStatus(
                 "Edit or add object attributes");
             return(this._edit_instances[objID]);
         },

         openNewObjInstance : function(containerID) {
             if( ! this._newobj_instance ) {
                 var w = new spsidgui.EditObject();
                 this._newobj_instance = w;
             }

             var w = this._newobj_instance;
             w.modified = false;
             w.setContainerID(containerID);
             w._populateNewObjController();
             w._clearEditZone();
             w._populateEditZone();
             w._updateCaption();
             w.open();
             w.setStatus("Fill in the attribute values for a new object");
             return(w);
         },

         _addAttrDialogWindow : null
     },

     members :
     {
         editZone : null,
         
         // for new objects: class selector
         newObjClassSelectBox : null,
         newObjClassController : null,
         newObjClassModel : null,
         
         editedAttributes : null,
         modified : false,
         invalidAttributes : null,
         
         attrDisplayProperties : null,

         saveButton : null,
         
         initWindow : function() {
             this.setShowStatusbar(true);
             this.setWidth(500);
             this.setHeight(300);
             if( this.isNewObject() ) {
                 this.setShowClose(false);
                 this.setShowMaximize(false);
             }
         },
         
         initContent : function() {
                          
             var box = new qx.ui.container.Composite(new qx.ui.layout.VBox(4));
             
             if( this.isNewObject() ) {
                 this.newObjClassSelectBox = new qx.ui.form.SelectBox();
                 this.newObjClassSelectBox.setWidth(200);
                 this.newObjClassModel = new qx.data.Array();
                 this.newObjClassController =
                     new qx.data.controller.List(
                         this.newObjClassModel,
                         this.newObjClassSelectBox);
                 
                 this.newObjClassController.addListener(
                     "changeSelection",
                     function() {
                         this._clearEditZone();
                         this._populateEditZone();
                     },
                     this);
                 
                 var classZone =
                     new qx.ui.container.Composite(new qx.ui.layout.HBox(6));
                 classZone.add(new qx.ui.basic.Label("Object class:"));
                 classZone.add(this.newObjClassSelectBox);
                 box.add(classZone);
                 box.add(new qx.ui.core.Spacer(0,20));
             }
             
             var editLayout =  new qx.ui.layout.Grid(4, 0);
             editLayout.setColumnMinWidth(0, 180);
             editLayout.setColumnFlex(0, 0);
             editLayout.setColumnFlex(1, 1);
             var editZone = new qx.ui.container.Composite(editLayout);
             this.editZone = editZone;
             box.add(editZone, {flex: 1});

             this.editedAttributes = {};
             this.invalidAttributes = {};
             
             var buttonsRow = spsidgui.Application.buttonRow();

             var addAttrButton = new qx.ui.form.MenuButton("Add Attribute");
             addAttrButton.addListener(
                 "execute",
                 function() {
                     this._onAddAttribute();
                 },
                 this);
             buttonsRow.add(addAttrButton);

             buttonsRow.add(new qx.ui.core.Spacer(50));

             var saveButton = new qx.ui.form.MenuButton("Save");
             saveButton.setEnabled(false);
             saveButton.addListener(
                 "execute",
                 function() {
                     this._onSave();
                 },
                 this);
             buttonsRow.add(saveButton);
             this.saveButton = saveButton;

             var cancelButton = new qx.ui.form.MenuButton("Cancel");
             cancelButton.addListener(
                 "execute",
                 function() {
                     this.close();
                 },
                 this);
             buttonsRow.add(cancelButton);

             buttonsRow.add(new qx.ui.core.Spacer(50));

             if( ! this.isNewObject() ) {
                 var deleteButton = new qx.ui.form.MenuButton("Delete Object");
                 deleteButton.addListener(
                     "execute",
                     function() {
                         this._onDeleteObject();
                     },
                     this);
                 
                 deleteButton.setToolTip(new qx.ui.tooltip.ToolTip(
                     "Delete this and all contained objects"));
                 buttonsRow.add(deleteButton);
             }
                 
             box.add(buttonsRow);             
             this.add(box);
             
             if( ! this.isNewObject() ) {
                 var objID = this.getObjectID();
                 var obj = spsidgui.SpsidObject.getInstance(objID);
                                  
                 obj.addListener(
                     "loaded",
                     function(e) {
                         if( ! this.modified ) {
                             this._clearEditZone();
                             this._populateEditZone();
                             this._updateCaption();
                         }
                     },
                     this);
                 
                 this._populateEditZone();
                 this._updateCaption();
             }
         },

         _clearEditZone : function() {
             var removed = this.editZone.removeAll();
             for(var i=0; i<removed.length; i++) {
                 removed[i].dispose();
             }
         },

         
         _populateNewObjController : function () {
             this.newObjClassModel.removeAll();

             var containerID = this.getContainerID();
             var cntr = spsidgui.SpsidObject.getInstance(containerID);
             var containerClass = cntr.getAttr('spsid.object.class');

             var klasses = new qx.data.Array();             
             var schema = spsidgui.Application.schema;
             for(var klass in schema) {
                 if( schema[klass].display != undefined &&
                     schema[klass].display.sequence != undefined ) {
                     var possibleContainers = schema[klass]['contained_in'];
                     if( possibleContainers != undefined ) {
                         for(var c in possibleContainers) {
                             if( possibleContainers[c] && c == containerClass ){
                                 klasses.push(klass);
                             }
                         }
                     }
                 }
             }

             klasses.sort(function(a,b) {
                 return (schema[a].display.sequence -
                         schema[b].display.sequence); });
             this.newObjClassModel.append(klasses);
             this.newObjClassSelectBox.setEnabled(true);
         },

         
         _populateEditZone : function() {

             var editZone = this.editZone;

             var d;
             var origAttributes = {};
             
             if( this.isNewObject() ) {
                 var sel = this.newObjClassController.getSelection();
                 d = {};
                 spsidgui.DisplayObject.schemaParams(sel.getItem(0), d);
                 for(var key in d) {
                     for(var attr_name in d[key]) {
                         origAttributes[attr_name] = "";
                     }
                 }
             }
             else
             {
                 var objID = this.getObjectID();
                 var obj = spsidgui.SpsidObject.getInstance(objID);
                 d = spsidgui.DisplayObject.prepareForDisplay(obj);
                 for( var i=0; i<d.attrnames.length; i++) {
                     var attr_name = d.attrnames[i];
                     origAttributes[attr_name] = obj.getAttr(attr_name);
                 }
             }

             this.attrDisplayProperties = d;
             
             var attrnames = [];
             for( var attr_name in origAttributes ) {
                 attrnames.push(attr_name);
             }
             attrnames.sort();
             
             for( var i=0; i<attrnames.length; i++) {
                 var attr_name = attrnames[i];
                 this._addAttribute(attr_name, origAttributes[attr_name]);
             }
         },

         
         _addAttribute : function(attr_name, val) {
             var d = this.attrDisplayProperties;
             var editZone = this.editZone;
             var nRow = editZone.getLayout().getRowCount();
             
             var attrLabel = new qx.ui.basic.Label(attr_name);
             attrLabel.setPaddingRight(10);
             if( d.hilite[attr_name] ) {
                 attrLabel.set({font: "bold"});
             }

             var ttText = "";
             if( d.mandatory[attr_name] ) {
                 ttText += "[mandatory] ";
             }
             if( d.tooltips[attr_name] != undefined ) {
                 ttText += d.tooltips[attr_name];
             }

             if( ttText != "" ) {
                 var tt = new qx.ui.tooltip.ToolTip(ttText);
                 attrLabel.setToolTip(tt);
             }
                 
             editZone.add(attrLabel, {row: nRow, column: 0});
             
             var valEdit = new qx.ui.form.TextField(val);
             valEdit.setLiveUpdate(true);
             valEdit.setUserData("origValue", val);
             valEdit.setUserData("attrName", attr_name);
             if( d.mandatory[attr_name] ) {
                 valEdit.setUserData("mandatory", true);
             }
             valEdit.addListener(
                 "changeValue",
                 function(e)
                 {
                     var field = e.getTarget();
                     var val = e.getData();
                     var attr_name = field.getUserData("attrName");
                     if( val == "" && field.getUserData("mandatory") ) {
                         var msg =
                             "Must provide a value for mandatory attribute";
                         field.setInvalidMessage(msg);
                         field.setValid(false);
                         this.invalidAttributes[attr_name] = true;
                         this.setStatus(msg);
                     }
                     else {
                         field.setValid(true);
                         this.invalidAttributes[attr_name] = false;
                         this.setStatus("");
                     }
                         
                     if( val != field.getUserData("origValue") ) {
                         this.editedAttributes[attr_name] = val;
                         field.setBackgroundColor("#f0e68c");
                         if( ! this.modified ) {
                             this.modified = true;
                             this._updateCaption();
                             if( this.isNewObject() ) {
                                 this.newObjClassSelectBox.setEnabled(
                                     false);
                             }
                         }
                     }
                     else {
                         field.resetBackgroundColor();
                         delete this.editedAttributes[attr_name];
                         if( Object.keys(
                             this.editedAttributes).length == 0 ) {
                                 
                             this.modified = false;
                             this._updateCaption();
                             if( this.isNewObject() ) {
                                 this.newObjClassSelectBox.setEnabled(true);
                             }
                         }
                     }

                     if( ! this.modified ) {
                         this.saveButton.setEnabled(false);
                     }
                     else {
                         var allValid = true;
                         for(var a in this.invalidAttributes) {
                             if( this.invalidAttributes[a] ) {
                                 allValid = false;
                                 break;
                             }
                         }
                         this.saveButton.setEnabled(allValid);
                     }
                 },
                 this);
             
             valEdit.fireNonBubblingEvent(
                 "changeValue", qx.event.type.Data, [val, val]);             
             editZone.add(valEdit, {row: nRow, column: 1});
         },
         
         _updateCaption : function() {
             var str = "";
             
             if( this.isNewObject() ) {
                 var containerID = this.getContainerID();
                 var cntr = spsidgui.SpsidObject.getInstance(containerID);
                 
                 if( this.modified ) {
                     str += "[edited] ";
                 }
                 
                 str += 'New object inside ' +
                     cntr.getAttr('spsid.object.class') + ' ' +
                     cntr.getObjectName();
             }
             else {
                 var objID = this.getObjectID();
                 var obj = spsidgui.SpsidObject.getInstance(objID);
                 if( this.modified ) {
                     str += "[modified] ";
                 }
                 str += 'Edit ' + obj.getObjectName() + ' -- ' +
                     obj.getAttr('spsid.object.class');
             }
                 
             this.setCaption(str);
         },


         _onAddAttribute : function() {
             if( spsidgui.EditObject._addAttrDialogWindow == undefined ) {
                 var dw = new spsidgui.DialogWindow('Add Attribute');
                 spsidgui.EditObject._addAttrDialogWindow = dw;

                 var gridLayout = new qx.ui.layout.Grid(6,6);
                 gridLayout.setColumnFlex(1,1);
                 var grid = new qx.ui.container.Composite(gridLayout);
                 
                 grid.add(new qx.ui.basic.Label("Attribute name:"),
                         {row:0, column:0});
                 var nameField = new qx.ui.form.TextField();
                 nameField.setLiveUpdate(true);
                 dw.setUserData("nameField", nameField);

                 nameField.addListener(
                     "changeValue",
                     function(e)
                     {
                         var val = e.getData();
                         var re = new RegExp("^[a-z][a-z0-9_.]+$");
                         if( re.test(val) ) {
                             this.getUserData("okButton").setEnabled(true);
                         }
                         else {
                             this.getUserData("okButton").setEnabled(false);
                         }
                     },
                     dw);

                 var okHandler = function(w) {
                     var dw = spsidgui.EditObject._addAttrDialogWindow;
                     w._addAttribute(
                         dw.getUserData("nameField").getValue(), "");
                     w.setStatus("Attribute added");
                     dw.close();
                 };
                 
                 nameField.addListener(
                     "keydown",
                     function(e)
                     {
                         if (e.getKeyIdentifier() == "Enter") {
                             okHandler(this);
                         }
                     },
                     this);
                 
                 grid.add(nameField, {row:0, column:1});
                 
                 dw.add(grid);

                 
                 var buttonsRow = spsidgui.Application.buttonRow();
                 
                 var okButton = new qx.ui.form.MenuButton("OK");
                 okButton.setEnabled(false);
                 dw.setUserData("okButton", okButton);
                 okButton.addListener(
                     "execute",
                     function() { okHandler(this) },
                     this);
                 buttonsRow.add(okButton);

                 var cancelButton = new qx.ui.form.MenuButton("Cancel");
                 cancelButton.addListener(
                     "execute",
                     function() {
                         var dw = spsidgui.EditObject._addAttrDialogWindow;
                         dw.close();
                     },
                     this);
                 buttonsRow.add(cancelButton);
                 
                 dw.add(buttonsRow);
             }

             var dw = spsidgui.EditObject._addAttrDialogWindow;
             var nameField = dw.getUserData("nameField");
             nameField.setValue("");
             dw.positionAndOpen(this, 400, 50);
             nameField.focus();
         },
         
         _onSave : function() {
         },
         
         _onDeleteObject : function() {
         }
     }
 });

