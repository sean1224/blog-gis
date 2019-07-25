<template>
<div id="map"></div>
</template>
<script>
import esriLoader from 'esri-loader'
export default {
    name: 'mapContainer',
    data() {
        return {
            Map: null,
            Graphic: null,
            MapView: null,
            GraphicsLayer: null,
            Sketch: null,
            IdentifyTask: null,
            IdentifyParameters: null,

            Draw: null,
            Point: null,
            Polyline: null,
            Polygon: null,
            Circle: null,

            currentDraw: null,
            currentView: null,
            currentMap: null,
            graphicLayer: null,

            geometry:null
        }
    },
    computed: {
        mapService() {
            return {
                imageryLayer: 'http://43.254.226.73:6080/arcgis/rest/services/WATER/JDSJ1/MapServer',
                findTask: 'http://43.254.226.73:6080/arcgis/rest/services/WATER/JDSJ1/MapServer',
                QueryTask: 'http://43.254.226.73:6080/arcgis/rest/services/WATER/JDSJ1/MapServer/4',
                IdentifyTask: 'http://43.254.226.73:6080/arcgis/rest/services/WATER/JDSJ1/MapServer',
                featureLayer: 'http://43.254.226.73:6080/arcgis/rest/services/WATER/JDSJ1/MapServer/4'
            }
        },
        symbol: function(){
            return {
            point:{
                type: "simple-marker",
                style: "circle",
                color: "#00FFFF",
                size: "15px"
            },
            polyline:{
                type: "simple-line",
                color: "#00FFFF",
                width: 4
            },
            polygon:{
                type: "simple-line",
                color: "#23E3E7",
                width: 3
                } 
            };
        }
    },
    methods: {
        /**
         * 地图初始化
         */
        initMap: function() {
            this.graphicLayer = new this.GraphicsLayer();
            // 初始化地图
            this.currentMap = new this.Map({
                basemap: 'satellite',
                layers: [this.graphicLayer]
            });
            this.currentView = new this.MapView({
                map: this.currentMap,
                container: "map",
                center: [121.25603683642646, 31.328719717068733],
                zoom: 18
            });
            this.currentDraw= new this.Draw({view:this.currentView});
            this.currentView.ui.remove("attribution");
        },
        /**
         * 添加sketch绘制工具
         */
        addDrawSketch: function() {
            const sketch = new this.Sketch({
                layer: this.graphicLayer,
                view: this.currentView
            });
            sketch.on("create", function(event) {
                if (event.state === "complete") {
                    console.log(event.graphic.geometry);

                }
            });
        },
        /**
         * 添加属性值查找控件
         */
        addFindTask: function(FindTask, FindParameters) {
            // 添加属性查询控件
            let element = document.createElement("input");
            element.className = "inputFindTask";
            this.currentView.ui.add(element, "top-right");
            // 创建查找 FindTask FindParameters
            let findTask = new FindTask({
                url: this.mapService.findTask
            });
            let findParameters = new FindParameters({
                // 查询字，默认会模糊查找
                searchText: "J68",
                // 查询的图层列表，对应序号可通过浏览器打开地图服务查看
                layerIds: [4],
                // 查询字段名称
                searchFields: ["NAME"],
                // 如果做高亮显示需要返回geometry，即把要素返回
                returnGeometry: true
            });
            let _this = this;
            // 获取graphic
            let getGraphics = function(results){
                let graphics = [];
                results.forEach(item => {
                    let geometry = item.feature.geometry;
                    let symbol = {
                        type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
                        color: "blue",
                        size: 8,
                    };
                    let attributes = item.feature.attributes;
                    let popupTemplate = {
                        title: "概览",
                        content: [{
                            type: "fields", 
                            fieldInfos: [{
                                fieldName: "名称",
                                label: "名称",
                            }, 
                            {
                                fieldName: "内底标高",
                                label:'内底标高'
                            }]
                        }]
                    };
                    let graphic = _this.createGraphic(geometry,symbol,attributes,popupTemplate);
                    graphics.push(graphic)
                })
                return graphics;
            };
            // 输入框enter事件触发查询，并显示
            element.onkeyup = function(e) {
                if (e.keyCode == 13) {
                    findTask.execute(findParameters)
                        .then(result => {
                            // 解析查询结果，渲染成graphic
                            getGraphics(result.results).forEach(graphic => {
                                _this.currentView.graphics.add(graphic);
                                
                            })
                        })
                        .catch(error => console.log(error.message))
                }
            }
        },
        /**
         * 添加queryTask
         */
        addQueryTask(QueryTask,Query){
            // 添加查询按钮
            let el1 = document.createElement("button");
            el1.innerText = "queryTask属性查询";
            this.currentView.ui.add(el1,"top-right");

            let el2 = document.createElement("button");
            el2.innerText = "queryTask多边形查询";
            this.currentView.ui.add(el2,"top-right");
            let el21 = document.createElement("button");
            el21.innerText = "queryTask多边形绘制";
            this.currentView.ui.add(el21,"top-right");

            let el3 = document.createElement("button");
            el3.innerText = "queryTask数据查询";
            this.currentView.ui.add(el3,"top-right");

            let _this = this;
            // 属性查询
            el1.onclick = function(){
                // 初始化属性查询
                let queryTask = new QueryTask({
			        // 这里选择自定义的rest地图服务
                    url: _this.mapService.QueryTask
                });
                let query = new Query({
                    // 查询条件，测试可使用arcgis属性表中的按属性选择
                    where: "Invert_El >= 1",
                    // 返回要素内部的属性字段字符串数组，全选为["*"]
                    outFields: ["NAME"],
                    // 是否返回要素，可做后续的feature要素操作
                    returnGeometry: true
                });
                queryTask.execute(query)
                .then(result => {
                    result.features.forEach(item => {
                        _this.currentView.graphics.removeAll();
                        _this.currentView.graphics.add(_this.createFeatures(item));
                    })
                })
                .catch(error => console.log(error.message))
            }
            // 多边形绘制
            el21.onclick = function(){
                _this.drawPolygon();
            };
            // 空间查询
            el2.onclick = function(){
                let queryTask = new QueryTask({
                    // 自定义的rest地图服务
                    url: _this.mapService.QueryTask
                });
                let query = new Query({
                    // 绘制的要素
                    geometry:_this.geometry,
                    // 空间包含关系
                    spatialRelationship:"contains",
                    // 是否返回要素，可做后续的feature要素操作
                    returnGeometry:true,
                    // 返回要素内部的属性字段字符串数组，全选为["*"]
                    outFields:["NAME"]
                });

                queryTask.execute(query)
                .then(result => {
                    _this.currentView.graphics.removeAll();
                    result.features.forEach(item => {
                        _this.currentView.graphics.add(_this.createFeatures(item));
                    })
                })
                .catch(error => console.log(error.message))
            }
            // 数据查询
            el3.onclick = function(){
                
            }
        },
        /**
         * 添加IdentifyTask
         */
        addIdentifyTask:function(IdentifyTask,IdentifyParameters){
            let el = document.createElement("button");
            el.innerText = "IdentifyTask空间查询";
            this.currentView.ui.add(el,"top-right");
            let _this = this;
            el.onclick = function(){
                let identifyTask = new IdentifyTask({
                    url:_this.mapService.IdentifyTask
                });
                let identifyParameters = new IdentifyParameters({
                    // 查询要素
                    geometry:_this.geometry,
                    // 容差，单位为像素
                    tolerance:3,
                    // 查询图层id数组
                    layerIds:[1,2,3,4,5,6,7,8,9,10,11],
                    // 定义查询图层，所有图层（"all"）,可视图层("visible"),顶层图层("top")
                    layerOption: "all",
                    width:_this.currentView.width,
                    height:_this.currentView.height,
                    mapExtent:_this.currentView.extent,
                    returnGeometry: true
                });
                identifyTask.execute(identifyParameters)
                .then(result => console.log(result))
                .catch(error => console.log(error.message))
            }
        },
        /**
         * 添加栅格图层
         */
        addMapImageLayer: function(MapImageLayer) {
            let layer = new MapImageLayer({
                url: this.mapService.imageryLayer
            });
            this.currentMap.add(layer); // adds the layer to the map
        },
        /**
         * 添加矢量图层
         */
        addFeatureLayer: function(FeatureLayer) {
            const layer = FeatureLayer({
                url: this.mapService.featureLayer
            })
            this.currentMap.add(layer);
        },
        /**
         * 视图添加监视
         */
        addViewListener: function() {
            this.currentView.on('click', function(data) {
                console.log(data)
            })
        },
        /**
         * 添加绘图
         */
        addDraw:function(Draw,Polygon){
            let draw = Draw({
                view: this.currentView
            });
            let action = draw.create("polygon", {mode: "click"});
            let _this = this;
            action.on("draw-complete", function (evt) {
                const polygon = new Polygon({
                    hasZ: false,
                    hasM: false,
                    rings: evt.vertices,
                    spatialReference: _this.currentView.spatialReference
                });

                var polygonSymbol = {
                    type: "simple-line",  // autocasts as SimpleLineSymbol()
                    color: [226, 119, 40],
                    width: 4
                };
                _this.currentView.graphics.add(_this.createGraphic(polygon,polygonSymbol));
            });
        },
        /**
         * 绘制多边形
         */
        drawPolygon:function(){
            let _this=this;
            // 创建 graphic
            let createGraphic = function(vertices){
                // 创建多边形形状
                var polygon = new _this.Polygon({ 
                    rings: [vertices],
                    spatialReference: _this.currentView.spatialReference 
                }); 
                // 创建绘制线条
                var lineSymbol = {
                    type: "simple-line",
                    color: "#23E3E7",
                    width: 3
                };
                // 创建多边形的graphic
                var polygonGraphic = new _this.Graphic({
                    geometry: polygon,
                    symbol: lineSymbol
                });
                return polygonGraphic;
            }
            this.currentView.graphics.removeAll();
            // 使用绘制工具开始绘制polygon
            const action = this.currentDraw.create("polygon");
            this.currentView.focus();
            // fires when a vertex is added
            action.on("vertex-add", function (evt) {
                _this.currentView.graphics.add(createGraphic(evt.vertices));
            });

            // fires when the pointer moves
            action.on("cursor-update", function (evt) {
                _this.currentView.graphics.removeAll(); 
                _this.currentView.graphics.add(createGraphic(evt.vertices));
            });

            // fires when the drawing is completed
            action.on("draw-complete", function (evt) {
                _this.currentView.graphics.removeAll();
                _this.currentView.graphics.add(createGraphic(evt.vertices));

                _this.geometry = createGraphic(evt.vertices).geometry;
            });

            // fires when a vertex is removed
            action.on("vertex-remove", function (evt) { 
                _this.currentView.graphics.removeAll();
                _this.currentView.graphics.add(createGraphic(evt.vertices));
            });
        },
        /**
         * 创建graphic
         */
        createGraphic:function(geometry,symbol,attribute=null,popupTemplate=null){
            return new this.Graphic({
                geometry: geometry,
                symbol: symbol,
                attributes: attribute,
                popupTemplate: popupTemplate 
            })
        },
        /**
         * 高亮显示查询要素
         */
        createFeatures:function(feature){
            let graphic = null;
            if(feature.geometry.type=="point"){
                var geometry = new this.Point({
                type: "point",
                    longitude: feature.geometry.longitude,
                    latitude: feature.geometry.latitude
                });
                graphic = new this.Graphic({
                    geometry:geometry,
                    symbol:this.symbol.point
                });
            }
            else if(feature.geometry.type=="polyline"){
                var geometry = new this.Polyline({
                paths:feature.geometry.paths,
                spatialReference:this.currentView.spatialReference
                });
                graphic = new this.Graphic({
                geometry:geometry,
                symbol:this.symbol.polyline
                });
            }
            else if(feature.geometry.type=="polygon"){
                var geometry = new this.Polygon({
                rings:feature.geometry.rings,
                spatialReference:this.currentView.spatialReference
                });
                graphic = new this.Graphic({
                geometry:geometry,
                symbol:this.symbol.polygon
                });
            }
            else{
                throw new Error(`错误类型($(feature.geometry.type))`);
            }
            return graphic;
        }
    },
    mounted() {
        const options = {
            url: 'http://43.254.226.73:8080/arcgis_js_api/library/4.11/dojo/dojo.js'
        }
        esriLoader.loadModules([
            'esri/Map',
            "esri/Graphic",
            'esri/views/MapView',
            "esri/layers/GraphicsLayer",
            "esri/layers/MapImageLayer",
            "esri/layers/FeatureLayer",
            "esri/widgets/Sketch",

            "esri/geometry/Point",
            "esri/geometry/Polyline",
            "esri/geometry/Polygon",
            "esri/geometry/Circle",
            "esri/views/draw/Draw",

            "esri/tasks/IdentifyTask",
            "esri/tasks/support/IdentifyParameters",
            "esri/tasks/FindTask",
            "esri/tasks/support/FindParameters",
            "esri/tasks/QueryTask", 
            "esri/tasks/support/Query",
            "esri/tasks/IdentifyTask",
            "esri/tasks/support/IdentifyParameters",
        ], options).then(([Map,Graphic, MapView, GraphicsLayer, MapImageLayer, FeatureLayer, Sketch,
            Point,Polyline,Polygon,Circle,Draw,
            IdentifyTask, IdentifyParameters,
            FindTask, FindParameters,QueryTask,Query
        ]) => {
            this.Map = Map;
            this.Graphic = Graphic;
            this.MapView = MapView;
            this.GraphicsLayer = GraphicsLayer;
            this.Sketch = Sketch;
            this.Draw = Draw;
            this.Point = Point;
            this.Polyline = Polyline;
            this.Polygon = Polygon;
            this.Circle = Circle;
            this.IdentifyTask = IdentifyTask;
            this.IdentifyParameters = IdentifyParameters;
            this.initMap();
            // this.addDrawSketch();
            this.addFindTask(FindTask, FindParameters);
            this.addDraw(Draw,Polygon);
            this.addQueryTask(QueryTask,Query);
            this.addIdentifyTask(IdentifyTask,IdentifyParameters);
            this.addMapImageLayer(MapImageLayer);
            // this.addFeatureLayer(FeatureLayer);
            // this.addViewListener();
        }).catch(error => console.log(error))
    }
}
</script>
<style lang="sass">
#map
  width: 100%
  height: 100vh
.inputFindTask
  border: none
  width: 100px
  height: 25px
  padding-left: 5px
  display: inline-block
</style>
