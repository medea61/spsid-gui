qx.Class.define
("spsidgui.ObjectList",
 {
     extend : qx.ui.container.Composite, 
     
     construct : function(opts) {
         this.base(arguments);

         if( opts != undefined && opts["treeView"] ) {
             this.setTreeView(true);
         }
         
         this.setLayout(new qx.ui.layout.Grow());

         var splitpane = new qx.ui.splitpane.Pane("horizontal");

         var tree = this.tree = new qx.ui.treevirtual.TreeVirtual(
             [
                 "Object",
                 "Description"
             ]);
         
         tree.set({width  : 600, minWidth : 200});
         if( !this.isTreeView() ) {
             tree.setStatusBarVisible(false);
         }
                  	
         splitpane.add(tree, 0);                  
         
         var rightside = new qx.ui.container.Composite(
             new qx.ui.layout.VBox(4));
         rightside.setDecorator("spsid-inset");
         
         var buttonsRow = spsidgui.Application.buttonRow();

         var popupButton = this.popupButton =  new qx.ui.form.Button("Popup");
         popupButton.setEnabled(false);
         popupButton.setUserData("objlist", this);
         popupButton.addListener(
             "execute", function(e) {
                 var oid = e.getTarget().getUserData("objlist").selectedObjID;
                 spsidgui.ObjectWindow.openInstance(oid);
             });
         buttonsRow.add(popupButton);

         var treeButton = this.treeButton = new qx.ui.form.Button("Tree");
         treeButton.setEnabled(false);
         treeButton.setUserData("objlist", this);
         treeButton.addListener(
             "execute",
             function(e) {
                 var oid = e.getTarget().getUserData("objlist").selectedObjID;
                 var obj = spsidgui.SpsidObject.getInstance(oid);
                 spsidgui.TreeBrowserWindow.openInstance(obj);
             });
         buttonsRow.add(treeButton);

         var editButton = this.editButton = new qx.ui.form.Button("Edit");
         editButton.setEnabled(false);
         editButton.setUserData("objlist", this);
         editButton.addListener(
             "execute",
             function(e) {
                 var oid = e.getTarget().getUserData("objlist").selectedObjID;
                 spsidgui.EditObject.openEditInstance(oid);
             });
         editButton.setToolTip(new qx.ui.tooltip.ToolTip("Edit this object"));
         buttonsRow.add(editButton);

         if( this.isTreeView() ) {
             var addButton = this.addButton = new qx.ui.form.Button("Add");
             addButton.setEnabled(false);
             addButton.setUserData("objlist", this);
             addButton.setUserData("notifyRefresh", this);
             addButton.addListener(
                 "execute",
                 function(e) {
                     var oid =
                         e.getTarget().getUserData("objlist").selectedObjID;
                     var notify = e.getTarget().getUserData("notifyRefresh");
                     spsidgui.EditObject.openNewObjInstance(oid, notify);
                 });
             addButton.setToolTip(new qx.ui.tooltip.ToolTip(
                 "Add a new contained object"));
             buttonsRow.add(addButton);
         }

         var refreshButton = new qx.ui.form.Button("Refresh");
         refreshButton.setUserData("objlist", this);
         refreshButton.addListener(
             "execute", function(e) {
                 var objlist = e.getTarget().getUserData("objlist");
                 objlist.refresh();
             });
         buttonsRow.add(refreshButton);
         
         rightside.add(buttonsRow);
         
             
         this.objDispContainer =
             new qx.ui.container.Composite(new qx.ui.layout.Grow());
         this.objDispContainer.set({width  : 300, minWidth : 250});
         rightside.add(this.objDispContainer);
             
         splitpane.add(rightside, 1);             
         this.add(splitpane);

         tree.addListener(
             "changeSelection",
             function(e)
             {
                 var removed = this.objDispContainer.removeAll();
                 for(var i=0; i<removed.length; i++) {
                     removed[i].dispose();
                 }
                 
                 var node = e.getData()[0];
                 if( ! node ) {
                     this.selectedObjID = null;
                     return;
                 }
                 
                 var objID = node.data.application.objID;
                 this.selectedObjID = objID;
                     
                 var disp = new spsidgui.DisplayObject(objID);
                 this.objDisp = disp;
                 
                 this.objDispContainer.add(disp);
                 disp.buildContent();
                     
                 this.updateButtons();
                 
                 // update the global selection information
                 spsidgui.Application.currObjSelection[
                     this.toHashCode()] = node.data.application;
             },
             this);
         
     },

     properties : {
         treeView : {
             check : "Boolean",
             init : false
         },
         objectList :  {
             check : "Array",
             nullable : true
         },
         objectID :  {
             check: "String",
             nullable : true
         }
     },
     
     members :
     {
         tree : null,
         objDispContainer : null,
         objDisp : null,
         selectedObjID : null,
         
         popupButton : null,
         treeButton : null,
         editButton : null,
         addButton : null,

         setAttrList : function (list) {
             qx.core.Assert.assert(
                 !this.isTreeView(),
                 "setAttrList() is called, but this ObjectList is a tree view"
             );
                 
             var objList = new Array();
             
             for (var i=0; i < list.length; i++) {
                 var attr = list[i];
                 var obj = spsidgui.SpsidObject.getInstance(
                     attr['spsid.object.id'], attr);
                 objList.push(obj);
             }
             
             this.setObjectList(objList);
             this.refresh();
         },

         setTopObjectID : function (objID) {
             qx.core.Assert.assert(
                 this.isTreeView(),
                 "setTopObjectID() is called, but this ObjectList is not " +
                     "a tree view");
             this.setObjectID(objID);
             this.refresh();
         },

         _addObjectToTree : function(dataModel, parentTE, obj) {
             var schema = obj.getSchema();
             
             var label = obj.getObjectName();
             var descr = obj.getObjectDescr();
             var klass = obj.getObjClass();
             var objID = obj.getObjectID();
             var newTE;
             
             if( this.isTreeView() && schema.mayHaveChildren() )
             {
                 newTE = dataModel.addBranch(parentTE, label, true);
             }
             else
             {
                 newTE = dataModel.addLeaf(parentTE, label);
             }
             dataModel.setColumnData(newTE, 1, descr);

             var node = dataModel.getData()[newTE];             
             node.data = {"application": {"objID" : objID, "objclass": klass}};
                      
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

             if( this.isTreeView() ) {
                 var objID = this.getObjectID();
                 var obj = spsidgui.SpsidObject.getInstance(objID);
                 this._addChildrenToTree(dataModel, null, obj);
             }
             else {
                 var list = this.getObjectList();
                 for(var i=0; i<list.length; i++)
                 {
                     this._addObjectToTree(dataModel, null, list[i]);
                 }
                 dataModel.setData();
             }
             
             this.tree.resetSelection();
             this.updateButtons();
         },

         
         updateButtons : function() {
             
             var buttons = {
                 popupButton : false,
                 treeButton : false,
                 editButton : false,
                 addButton : false
             };

             var objID = this.selectedObjID;
             if( objID ) {
                 
                 var obj = spsidgui.SpsidObject.getInstance(objID);
                 var schema = obj.getSchema();

                 if( obj.getReady() ) {
                     buttons.popupButton = true;
                     
                     if( schema.canUseTreeBrowser() )
                     {
                         buttons.treeButton = true;
                     }
                     
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
 }
);




