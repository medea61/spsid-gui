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
             if( this.objList ) {
                 this.objList.destroy();
             }             
             this.objList = null;
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
         delete spsidgui.Application.currObjSelection[this.getObjectID()];
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

         // recursively get to the nearest parent which can open a tree browser
         openInstance : function(obj) {
             var schema = obj.getSchema();
             if( schema.isTreeBrowserAllowed() ) {
                 spsidgui.TreeBrowserWindow._openInstance(obj.getObjectID());
                 return;
             }
             
             var cntr = obj.getAttr('spsid.object.container');
             if( cntr != undefined && cntr != 'NIL' ) {
                 var rpc = spsidgui.SpsidRPC.getInstance();

                 rpc.get_object(
                     function(x, attr) {
                         var o = spsidgui.SpsidObject.getInstance(
                             attr['spsid.object.id'], attr);
                         spsidgui.TreeBrowserWindow.openInstance(o);
                     },
                     null,
                     cntr);
             }
         },
         
         
         _openInstance : function(objID) {
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
         objList : null,

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

             this.objList = new spsidgui.ObjectList({treeView: true});
             this.objList.setTopObjectID(objID);
             this.add(this.objList);
         },
         
         refresh : function() {
             if( this.objList ) {
                 this.objList.refresh();
             }
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
         }
     }
 });

