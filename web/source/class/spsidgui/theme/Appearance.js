qx.Theme.define
("spsidgui.theme.Appearance",
 {
     extend : qx.theme.simple.Appearance,
     
     appearances :
     {
         "button-row" :
         {
             style : function(states)
             {
                 return {
                     decorator : "button-row",
                     padding : 4
                 };
             }
         },
         
         "object-list-item" :
         {
             style : function(states)
             {
                 return {
                     decorator : "object-list-item",
                     margin : [ 0, 3, 4, 4 ]
                 };
             }
         },

         "object-list-item-label" :
         {
             style : function(states)
             {
                 return {
                     decorator : "object-list-item-label",
                     font: "bold",
                     textAlign: "center",
                     minWidth: 200
                 };
             }
         }
         
     }
 });