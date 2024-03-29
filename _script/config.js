var version = "0.0.1";

var Config = {
    mapId: "DGDTZ",
    apiScope: "tza",
    apiScopeDev: "tza_dev",
    templateURL: "_templates/main.html",
    showDisclaimerOnFirstUse: true,
    disclaimerUrl: "_templates/disclaimer.html",
    infoUrl: "_templates/info.html",
    // starting point for map
    mapCoordinates: {
      x: 32.8,
      y: -3.3,
      zoom: 6,
      bounds: [[37.8,0.4],[27.8,-7.1]]
    },
    defaultBaseLayerIndex : 2,
    // if preLoad is defined, this occurs before the map is shown - used to pre-generate datasets etc.
    preLoad : function(){Data.init();},
    // baselayer info
    baselayers:[
        {index: 1, id: "satellite", label: "Satelite <font color='grey'>(Mapbox)</font>", url:"mapbox://styles/ipisresearch/ciw6jsekm003a2jql0w0a7qca"},
        {index: 4, id: "satellite_bing", label: "Satelite <font color='grey'>(Bing)</font>", url:"http://ecn.t0.tiles.virtualearth.net/tiles/h{quadkey}.jpeg?g=6412", attribution: "© 2018 Microsoft Corporation © 2018 Digital Globe © CNES (2018) Distribution Airbus DS © 2018 HERE"},
        {index: 2, id: "streets", label: "Streets <font color='grey'>(Mapbox)</font>", url:"mapbox://styles/ipisresearch/ciw6jpn5s002r2jtb615o6shz"},
        {index: 3, id: "empty", label: "None", url:"mapbox://styles/ipisresearch/cjav3e31blm5w2smunhb32kzm"}
    ],
    // layer info
    layers:{
        visits: {
            id: "mines",
            label: "ASM sites",
            source: function(){return Data.getMines()},
            sourceId: "mines",
            popupOnhover: "name",
            onClick: function(item){
                UI.popup(Data.getMineDetail(item),"minePopup",item.geometry.coordinates,true);
                UI.showDashboard(Data.getMineDetail(item),"mineDashBoard");
            },
            onFilter: function(){
              //Chart.update();
            },
            onLoaded: function(){
              //Chart.update();
            },
            onToggle: function(visible){
              var legend =  document.getElementById("legend");
              visible ? legend.classList.remove("hidden") : legend.classList.add("hidden");
            },
            filterId: 1,
            filters:[
                {id: "minerals", index: 2, label: "Minerals",items: Data.getMinerals,onFilter: Data.updateFilter,filterProperty: "minerals",array:true,maxVisibleItems: 5},
                {id: "type", index: 5, label: "Site Type",items:[
						{label: "Mine Site", value:0},
						{label: "Processing Site", value:1},
                        {label: "Combined Site", value:2}
					],onFilter: Data.updateFilter,filterProperty: "types",array:true},
                {id: "workers", index: 7, label: "Number of workers <br><small>in mining/processing</small>",items:[
                    {label: "< 50", value:0},
                    {label: "50-250", value:1},
                    {label: "250-500", value:2},
                    {label: "> 500", value:3}
                ],onFilter: Data.updateFilter,filterProperty: "workergroup"},
				{id: "services", index: 6, label: "State services visiting",
				items:Data.getServices,onFilter: Data.updateFilter,filterProperty: "services",array:true,maxVisibleItems:6},
                {id: "mercury", index: 3, label: "Use of mercury <br><small>in gold processing</small>",
                items: [
                  {label: "Yes", value:2},
                  {label: "No", value:1},
                  {label: "Not applicable", value:0}
                ],onFilter: Data.updateFilter,filterProperty: "mercury"},
				{id: "cyanide", index: 4, label: "Use of cyanide <br><small>in gold processing</small>",
					items: [
						{label: "Yes", value:2},
						{label: "No", value:1},
						{label: "Not applicable", value:0}
					],onFilter: Data.updateFilter,filterProperty: "cyanide"},
				{id: "wounded", index: 8, label: "Accidents causing injuries <br><small>in the past year</small>",
					items: [
						{label: "Yes", value:1},
						{label: "No", value:0}
					],onFilter: Data.updateFilter,filterProperty: "haswounded"},
				{id: "killed", index: 9, label: "Accidents causing fatalities <br><small>in the past year</small>",
					items: [
						{label: "Yes", value:1},
						{label: "No", value:0}
					],onFilter: Data.updateFilter,filterProperty: "haskilled"}
            ],
            display:{
                type: 'circle',
                visible: true,
                canToggle: true,
                size:{
                  property: 'workergroup',
                  interval: [[0, 3], [1, 3.5], [2, 4.5], [3, 6.5]]
                },
                color: {
                  property: "mineral",
                  data: function(){return Data.getMinerals();}
                },
                belowLayer: 'ref_layer_mines'
            }
        },
        lsm_villages:{
            id: "lsm_villages",
            filterId: 4,
            label: "Communities around selected Industrial Mining sites",
            source: "https://ipis.annexmap.net/api/data/%apiScope%/lsm_villages",
            sourceId: "lsm_villages",
            display:{
                type: 'symbol',
                visible: true,
                canToggle: true,
                size: 4,
                iconImage: "home-11",
                belowLayer: 'ref_layer_tradelines'
            },
            popupOnhover: "village",
            onClick: function(item,lngLat){
                UI.hideDashboard();
                UI.popup(item.properties,"villagePopup",lngLat,true);
                UI.showDashboard(item.properties,"lsmVillageAreaPopup");

                //UI.activateDashboardTab(1, document.getElementById('lsmVillageAreaPopupFirst'));
            }
        },
        lsm_mines:{
            id: "lsm_mines",
            filterId: 4,
            label: "Selected Industrial Mining sites",
            source: "https://ipis.annexmap.net/api/data/%apiScope%/lsm_mines",
            sourceId: "lsm_mines",
            display:{
                type: 'fill',
                fillColor: {
                    property: "commodity",
                    data: [
                        {label: "Gold", value: "Gold" , color: "#DAA520"},
                        {label: "Diamond", value: "Diamond" , color: "#4937A8"},
                        {label: "Copper", value: "Copper" , color: "#D05D07"},
                        {label: "Limestone", value: "Limestone" , color : "#810051"},
                        {label: "Salt", value: "Salt", color: "#20A386"}
                    ]
                },
                fillOpacity: 0.8,
                visible: true,
                canToggle: true,
                belowLayer: 'ref_layer_armedgroupareas'
            },
            popupOnhover: "name",
            onClick: function(item,lngLat){
                UI.hideDashboard();
                UI.popup(item.properties,"lsmMinePopup",lngLat,true);
            }
        },
        geology:{
            id: "geology",
            filterId: 2,
            label: "Geological greenstone belt <br>&ensp;<small>(source: GMIS, 2018)</small>",
            source: "https://ipis.annexmap.net/api/data/%apiScope%/geology",
            sourceId: "geology",
            display:{
                type: 'fill',
                fillColor: "#975B26",
                fillOpacity: 0.4,
                visible: false,
                canToggle: true,
                belowLayer: 'ref_layer_protectedAreas'
            }
            // popupOnhover: "name",
            // onClick: function(item,lngLat){
            //     UI.hideDashboard();
            //     UI.popup(item.properties,"protectedAreaPopup",lngLat,true);
            // }
        },
        protectedAreas:{
            id: "protectedAreas",
            filterId: 3,
            label: "Protected areas<br>&ensp;<small>(source: WRI, 2018)</small>",
            source: "https://ipis.annexmap.net/api/data/%apiScope%/protectedareas",
            sourceId: "protectedAreas",
            display:{
                type: 'fill',
                fillColor: "#7d9a5c",
                fillOpacity: 0.4,
                visible: false,
                canToggle: true,
                belowLayer: 'ref_layer_protectedAreas'
            },
            popupOnhover: "name",
            onClick: function(item,lngLat){
                UI.hideDashboard();
                UI.popup(item.properties,"protectedAreaPopup",lngLat,true);
            }
        }
    }
};

