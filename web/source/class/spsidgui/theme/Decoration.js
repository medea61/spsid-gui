qx.Theme.define
("spsidgui.theme.Decoration",
 {
     extend : qx.theme.simple.Decoration,
     
     decorations :
     {
         "button-row" :
         {
             decorator : qx.ui.decoration.Uniform,
             style :
             {
                 backgroundColor : "#e6e6e6"
             }             
         },
         
         "object-list-item" :
         {
             include : "spsid-inset",
             
             style :
             {
                 backgroundColor : "#f0f0f0"
             }
         },

         "object-list-item-label" :
         {
             decorator : qx.ui.decoration.Uniform             
         },
         
         "spsid-inset" :
         {
             decorator : qx.ui.decoration.Uniform,
             style :
             {
                 width : 1,
                 color : [ "border-light-shadow",
                           "border-light",
                           "border-light",
                           "border-light" ]
             }             
         }         
     }
 });