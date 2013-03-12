/*
*/

qx.Class.define
("spsidgui.Application",
 {
     extend : qx.application.Standalone,
     
     members :
     {
         main : function()
         {
             this.base(arguments);
             if (qx.core.Environment.get("qx.debug"))
             {
                 qx.log.appender.Native;
                 qx.log.appender.Console;
             }

             var root = this.getRoot();
             this.addMenuBar(root);

         },

         // Top-level toolbar         
         addMenuBar : function(appwindow)
         {
             var frame = new qx.ui.container.Composite(new qx.ui.layout.Grow);
             frame.setDecorator("main");
             
             var reportsMenu = new qx.ui.menu.Menu;
             
             
             var reportsMenuButton =
                 new qx.ui.toolbar.MenuButton("Reports");
             reportsMenuButton.setMenu(reportsMenu);
             
             var menuPart = new qx.ui.toolbar.Part;
             menuPart.add(reportsMenuButton);


             var helpPart = new qx.ui.toolbar.Part;
             helpPart.add(new qx.ui.toolbar.Button("Help"));

             var toolbar = new qx.ui.toolbar.ToolBar;
             toolbar.setWidth(400);
             frame.add(toolbar);

             toolbar.add(menuPart);
             toolbar.addSpacer();
             toolbar.add(helpPart);

             appwindow.add(frame);
         }
     }
 });

