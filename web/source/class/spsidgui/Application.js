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

             qx.event.GlobalError.setErrorHandler(function(ex) {
                 console.log(ex);
             });

             var root = this.getRoot();
             spsidgui.AppWindow.desktop = root;
             this.addMenuBar(root);

             // retrieve SPSID object schema
             var rpc = spsidgui.SpsidRPC.getInstance();
             rpc.get_schema(function(result) {
                 spsidgui.Application.schema = result;
             });
         },

         // Top-level toolbar         
         addMenuBar : function(appwindow)
         {
             var frame = new qx.ui.container.Composite(new qx.ui.layout.Grow);

             var toolbar = new qx.ui.toolbar.ToolBar();
             toolbar.setSpacing(5);

             var part1 = new qx.ui.toolbar.Part();
                          
             var searchButton =
                 new qx.ui.toolbar.Button("Search");
             searchButton.addListener("execute", function() {
                 new spsidgui.SearchObjects(); });
             part1.add(searchButton);

             toolbar.add(part1);
                          
             frame.add(toolbar);
             appwindow.add(frame);
         }
     },

     statics : {
         schema : {}
     }
 });

