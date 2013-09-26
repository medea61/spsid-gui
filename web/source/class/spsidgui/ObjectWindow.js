qx.Class.define
("spsidgui.ObjectWindow",
 {
     extend : spsidgui.AppWindow,

     construct : function(objID) {
         this.initObjectID(objID);
         this.base(arguments);
         
         this.addListener('close', function(e) {
             var objID = this.getObjectID();
             delete spsidgui.ObjectWindow._instances[objID];
             this.destroy();
         }, this);
     },

     destruct : function()
     {
         var objID = this.getObjectID();
         var obj = spsidgui.SpsidObject.getInstance(objID);
         if( obj != undefined ) {
             obj.removeListener("loaded", this._onObjectLoaded, this);
             obj.removeListener("deleted", this._onObjectDeleted, this);
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
         _logDialogWindow : null,
         _logWidget : null,
         
         openInstance : function(objID) {
             if( ! spsidgui.ObjectWindow._instances[objID] ) {
                 var w = new spsidgui.ObjectWindow(objID);
                 spsidgui.ObjectWindow._instances[objID] = w;
             }
             else {
                 spsidgui.ObjectWindow._instances[objID].open();
             }
             return(spsidgui.ObjectWindow._instances[objID]);
         }
     },

     members :
     {
         initWindow : function() {
             this.setShowStatusbar(false);
             this.setWidth(500);
             this.setHeight(400);
         },
         
         initContent : function() {
             
             var objID = this.getObjectID();
             var box = new qx.ui.container.Composite(new qx.ui.layout.VBox(4));
             var buttonsRow = spsidgui.Application.buttonRow();
             var disp = new spsidgui.DisplayObject(objID);
             disp.addControlButtons(buttonsRow);

             var logButton = new qx.ui.form.Button("Log");
             logButton.addListener(
                 "execute", function(e) {
                     this.openLog();
                 },
                 this);
             buttonsRow.add(logButton);
             
             disp.buildContent();

             var obj = spsidgui.SpsidObject.getInstance(objID);
             if( obj.getReady() ) {
                 this._initCaption(obj);
             }

             obj.addListener("loaded", this._onObjectLoaded, this);
             obj.addListener("deleted", this._onObjectDeleted, this);
             
             box.add(buttonsRow);             
             box.add(disp);

             this.add(box);
         },
         
         _initCaption: function(obj) {
             var schema = obj.getSchema();
             var caption = schema.instanceDescription() + ": " +
                 obj.getObjectName();

             var descr = obj.getObjectDescr();
             if( descr.length > 0 ) {
                 caption += (' -- ' + descr);
             }

             this.setCaption(caption);
         },

         openLog : function() {
             if( spsidgui.ObjectWindow._logDialogWindow == undefined ) {
                 var dw = spsidgui.ObjectWindow._logDialogWindow =
                     new spsidgui.DialogWindow('Object log');
                 spsidgui.ObjectWindow._logWidget =
                     new spsidgui.ObjectLog();
                 dw.add(spsidgui.ObjectWindow._logWidget, {flex: 1});

                 var buttonsRow = spsidgui.Application.buttonRow();
                 
                 var okButton = new qx.ui.form.Button("OK");
                 okButton.addListener(
                     "execute",
                     function() {
                         spsidgui.ObjectWindow._logDialogWindow.close();
                     });
                 buttonsRow.add(okButton);
                                  
                 dw.add(buttonsRow);
             }

             var objID = this.getObjectID();
             spsidgui.ObjectWindow._logWidget.setObjectID(objID);
             spsidgui.ObjectWindow._logDialogWindow.positionAndOpen(
                 this, 400, 400);
         },

         _onObjectLoaded : function (e) {
             this._initCaption(e.getTarget())
         },

         _onObjectDeleted : function() {
             this.close();
             var objID = this.getObjectID();
             delete spsidgui.ObjectWindow._instances[objID];
             this.destroy();
         }
     }
 });

