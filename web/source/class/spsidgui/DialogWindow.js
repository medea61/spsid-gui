qx.Class.define
("spsidgui.DialogWindow",
 {
     extend : qx.ui.window.Window,

     construct : function(caption) {             
         this.base(arguments, caption);

         this.setModal(true);
         this.setShowStatusbar(false);
         this.setShowMinimize(false);
         this.setShowClose(false);
         this.setShowMaximize(false);
         this.setUseMoveFrame(true);

         this.setLayout(new qx.ui.layout.VBox(4));
     },

     statics :
     {
         _sayWindow : null,
         
         say : function(title, message) {
             if( spsidgui.DialogWindow._sayWindow == undefined ) {
                 var dw = new spsidgui.DialogWindow();
                 spsidgui.DialogWindow._sayWindow = dw;
                 
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

             var dw = spsidgui.DialogWindow._sayWindow;
             dw.setCaption(title);
             var msgLabel = dw.getUserData("msgLabel");
             msgLabel.setValue(message);
             dw.positionAndOpen(spsidgui.AppWindow.desktop, 400, 80);
         }
     },
     
     members :
     {
         positionAndOpen : function(parent, width, height) {

             var bounds = parent.getBounds();
             var centerX = Math.round(bounds.left + bounds.width/2);
             var centerY = Math.round(bounds.top + bounds.height/2);

             this.setHeight(height);
             this.setWidth(width);
             
             spsidgui.AppWindow.desktop.add(this, {
                 left: Math.round(centerX - width/2),
                 top:  Math.round(centerY - height/2)});
             
             this.open();
         }
     }
 });
