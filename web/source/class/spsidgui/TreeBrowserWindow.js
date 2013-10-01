qx.Class.define
("spsidgui.TreeBrowserWindow",
 {
     extend : spsidgui.AppWindow,

     construct : function(objID) {
         this.initObjectID(objID);
         this.base(arguments);
         
         this.addListener('close', function(e) {
             var objID = this.getObjectID();
             delete spsidgui.TreeBrowserWindow._instances[objID];
             if( this.tree ) {
                 this.tree.destroy();
             }             
             this.tree = null;
             
             if( this.objDisp ) {
                 this.objDisp.destroy();
             }
             this.objDisp = null;
             
             this.destroy();
         }, this);
     },
     
     destruct : function()
     {
         var objID = this.getObjectID();
         var obj = spsidgui.SpsidObject.getInstance(objID);
         if( obj != undefined ) {
             obj.removeListener("loaded", this._onObjectLoaded, this);
         }
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
             if( ! spsidgui.TreeBrowserWindow._instances[objID] ) {
                 var w = new spsidgui.TreeBrowserWindow(objID);
                 spsidgui.TreeBrowserWindow._instances[objID] = w;
             }
             else {
                 spsidgui.TreeBrowserWindow._instances[objID].open();
             }
             return(spsidgui.TreeBrowserWindow._instances[objID]);
         }
     },

     members :
     {
         tree : null,
         objDispContainer : null,
         objDisp : null,
         selectedObjID : null,

         editButton : null,
         addButton : null,

         initWindow : function() {
             this.setShowStatusbar(false);
             this.setWidth(1000);
             this.setHeight(600);
         },
         
         initContent : function() {

             var objID = this.getObjectID();
             var obj = spsidgui.SpsidObject.getInstance(objID);
             
             if( obj.getReady() ) {
                 this._initCaption(obj);
             }
             
             obj.addListener("loaded", this._onObjectLoaded, this);

             var splitpane = new qx.ui.splitpane.Pane("horizontal");
             
             var tree = this.tree = new qx.ui.treevirtual.TreeVirtual(
                 [
                     "Object",
                     "Description"
                 ]);
             
             tree.set({width  : 600,
                       minWidth : 200});
             splitpane.add(tree, 1);

             var rightside = new qx.ui.container.Composite(
                     new qx.ui.layout.VBox(4));
             rightside.setDecorator("spsid-inset");
             
             var buttonsRow = spsidgui.Application.buttonRow();

             
             var editButton = this.editButton = new qx.ui.form.Button("Edit");
             editButton.setEnabled(false);
             editButton.setUserData("tree", this);
             editButton.addListener(
                 "execute",
                 function(e) {
                     var oid = e.getTarget().getUserData("tree").selectedObjID;
                     spsidgui.EditObject.openEditInstance(oid);
                 });
             editButton.setToolTip(new qx.ui.tooltip.ToolTip(
                 "Edit this object"));
             buttonsRow.add(editButton);

             
             var addButton = this.addButton = new qx.ui.form.Button("Add");
             addButton.setEnabled(false);
             addButton.setUserData("tree", this);
             addButton.setUserData("notifyRefresh", this);
             addButton.addListener(
                 "execute",
                 function(e) {
                     var oid = e.getTarget().getUserData("tree").selectedObjID;
                     var notify = e.getTarget().getUserData("notifyRefresh");
                     spsidgui.EditObject.openNewObjInstance(oid, notify);
                 });
             addButton.setToolTip(new qx.ui.tooltip.ToolTip(
                 "Add a new contained object"));
             buttonsRow.add(addButton);
             
             
             rightside.add(buttonsRow);

             
             this.objDispContainer =
                 new qx.ui.container.Composite(
                     new qx.ui.layout.Grow());             
             this.objDispContainer.set({width  : 300,
                                        minWidth : 250});

             rightside.add(this.objDispContainer);
             
             splitpane.add(rightside, 1);             
             this.add(splitpane);
             
             tree.addListener(
                 "changeSelection",
                 function(e)
                 {
                     var node = e.getData()[0];
                     var objID = node.data.application;
                     this.selectedObjID = objID;
                     
                     var disp = new spsidgui.DisplayObject(objID);
                     this.objDisp = disp;
                     var removed = this.objDispContainer.removeAll();
                     for(var i=0; i<removed.length; i++) {
                         removed[i].dispose();
                     }
                     
                     this.objDispContainer.add(disp);
                     disp.buildContent();
                     
                     this.updateButtons();
                 },
                 this);
             
             
             this.refresh();
         },

         
         _addObjectToTree : function(dataModel, parentTE, obj) {
             var schema = obj.getSchema();

             var label = obj.getObjectName();
             var descr = obj.getObjectDescr();
             var newTE;
             
             if( schema.mayHaveChildren() )
             {
                 newTE = dataModel.addBranch(parentTE, label, true);
             }
             else
             {
                 newTE = dataModel.addLeaf(parentTE, label);
             }
             dataModel.setColumnData(newTE, 1, descr);

             var node = dataModel.getData()[newTE];             
             node.data = {application: obj.getObjectID()};
             
             return(newTE);
         },

         
         _addChildrenToTree : function(dataModel, parentTE, obj) {
             
             var te = this._addObjectToTree(dataModel, parentTE, obj);

             var rpc = spsidgui.SpsidRPC.getInstance();
             
             rpc.contained_classes(
                 function(myself, result) {
                     for(var i=0; i<result.length; i++) {
                         var klass = result[i];
                         var schema = spsidgui.Schema.getInstance(klass);
                         if( schema.hasDisplay() )
                         {
                             rpc.search_objects(
                                 function(x, xresult) {
                                     for(var j=0; j<xresult.length; j++)
                                     {
                                         var o =
                                             spsidgui.SpsidObject.getInstance(
                                                 xresult[j]['spsid.object.id'],
                                                 xresult[j]);
                                         x[0]._addChildrenToTree(
                                             x[1], x[2], o);
                                     }
                                 },
                                 [myself, dataModel, te],
                                 obj.getObjectID(),
                                 klass);
                         }
                     }
                 },
                 this,
                 obj.getObjectID());
             dataModel.setData();
         },

         
         refresh : function() {
             var dataModel = this.tree.getDataModel();
             dataModel.clearData();
             
             var objID = this.getObjectID();
             var obj = spsidgui.SpsidObject.getInstance(objID);
             this._addChildrenToTree(dataModel, null, obj);
                                     
             dataModel.setData();
             this.selectedObjID = null;             
             this.updateButtons();
         },
                  
         _onObjectLoaded : function (e) {
             this._initCaption(e.getTarget());
             this.refresh();
         },
         
         _initCaption: function(obj) {
             var schema = obj.getSchema();
             var caption = "Tree view of " +
                 schema.instanceDescription() + ": " +
                 obj.getObjectName();
             
             var descr = obj.getObjectDescr();
             if( descr.length > 0 ) {
                 caption += (' -- ' + descr);
             }
             
             this.setCaption(caption);
         },

         
         updateButtons : function() {
             
             var buttons = {
                 editButton : false,
                 addButton : false
             };

             var objID = this.selectedObjID;
             if( objID != undefined ) {
                 
                 var obj = spsidgui.SpsidObject.getInstance(objID);

                 if( obj.getReady() ) {                 
                     if( obj.canAddChildren() ) {
                         buttons.addButton = true;
                     }
                     
                     if( obj.isEditable() ) {
                         buttons.editButton = true;
                     }
                 }
             }

             for(var b in buttons) {
                 if( this[b] != undefined ) {
                     this[b].setEnabled(buttons[b]);
                 }
             }
         }
     }
 });
