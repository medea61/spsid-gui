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
         var objID = this.getObjectID();
         if( objID != undefined ) {
             var obj = spsidgui.SpsidObject.getInstance(objID);
             if( obj != undefined ) {
                 obj.removeListener("loaded", this._onObjectLoaded, this);
                 obj.removeListener("deleted", this._onObjectDeleted, this);
             }
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
                     var obj = spsidgui.SpsidObject.getInstance(objID);
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
             w._requestClassAndTemplateKeys();
             return(w);
         },

         _addAttrDialogWindow : null,
         _deleteConfirmDialogWindow : null
     },

     members :
     {
         editZone : null,
         
         // for new objects: class and template keys
         newObjClass : null,
         newObjTempltateKeys : null,
         
         origAttributes : null,
         editedAttributes : null,
         addedAttributes : null,
         modified : false,
         invalidAttributes : null,
         
         saveButton : null,
         deleteButton : null,
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
                          
             var editLayout =  new qx.ui.layout.Grid(4, 4);
             editLayout.setColumnMinWidth(0, 180);
             editLayout.setColumnFlex(0, 0);
             editLayout.setColumnFlex(1, 1);
             var editZone = new qx.ui.container.Composite(editLayout);
             this.editZone = editZone;
             box.add(editZone, {flex: 1});

             this.editedAttributes = {};
             this.invalidAttributes = {};
             this.addedAttributes = {};
             this.templtateKeyAttributes = {};
             
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
                     "Delete this object"));
                 buttonsRow.add(deleteButton);
                 this.deleteButton = deleteButton;
             }
                 
             box.add(buttonsRow);             
             this.add(box);
             
             if( ! this.isNewObject() ) {
                 var objID = this.getObjectID();
                 var obj = spsidgui.SpsidObject.getInstance(objID);
                                  
                 obj.addListener("loaded", this._onObjectLoaded, this);
                 obj.addListener("deleted", this._onObjectDeleted, this);
                 
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
             this.templtateKeyAttributes = {};
             this.saveButton.setEnabled(false);
         },

         _requestClassAndTemplateKeys : function () {
             var containerID = this.getContainerID();
             var cntr = spsidgui.SpsidObject.getInstance(containerID);
             var containerClass = cntr.getAttr('spsid.object.class');
             spsidgui.NewObjTypeDW.openInstance(containerClass, this);
         },

         setNewObjType : function(objclass, templatekeys) {
             this.newObjClass = objclass;
             this.newObjTempltateKeys = templatekeys;
             this._clearEditZone();

             var rpc = spsidgui.SpsidRPC.getInstance();
             rpc.new_object_default_attrs(
                 function(myself, result) {
                     myself.origAttributes = result;
                     myself._populateEditZone();
                     myself._updateCaption();
                     myself.open();
                     myself.setStatus(
                         "Enter the attribute values for a new object");
                     
                 },
                 this,
                 this.getContainerID(),
                 objclass,
                 templatekeys);
         },
                  
         _populateEditZone : function() {

             var editZone = this.editZone;
             var origAttributes = {};
             
             if( this.isNewObject() ) {
                 var objclass = this.newObjClass;
                 var templatekeys = this.newObjTempltateKeys;

                 origAttributes = this.origAttributes;                 
                 
                 var schema = spsidgui.Schema.getInstance(objclass);
                 var attrnames = schema.getAttributeNames();
                 for(var i=0; i<attrnames.length; i++) {
                     var attr_name = attrnames[i];

                     if( origAttributes[attr_name] == undefined
                         &&
                         (! schema.isAttrTemplateMember(attr_name) ||
                          schema.isAttrActiveTemplateMember(
                              attr_name, templatekeys)
                         )
                         &&
                         ! schema.isAttrInsignificant(attr_name)
                         &&
                         ! schema.isAttrHidden(attr_name)
                         &&
                         ! schema.isAttrCalculated(attr_name) )
                     {
                         origAttributes[attr_name] = "";
                     }
                 }
             }
             else
             {
                 var objID = this.getObjectID();
                 var obj = spsidgui.SpsidObject.getInstance(objID);
                 var attrnames = obj.getAttrListForDisplay();
                 for( var i=0; i<attrnames.length; i++) {
                     var attr_name = attrnames[i];
                     origAttributes[attr_name] = obj.getAttr(attr_name);
                 }

                 // enable the Delete button only if there are
                 // no contained objects
                 if( this.deleteButton != undefined ) {
                     var rpc = spsidgui.SpsidRPC.getInstance();
                     rpc.contained_classes(
                         function(button, result) {
                             button.setEnabled(result.length == 0);
                         },
                         this.deleteButton,
                         objID);
                 }
             }

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

             var objclass = this.origAttributes['spsid.object.class'];
             var schema = spsidgui.Schema.getInstance(objclass);

             if( this.isNewObject() && schema.isAttrProtected(attr_name) ) {
                 return;
             }
                                  
             var editZone = this.editZone;
             var nRow = editZone.getLayout().getRowCount();
             
             var attrLabel = new qx.ui.basic.Label(attr_name);
             attrLabel.setPaddingRight(10);
             if( schema.isAttrHilite(attr_name) ) {
                 attrLabel.set({font: "bold"});
             }

             var ttText = "";
             if( schema.isAttrMandatory(attr_name) ) {
                 ttText += "[mandatory] ";
             }

             var descr = schema.attrDescr(attr_name);
             if( descr != undefined ) {
                 ttText += descr;
             }

             if( ttText != "" ) {
                 var tt = new qx.ui.tooltip.ToolTip(ttText);
                 attrLabel.setToolTip(tt);
             }
                 
             editZone.add(attrLabel, {row: nRow, column: 0});
             
             var valWidget;
             var is_checkbox = false;
             var is_selectbox = false;
             var is_objref = false;
             var is_textfield = false;
             
             if( schema.isAttrObjref(attr_name) ) {
                 if( val == "" ) {
                     val = 'NIL';
                 }
                 valWidget = new spsidgui.ObjectRefWidget();
                 valWidget.setObjectID(val);
                 is_objref = true;
                 
                 valWidget.addListener(
                     "changeObjectID",
                     function(e)
                     {
                         var field = e.getTarget();
                         this._fieldValueChanged(e.getData(), field);
                     },
                     this);
             }
             else if( schema.isAttrProtected(attr_name) ||
                      schema.isAttrTemplateKey(attr_name) ) {
                 valWidget = new qx.ui.basic.Label(val);
             }
             else if( schema.isAttrBoolean(attr_name) ) {
                 val = (val == 0 ? "0":"1");
                 valWidget = new qx.ui.form.CheckBox();
                 valWidget.setValue(val === "1" ? true:false);
                 is_checkbox = true;
                 
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
             else if( schema.isAttrDictionary(attr_name) ) {
                 var model = new qx.data.Array();
                 model.append(schema.getAttrDictionary(attr_name));
                 valWidget = new qx.ui.form.VirtualSelectBox(model);
                 valWidget.getSelection().push(val);
                 valWidget.setUserData("isSelectBox", true);
                 is_selectbox = true;

                 valWidget.getSelection().addListener(
                     "change",
                     function(e)
                     {
                         this._fieldValueChanged(
                             valWidget.getSelection().getItem(0),
                             valWidget);
                     },
                     this);
             }
             else {
                 valWidget = new qx.ui.form.TextField(val);
                 is_textfield = true;
                 valWidget.setLiveUpdate(true);
                 if( schema.isAttrMandatory(attr_name) ) {
                     valWidget.setUserData("mandatory", true);
                 }

                 var re = schema.getAttrRegexp(attr_name);
                 if( re != undefined ) {
                     valWidget.setUserData("regexp", re);
                 }
                 
                 valWidget.addListener(
                     "changeValue",
                     function(e)
                     {
                         var field = e.getTarget();
                         var val = e.getData();
                         var attr_name = field.getUserData("attrName");
                         var invalid = false;
                         if( val == "" && field.getUserData("mandatory") ) {
                             var msg =
                                 "Must provide a value for " +
                                 "mandatory attribute";
                             field.setInvalidMessage(msg);
                             field.setValid(false);
                             this.invalidAttributes[attr_name] = true;
                             this.setStatus(msg);
                             invalid = true;
                         }
                         else {
                             var re = field.getUserData("regexp");
                             if( val != "" && re != undefined ) {
                                 re = new RegExp(re);
                                 if( ! re.test(val) ) {
                                     var msg =
                                         "Must match the regular expression: " +
                                         re;
                                     field.setInvalidMessage(msg);
                                     field.setValid(false);
                                     this.invalidAttributes[attr_name] = true;
                                     this.setStatus(msg);
                                     invalid = true;
                                 }
                             }
                         }

                         if( ! invalid ) {
                             field.setValid(true);
                             this.invalidAttributes[attr_name] = false;
                             this.setStatus("");
                         }
                         
                         this._fieldValueChanged(val, field);
                     },
                     this);
             }
                 
             valWidget.setUserData("origValue", val);
             valWidget.setUserData("attrName", attr_name);

             if( is_textfield ) {
                 valWidget.fireNonBubblingEvent(
                     "changeValue", qx.event.type.Data, [val, val]);
             }
             
             if( is_objref ) {
                 var valComposite = new qx.ui.container.Composite(
                     new qx.ui.layout.HBox(8));
                 valComposite.add(valWidget);

                 if( ! schema.isAttrProtected(attr_name) ) {
                     var refChangeButton = new qx.ui.form.Button("select");
                     refChangeButton.setUserData("valWidget", valWidget);
                     refChangeButton.setUserData(
                         "objClass", schema.getAttrObjref(attr_name));
                     refChangeButton.addListener(
                         "execute", function(e) {
                             var widget =
                                 e.getTarget().getUserData("valWidget");
                             var objclass =
                                 e.getTarget().getUserData("objClass");
                             spsidgui.SelectObjectDW.openInstance(
                                 widget, objclass, this);
                         },
                         this);
                     valComposite.add(refChangeButton);

                     var nilButton = new qx.ui.form.Button("clear");
                     nilButton.setUserData("valWidget", valWidget);
                     nilButton.addListener(
                         "execute", function(e) {
                             var widget =
                                 e.getTarget().getUserData("valWidget");
                             widget.setObjectID("NIL");
                         },
                         this);
                     valComposite.add(nilButton);
                 }
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

                 var yellow = "#f0e68c";
                 if( widget.getUserData("isSelectBox") ) {
                     widget.getChildControl("atom").setBackgroundColor(yellow);
                 }
                 else {
                     widget.setBackgroundColor(yellow);
                 }
                 if( ! this.modified ) {
                     this.modified = true;
                     this._updateCaption();
                 }
             }
             else {
                 if( widget.getUserData("isSelectBox") ) {
                     widget.getChildControl("atom").resetBackgroundColor();
                 }
                 else {
                     widget.resetBackgroundColor();
                 }
                 delete this.editedAttributes[attr_name];
                 if( Object.keys(
                     this.editedAttributes).length == 0 ) {
                     this.modified = false;
                     this._updateCaption();
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
                 
                 str += 'New ' +
                     this.origAttributes['spsid.object.class'] +
                     ' inside ' +
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

                 var inputRow = new qx.ui.container.Composite(
                     new qx.ui.layout.HBox(4));
                 inputRow.set({paddingTop:10, paddingBottom:15});
                 
                 var okHandler = function() {
                     var dw = spsidgui.EditObject._addAttrDialogWindow;
                     if( dw.getUserData("okAllowed") ) {
                         var w = dw.getUserData("editorWindow");
                         var attr_name = dw.getUserData("nameCombo").getValue();
                         w._addAttribute(attr_name, "");
                         w.addedAttributes[attr_name] = true;
                         w.setStatus("Attribute added");
                         dw.close();
                     }
                 };
                 
                 inputRow.add(new qx.ui.basic.Label("Attribute name:"));

                 var nameCombo = new qx.ui.form.VirtualComboBox();
                 
                 var nameField = nameCombo.getChildControl("textfield");
                 nameField.setLiveUpdate(true);
                 dw.setUserData("nameCombo", nameCombo);

                 nameField.addListener(
                     "changeValue",
                     function(e)
                     {
                         var val = e.getData();
                         var re = new RegExp("^[a-z][a-z0-9_.]+$");
                         var w = this.getUserData("editorWindow");
                         if( re.test(val) &&
                             w.origAttributes[val] == undefined &&
                             ! w.addedAttributes[val]) {
                             this.setUserData("okAllowed", true);
                             this.getUserData("okButton").setEnabled(true);
                         }
                         else {
                             this.setUserData("okAllowed", false);
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
                         else if (e.getKeyIdentifier() == "Escape") {
                             var dw = spsidgui.EditObject._addAttrDialogWindow;
                             dw.close();
                         }
                     });
                 
                 inputRow.add(nameCombo, {flex:1});
                 
                 dw.add(inputRow);
                 
                 var buttonsRow = spsidgui.Application.buttonRow();
                 
                 var okButton = new qx.ui.form.Button("Ok");
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
             var nameCombo = dw.getUserData("nameCombo");
             nameCombo.setValue("");

             // populate the combo with attrnames that are not in the object
             var attrs = new qx.type.Array();
             var schema = spsidgui.Schema.getInstance(
                 this.origAttributes['spsid.object.class']);
             var attrnames = schema.getAttributeNames();
             var templatekeys = {};
             for(var i=0; i<attrnames.length; i++) {
                 var attr_name = attrnames[i];
                 if( schema.isAttrTemplateKey(attr_name) ) {
                     templatekeys[attr_name] = this.origAttributes[attr_name];
                 }
             }
             
             for(var i=0; i<attrnames.length; i++) {
                 var attr_name = attrnames[i];
                 
                 if( ! schema.isAttrProtected(attr_name)
                     &&
                     ! schema.isAttrCalculated(attr_name)
                     &&
                     (! schema.isAttrTemplateMember(attr_name) ||
                      schema.isAttrActiveTemplateMember(
                          attr_name, templatekeys) )
                     &&
                     this.origAttributes[attr_name] == undefined
                     &&
                     ! this.addedAttributes[attr_name] )
                 {
                     attrs.push(attr_name);
                 }
             }
             
             var model = nameCombo.getModel();
             model.removeAll();
             model.append(attrs);
             
             dw.positionAndOpen(this, 400, 50);
             nameCombo.focus();
         },


         _collectEditedAttributes : function (deletedAsNull) {

             var attr = {};
             if( this.isNewObject() ) {
                 attr['spsid.object.class'] = this.newObjClass;
                 attr['spsid.object.container'] = this.getContainerID();
                 var origAttributes = this.origAttributes;
                 for(var attr_name in origAttributes) {
                     if( origAttributes[attr_name] !== "" ) {
                         attr[attr_name] = origAttributes[attr_name];
                     }
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
                 spsidgui.DialogWindow.say(
                     'Object validation error', result.error);
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
             if( this.isNewObject() ) {
                 console.log('ERROR: _onDeleteObject() is called for a ' +
                             'new object');
                 return;
             }
             
             var objID = this.getObjectID();
             var rpc = spsidgui.SpsidRPC.getInstance();
             rpc.contained_classes(
                 function(target, result) {
                     if(result.length == 0) {
                         target._askDeleteConfirmation();
                     }
                     else {
                         spsidgui.DialogWindow.say(
                             'Cannot delete the object',
                             'This object cannot be deleted because it ' +
                                 'contains other objects' );
                     }
                 },
                 this,
                 objID);
         },

         _askDeleteConfirmation : function() {
             if( spsidgui.EditObject._deleteConfirmDialogWindow == undefined ) {
                 var dw = new spsidgui.DialogWindow('Please confirm');
                 spsidgui.EditObject._deleteConfirmDialogWindow = dw;

                 var msgLabel = new qx.ui.basic.Label();
                 msgLabel.set({rich : true,
                               selectable : true});
                 dw.setUserData("msgLabel", msgLabel);
                 dw.add(msgLabel, {flex: 1});
                 
                 var buttonsRow = spsidgui.Application.buttonRow();
                 
                 var okButton = new qx.ui.form.Button("Ok");
                 okButton.addListener(
                     "execute",
                     function() {
                         var w = dw.getUserData("editorWindow");
                         this.close();
                         w._deleteObject();
                     },
                     dw);
                 buttonsRow.add(okButton);

                 var cancelButton = new qx.ui.form.Button("Cancel");
                 cancelButton.addListener(
                     "execute",
                     function() {
                         this.close();
                     },
                     dw);
                 buttonsRow.add(cancelButton);

                 dw.add(buttonsRow);
             }

             var dw = spsidgui.EditObject._deleteConfirmDialogWindow;
             dw.setUserData("editorWindow", this);

             var msgLabel = dw.getUserData("msgLabel");
             var objID = this.getObjectID();
             var obj = spsidgui.SpsidObject.getInstance(objID);
             msgLabel.setValue(
                 "The object <b>" + obj.getObjectName() +
                     "</b> will be deleted. Please confirm.");
             dw.positionAndOpen(this, 400, 50);
         },
         
         _deleteObject : function() {
             var objID = this.getObjectID();
             var obj = spsidgui.SpsidObject.getInstance(objID);
             obj.deleteObject();
             console.log("Object deleted: " + objID);
         },

         _onObjectLoaded : function () {
             if( ! this.modified ) {
                 this._clearEditZone();
                 this._populateEditZone();
                 this._updateCaption();
             }
         },

         _onObjectDeleted : function() {
             this.close();
             var objID = this.getObjectID();
             spsidgui.EditObject._edit_instances[objID]
             this.destroy();
         }             
     }
 });

