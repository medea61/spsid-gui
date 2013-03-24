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
                 var w = new spsidgui.ContainedObjWindow(objID);
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
         tView : null,
         tViewPages : {},
         
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
             
             var win = this;
             obj.addListener(
                 "loaded",
                 function(e) { win._initCaption(e.getTarget()) });

             var winVBox = new qx.ui.container.Composite(
                 new qx.ui.layout.VBox(4));

             var myself = this;
             var buttonsRow =
                 new qx.ui.container.Composite(new qx.ui.layout.HBox(4));
             buttonsRow.set({backgroundColor: "#e6e6e6", padding: 4});

             var refreshButton = new qx.ui.form.Button("Refresh");
             refreshButton.setUserData("window", this);             
             buttonsRow.add(refreshButton);
             refreshButton.addListener("execute", function(e) {
                 var w = e.getTarget().getUserData("window");
                 w.refresh();
             });
             winVBox.add(buttonsRow);

             this.tView = new qx.ui.tabview.TabView();
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

                     console.log(myself.getObjectID());
                     console.log(myself.tViewPages);
                     
                     var schema = spsidgui.Application.schema;
                     var klasses = {};
                     for(var i=0; i<result.length; i++) {
                         var klass = result[i];
                         if(schema[klass].display) {
                             klasses[klass] = true;
                             if( ! myself.tViewPages[klass] ) {
                                 myself._addPage(
                                     klass,
                                     schema[klass].display.class_descr);
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
         
         _initCaption: function(obj) {
             this.setCaption("Contents of " +
                             obj.getAttr('spsid.object.class') + " " +
                             obj.getObjectName());
         }
     }
 });

