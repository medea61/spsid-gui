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

     destruct : function()
     {
         if( this.objLoadListener != null ) {
             var objID = this.getObjectID();
             var obj = spsidgui.SpsidObject.getInstance(objID);
             obj.removeListenerById(this.objLoadListener);             
         }
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
             if( spsidgui.EditObject._edit_instances[objID] == undefined ) {
                 var w = new spsidgui.EditObject(objID);
                 spsidgui.EditObject._edit_instances[objID] = w;
                 
                 w.addListener('close', function(e) {
                     var target = e.getTarget();
                     var objID = target.getObjectID();
                     delete spsidgui.EditObject._edit_instances[objID];
                     target.destroy();
                 }, w);
             }
             else {
                 spsidgui.EditObject._edit_instances[objID].open();
             }

             spsidgui.EditObject._edit_instances[objID].setStatus(
                 "Edit or add object attributes");
             return(spsidgui.EditObject._edit_instances[objID]);
         },

         openNewObjInstance : function(containerID, notifyRefresh) {
             if( ! spsidgui.EditObject._newobj_instance ) {
                 var w = new spsidgui.EditObject();
                 spsidgui.EditObject._newobj_instance = w;
             }

             var w = spsidgui.EditObject._newobj_instance;
             w.notifyRefresh = notifyRefresh;
             w.setContainerID(containerID);
             w._populateClassSelectBox();
             w._clearEditZone();
             w._populateEditZone();
             w._updateCaption();
             w.open();
             w.setStatus("Fill in the attribute values for a new object");
             return(w);
         },

         classNamesForNewObject : function(containerClass) {
             var klasses = new qx.data.Array();             
             var schema = spsidgui.Application.schema;
             for(var klass in schema) {
                 if( schema[klass].display != undefined &&
                     schema[klass].display.sequence != undefined &&
                     ! schema[klass].display['read_only'] ) {
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
             return(klasses);
         },

         _addAttrDialogWindow : null,
         _validationErrorDialogWindow : null
     },

     members :
     {
         editZone : null,
         objLoadListener : null,
         
         // for new objects: class selector
         newObjClassSelectBox : null,
         
         origAttributes : null,
         editedAttributes : null,
         modified : false,
         invalidAttributes : null,
         
         attrDisplayProperties : null,

         saveButton : null,
         notifyRefresh : null,
         
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
                 var model = new qx.data.Array();
                 var selectBox = this.newObjClassSelectBox =
                     new qx.ui.form.VirtualSelectBox(model);
                 selectBox.setWidth(200);

                 selectBox.getSelection().addListener(
                     "change",
                     function() {
                         this._clearEditZone();
                         this._populateEditZone();
                     },
                     this);
                 
                 var classZone =
                     new qx.ui.container.Composite(new qx.ui.layout.HBox(6));
                 classZone.add(new qx.ui.basic.Label("Object class:"));
                 classZone.add(selectBox);
                 box.add(classZone);
                 box.add(new qx.ui.core.Spacer(0,20));
             }
             
             var editLayout =  new qx.ui.layout.Grid(4, 4);
             editLayout.setColumnMinWidth(0, 180);
             editLayout.setColumnFlex(0, 0);
             editLayout.setColumnFlex(1, 1);
             var editZone = new qx.ui.container.Composite(editLayout);
             this.editZone = editZone;
             box.add(editZone, {flex: 1});

             this.editedAttributes = {};
             this.invalidAttributes = {};
             
             var buttonsRow = spsidgui.Application.buttonRow();

             var addAttrButton = new qx.ui.form.Button("Add Attribute");
             addAttrButton.addListener(
                 "execute",
                 function() {
                     this._onAddAttribute();
                 },
                 this);
             buttonsRow.add(addAttrButton);

             buttonsRow.add(new qx.ui.core.Spacer(50));

             var saveButton = new qx.ui.form.Button("Save");
             saveButton.setEnabled(false);
             saveButton.addListener(
                 "execute",
                 function() {
                     this._onSave();
                 },
                 this);
             saveButton.setToolTip(new qx.ui.tooltip.ToolTip(
                 "Validate and save the object"));
             buttonsRow.add(saveButton);
             this.saveButton = saveButton;

             var cancelButton = new qx.ui.form.Button("Cancel");
             cancelButton.addListener(
                 "execute",
                 function() {
                     this.close();
                 },
                 this);
             buttonsRow.add(cancelButton);

             buttonsRow.add(new qx.ui.core.Spacer(50));

             if( ! this.isNewObject() ) {
                 var deleteButton = new qx.ui.form.Button("Delete Object");
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
                                  
                 this.objLoadListener = obj.addListener(
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
             this.modified = false;
             this.editedAttributes = {};
             this.invalidAttributes = {};
             this.saveButton.setEnabled(false);
         },

         
         _populateClassSelectBox : function () {

             var model = this.newObjClassSelectBox.getModel();
             model.removeAll();

             var containerID = this.getContainerID();
             var cntr = spsidgui.SpsidObject.getInstance(containerID);
             var klasses = spsidgui.EditObject.classNamesForNewObject(
                 cntr.getAttr('spsid.object.class'));
             
             model.append(klasses);
             this.newObjClassSelectBox.setEnabled(true);
         },

         
         _populateEditZone : function() {

             var editZone = this.editZone;

             var d;
             var origAttributes = {};
             
             if( this.isNewObject() ) {
                 var sel = this.newObjClassSelectBox.getSelection();
                 d = {};
                 spsidgui.DisplayObject.schemaParams(sel.getItem(0), d);
                 for(var key in d) {
                     for(var attr_name in d[key]) {
                         if( ! d.is_protected[attr_name] ) {
                             if( d.default_val[attr_name] != undefined ) {
                                 origAttributes[attr_name] =
                                     d.default_val[attr_name];
                             }
                             else {
                                 if ( d.is_objref[attr_name] ) {
                                     origAttributes[attr_name] = 'NIL';
                                 }
                                 else {
                                     origAttributes[attr_name] = "";
                                 }
                             }
                         }
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
             this.origAttributes = origAttributes;
             
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

             if( this.isNewObject() && d.is_protected[attr_name] ) {
                 return;
             }
                              
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
             
             var valWidget;
             if( d.is_boolean[attr_name] ) {
                 val = (val == 0 ? "0":"1");
                 valWidget = new qx.ui.form.CheckBox();
                 valWidget.setValue(val === "1" ? true:false);
             }
             else if ( d.is_objref[attr_name] ) {
                 if( val == "" ) {
                     val = 'NIL';
                 }
                 valWidget = new spsidgui.ObjectRefWidget();
                 valWidget.setObjectID(val);                 
             }
             else if( d.is_protected[attr_name] ) {
                 valWidget = new qx.ui.basic.Label(val);
             }
             else {
                 valWidget = new qx.ui.form.TextField(val);
                 valWidget.setLiveUpdate(true);
                 if( d.mandatory[attr_name] ) {
                     valWidget.setUserData("mandatory", true);
                 }
             }

             valWidget.setUserData("origValue", val);
             valWidget.setUserData("attrName", attr_name);
             
             if( d.is_boolean[attr_name] ) {
                 valWidget.addListener(
                     "changeValue",
                     function(e)
                     {
                         var field = e.getTarget();
                         var val = (e.getData() ? "1":"0");
                         this._fieldValueChanged(val, field);
                     },
                     this);
             }
             else if ( d.is_objref[attr_name] ) {
                 valWidget.addListener(
                     "changeObjectID",
                     function(e)
                     {
                         var field = e.getTarget();
                         this._fieldValueChanged(e.getData(), field);
                     },
                     this);
             }
             else if( ! d.is_protected[attr_name] ) {
                 valWidget.addListener(
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
                         
                         this._fieldValueChanged(val, field);
                     },
                     this);
             
                 valWidget.fireNonBubblingEvent(
                     "changeValue", qx.event.type.Data, [val, val]);
             }

             if ( d.is_objref[attr_name] ) {
                 var valComposite = new qx.ui.container.Composite(
                     new qx.ui.layout.HBox(8));
                 valComposite.add(valWidget);

                 var refChangeButton = new qx.ui.form.Button("modify");
                 refChangeButton.setUserData("valWidget", valWidget);
                 refChangeButton.setUserData("objClass",
                                             d.objref_class[attr_name]);
                 refChangeButton.addListener(
                     "execute", function(e) {
                         var widget = e.getTarget().getUserData("valWidget");
                         var objclass = e.getTarget().getUserData("objClass");
                         spsidgui.SelectObject.openInstance(
                             widget, objclass, this);
                     },
                     this);
                 valComposite.add(refChangeButton);
                 editZone.add(valComposite, {row: nRow, column: 1});
             }
             else {
                 editZone.add(valWidget, {row: nRow, column: 1});
             }
         },

         _fieldValueChanged : function(val, widget) {
             var attr_name = widget.getUserData("attrName");
             if( val != widget.getUserData("origValue") ) {
                 this.editedAttributes[attr_name] = val;
                 widget.setBackgroundColor("#f0e68c");
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
                 widget.resetBackgroundColor();
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

                 var okHandler = function() {
                     var dw = spsidgui.EditObject._addAttrDialogWindow;
                     var w = dw.getUserData("editorWindow");
                     w._addAttribute(
                         dw.getUserData("nameField").getValue(), "");
                     w.setStatus("Attribute added");
                     dw.close();
                 };
                 
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

                 nameField.addListener(
                     "keydown",
                     function(e)
                     {
                         if (e.getKeyIdentifier() == "Enter") {
                             okHandler();
                         }
                     });
                 
                 grid.add(nameField, {row:0, column:1});
                 
                 dw.add(grid);
                 
                 var buttonsRow = spsidgui.Application.buttonRow();
                 
                 var okButton = new qx.ui.form.Button("OK");
                 okButton.setEnabled(false);
                 dw.setUserData("okButton", okButton);
                 okButton.addListener(
                     "execute",
                     function() { okHandler() });
                 buttonsRow.add(okButton);
                                  
                 var cancelButton = new qx.ui.form.Button("Cancel");
                 cancelButton.addListener(
                     "execute",
                     function() {
                         var dw = spsidgui.EditObject._addAttrDialogWindow;
                         dw.close();
                     });
                 buttonsRow.add(cancelButton);
                 
                 dw.add(buttonsRow);
             }

             var dw = spsidgui.EditObject._addAttrDialogWindow;
             dw.setUserData("editorWindow", this);
             var nameField = dw.getUserData("nameField");
             nameField.setValue("");
             dw.positionAndOpen(this, 400, 50);
             nameField.focus();
         },


         _collectEditedAttributes : function (deletedAsNull) {

             var attr = {};
             if( this.isNewObject() ) {
                 var sel = this.newObjClassSelectBox.getSelection();
                 attr['spsid.object.class'] = sel.getItem(0);
                 attr['spsid.object.container'] = this.getContainerID();
                 var origAttributes = this.origAttributes;
                 for(var attr_name in origAttributes) {
                     attr[attr_name] = origAttributes[attr_name];
                 }
             }
             else {
                 var objID = this.getObjectID();
                 var obj = spsidgui.SpsidObject.getInstance(objID);
                 var attrCache = obj.getAttrCache();
                 for(var attr_name in attrCache) {
                     attr[attr_name] = attrCache[attr_name];
                 }
             }

             for(var attr_name in this.editedAttributes) {
                 
                 if( this.editedAttributes[attr_name] === "" &&
                     attr[attr_name] != undefined) {

                     if( deletedAsNull ) {
                         attr[attr_name] = null;
                     }
                     else {
                         delete attr[attr_name];
                     }
                 }
                 else {
                     attr[attr_name] = this.editedAttributes[attr_name];
                 }
             }

             return(attr);
         },
             

         _onSave : function() {
             var attr = this._collectEditedAttributes(false);
             var rpc = spsidgui.SpsidRPC.getInstance();
             rpc.validate_object(
                 function(myself, result) {
                     myself._onValidateObject(result);
                 },
                 this,
                 attr);
         },

         _onValidateObject : function(result) {
             if( result.status ) {
                 this._saveObject();
             }
             else {
                 if( spsidgui.EditObject._validationErrorDialogWindow ==
                     undefined ) {
                     var dw = new spsidgui.DialogWindow(
                         'Object validation error');
                     spsidgui.EditObject._validationErrorDialogWindow = dw;

                     var msgLabel = new qx.ui.basic.Label();
                     msgLabel.set({rich : true,
                                   selectable : true});
                     dw.setUserData("msgLabel", msgLabel);
                     dw.add(msgLabel, {flex: 1});

                     var buttonsRow = spsidgui.Application.buttonRow();
                     var okButton = new qx.ui.form.Button("OK");
                     okButton.addListener(
                         "execute",
                         function() { this.close() },
                         dw);
                     buttonsRow.add(okButton);
                     
                     dw.add(buttonsRow);
                 }

                 var dw = spsidgui.EditObject._validationErrorDialogWindow;
                 var msgLabel = dw.getUserData("msgLabel");
                 msgLabel.setValue(result.error);
                 
                 dw.positionAndOpen(this, 400, 50);
             }
         },

         _saveObject : function() {
             
             if( this.isNewObject() ) {
                 var attr = this._collectEditedAttributes(false);
                 
                 var rpc = spsidgui.SpsidRPC.getInstance();
                 rpc.create_object(
                     function(myself, id) {
                         console.log("Object created: " + id);
                         if( myself.notifyRefresh ) {
                             myself.notifyRefresh.refresh();
                         }                             
                         myself.close();
                     },
                     this,
                     attr['spsid.object.class'], attr);
             }
             else {
                 var attr = this._collectEditedAttributes(true);
                 delete attr['spsid.object.id'];
                 delete attr['spsid.object.class'];
                 
                 var rpc = spsidgui.SpsidRPC.getInstance();
                 rpc.modify_object(
                     function(myself) {
                         var objID = myself.getObjectID();
                         var obj = spsidgui.SpsidObject.getInstance(objID);
                         console.log("Object modified: " + objID);
                         obj.refresh();
                         if( myself.notifyRefresh ) {
                             myself.notifyRefresh.refresh();
                         }                             
                         myself.close();
                     },
                     this,
                     this.getObjectID(), attr);
             }
         },
         
         _onDeleteObject : function() {
         }
     }
 });

