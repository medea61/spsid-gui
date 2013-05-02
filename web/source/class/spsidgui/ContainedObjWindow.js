qx.Class.define
("spsidgui.ContainedObjWindow",
 {
     extend : spsidgui.AppWindow,

     construct : function(objID) {
         this.initObjectID(objID);
         this.base(arguments);
         
         this.addListener('close', function(e) {
             var objID = this.getObjectID();
             delete spsidgui.ContainedObjWindow._instances[objID];
             if( this.tView ) {
                 this.tView.destroy();
             }
             this.tView = null;
             this.tViewPages = {};
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
             if( ! spsidgui.ContainedObjWindow._instances[objID] ) {
                 var w = new spsidgui.ContainedObjWindow(objID);
                 spsidgui.ContainedObjWindow._instances[objID] = w;
             }
             else {
                 spsidgui.ContainedObjWindow._instances[objID].open();
             }
             return(spsidgui.ContainedObjWindow._instances[objID]);
         }
     },

     members :
     {
         tView : null,
         tViewPages : null,
         
         initWindow : function() {
             this.setShowStatusbar(false);
             this.setWidth(800);
             this.setHeight(600);
         },
         
         initContent : function() {

             var objID = this.getObjectID();
             var obj = spsidgui.SpsidObject.getInstance(objID);
             
             if( obj.getReady() ) {
                 this._initCaption(obj);
             }
             
             obj.addListener("loaded", this._onObjectLoaded, this);

             var winVBox = new qx.ui.container.Composite(
                 new qx.ui.layout.VBox(4));

             var buttonsRow = spsidgui.Application.buttonRow();

             var addButton = new qx.ui.form.Button("Add");
             addButton.setUserData("objID", objID);
             addButton.setUserData("notifyRefresh", this);
             addButton.addListener(
                 "execute",
                 function(e) {
                     var oid = e.getTarget().getUserData("objID");
                     var notify = e.getTarget().getUserData("notifyRefresh");
                     spsidgui.EditObject.openNewObjInstance(oid, notify);
                 });
             // check if objects can be actually created within this class
             var containerClass = obj.getAttr('spsid.object.class');
             var found = false;
             spsidgui.Schema.enumerate(
                 function(schema) {
                     if( schema.isContainedIn(containerClass) &&
                         schema.displaySequence() != undefined &&
                         ! schema.displayReadOnly() )
                     {
                         found = true;
                     }
                     return(!found);
                 });             
             addButton.setEnabled(found);             
             addButton.setToolTip(new qx.ui.tooltip.ToolTip(
                 "Add a new contained object"));

             buttonsRow.add(addButton);

             var refreshButton = new qx.ui.form.Button("Refresh");
             refreshButton.setUserData("window", this);             
             buttonsRow.add(refreshButton);
             refreshButton.addListener("execute", function(e) {
                 var w = e.getTarget().getUserData("window");
                 w.refresh();
             });
             winVBox.add(buttonsRow);

             this.tView = new qx.ui.tabview.TabView();
             this.tViewPages = {};
             winVBox.add(this.tView, {flex: 1});
             
             this.add(winVBox);
             this.refresh();
         },

         refresh : function() {
             var objID = this.getObjectID();
             
             var rpc = spsidgui.SpsidRPC.getInstance();

             rpc.contained_classes(
                 function(myself, result) {
                     if( result.length == 0 ) {
                         return;
                     }

                     var klasses = {};
                     for(var i=0; i<result.length; i++) {
                         var klass = result[i];
                         var schema = spsidgui.Schema.getInstance(klass);
                         if( schema.hasDisplay() ) {
                             klasses[klass] = true;
                             if( ! myself.tViewPages[klass] ) {
                                 myself._addPage(
                                     klass,
                                     schema.displayDescr());
                             }
                             else {
                                 myself._refreshPage(klass);
                             }
                         }
                     }

                     for(var klass in myself.tViewPages) {
                         if( ! klasses[klass] ) {
                             myself.tView.remove(myself.tViewPages[klass]);
                             delete myself.tViewPages[klass];
                         }
                     }
                 },
                 this,
                 objID);
         },

         _addPage : function(klass, descr) {
             var page = new qx.ui.tabview.Page(descr);
             page.setLayout(new qx.ui.layout.Grow());
             var resultsWidget = new spsidgui.ObjectList();
             page.add(resultsWidget);
             page.setUserData("resultsWidget", resultsWidget);
             this.tViewPages[klass] = page;
             this.tView.add(page);
             this._refreshPage(klass);
         },
         
         _refreshPage : function(klass) {
             var objID = this.getObjectID();
             var rpc = spsidgui.SpsidRPC.getInstance();
             var page = this.tViewPages[klass];
             var resultsWidget = page.getUserData("resultsWidget");
             if( resultsWidget ) {
                 rpc.search_objects(
                     function(wid, result) {
                         wid.setAttrList(result);
                     },
                     resultsWidget,
                     objID, klass);
             }
         },
         
         _onObjectLoaded : function (e) {
             this._initCaption(e.getTarget());
         },
         
         _initCaption: function(obj) {
             this.setCaption("Contents of " +
                             obj.getAttr('spsid.object.class') + " " +
                             obj.getObjectName());
         }
     }
 });

