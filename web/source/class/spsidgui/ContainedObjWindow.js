qx.Class.define
("spsidgui.ContainedObjWindow",
 {
     extend : spsidgui.AppWindow,

     construct : function(objID) {
         this.initObjectID(objID);
         this.base(arguments);
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
             if( this._instances[objID] == undefined ) {
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

             var pages = this.tView.getChildren();
             for(var i=0; i<pages.length; i++) {
                 this.tView.remove(pages[i]);
                 pages[i].destroy();
             }
             
             var myself = this;
             var rpc = spsidgui.SpsidRPC.getInstance();

             rpc.contained_classes(
                 function(result) {
                     if( result.length == 0 ) {
                         return;
                     }
                     
                     var schema = spsidgui.Application.schema;
                     for(var i=0; i<result.length; i++) {
                         var klass = result[i];
                         if(schema[klass].display) {
                             var page = new qx.ui.tabview.Page(
                                 schema[klass].display.class_descr);
                             myself._initPage(page, klass);
                             myself.tView.add(page);
                         }
                     }
                 },
                 objID);
         },

         
         _initPage : function(page, klass) {
             page.setLayout(new qx.ui.layout.Grow());
             var resultsWidget = new spsidgui.ObjectList();
             page.add(resultsWidget);

             var objID = this.getObjectID();
             var rpc = spsidgui.SpsidRPC.getInstance();
             rpc.search_objects(
                 function(result) {
                     resultsWidget.setAttrList(result);
                 },
                 objID, klass);
         },

         
         _initCaption: function(obj) {
             this.setCaption("Contents of " + obj.getObjectName());
         }
     }
 });

