qx.Class.define
("spsidgui.BrowseWindow",
 {
     extend : spsidgui.AppWindow,

     construct : function(klass) {
         this.initObjectClass(klass);
         this.base(arguments);
         
         this.addListener('close', function(e) {
             var klass = this.getObjectClass();
             delete spsidgui.BrowseWindow._instances[klass];
             this.destroy();
         }, this);
     },
     

     properties : {
         objectClass  :  {
             check: "String",
             deferredInit : true
         }
     },

     statics :
     {
         _instances : {},
         
         openInstance : function(klass) {
             if( ! spsidgui.BrowseWindow._instances[klass] ) {
                 var w = new spsidgui.BrowseWindow(klass);
                 spsidgui.BrowseWindow._instances[klass] = w;
             }
             else {
                 spsidgui.BrowseWindow._instances[klass].open();
             }
             return(spsidgui.BrowseWindow._instances[klass]);
         }
     },

     members :
     {         
         initWindow : function() {
             this.setShowStatusbar(true);
             this.setWidth(1000);
             this.setHeight(600);
         },
         
         initContent : function() {

             var klass = this.getObjectClass();
             var schema = spsidgui.Schema.getInstance(klass);
             var descr = schema.classDescription();
             this.setCaption("Browse " + descr);

             var resultsWidget = new spsidgui.ObjectList();
             this.add(resultsWidget);

             var statusBar = this;

             var rpc = spsidgui.SpsidRPC.getInstance();
             rpc.search_objects(
                 function(objlist, result) {
                     if( result.length == 0 ) {
                         return;
                     }
                     statusBar.setStatus
                     ("Found " + result.length + " objects");
                     objlist.setAttrList(result);
                 },
                 resultsWidget, null, klass);
         }
     }
 });

