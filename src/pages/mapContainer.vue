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
            Grahic: null,
            MapView: null,
            GraphicsLayer: null,
            Sketch: null,
            IdentifyTask: null,
            IdentifyParameters: null,

            currentView: null,
            currentMap: null,
            graphicLayer: null
        }
    },
    computed: {
        mapService() {
            return {
                imageryLayer: 'http://43.254.226.73:6080/arcgis/rest/services/WATER/JDSJ1/MapServer',
                findTask: 'http://43.254.226.73:6080/arcgis/rest/services/WATER/JDSJ1/MapServer',
                queryTask: 'http://43.254.226.73:6080/arcgis/rest/services/WATER/JDSJ1/MapServer/4',
                featureLayer: 'http://43.254.226.73:6080/arcgis/rest/services/WATER/JDSJ1/MapServer/4'
            }
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
            // // 初始化属性查询
            // let queryTask = new QueryTask({
            //     url: this.mapService.queryTask
            // });
            // let query = new Query({
            //     where: "Invert_El >=3",
            //     outFields: ["NAME"],
            //     returnGeometry: true
            // });
            // queryTask.execute(query).then(result => {
            //     console.log(result)
            // })
            // .catch(error => console.log(error.message))

            // 初始化空间查询
            // 添加空间查询按钮
            let el = document.createElement("button");
            el.innerText = "queryTask多边形查询";
            this.currentView.ui.add(el,"top-right");
            let _this = this;
            el.onclick = function(){
                this.addDraw()
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
        /***
         * IdentifyTask
         */
        identifyQuery: function() {
            //定义空间查询对象，注意他的参数是整个地图服务，而不是单个图层
            var identifyTask = new IdentifyTask(MapServer);
            //定义空间查询参数对象
            params = new this.IdentifyParameters();
            params.tolerance = 3;
            params.layerIds = [0, 1, 2];
            params.layerOption = "top";
            params.width = view.width;
            params.height = view.height;
            //空间查询的几何对象
            params.geometry = geometry;
            params.mapExtent = map.extent;
            //执行空间查询
            identifyTask.execute(params, showQueryResult);
        },
        /**
         * 创建graphic
         */
        createGraphic:function(geometry,symbol,attribute=null,popupTemplate=null){
            return new this.Grahic({
                geometry: geometry,
                symbol: symbol,
                attributes: attribute,
                popupTemplate: popupTemplate 
            })
        }
    },
    mounted() {
        const options = {
            // url: 'http://localhost:8080/arcgis_js_api/library/4.10/dojo/dojo.js'
            url: 'http://localhost/arcgis_js_api/library/4.11/dojo/dojo.js'
        }
        esriLoader.loadModules([
            'esri/Map',
            "esri/Graphic",
            'esri/views/MapView',
            "esri/layers/GraphicsLayer",
            "esri/layers/MapImageLayer",
            "esri/layers/FeatureLayer",
            "esri/widgets/Sketch",

            "esri/views/draw/Draw",
            "esri/geometry/Polygon",

            "esri/tasks/IdentifyTask",
            "esri/tasks/support/IdentifyParameters",
            "esri/tasks/FindTask",
            "esri/tasks/support/FindParameters",
            "esri/tasks/QueryTask", 
            "esri/tasks/support/Query"
        ], options).then(([Map,Graphic, MapView, GraphicsLayer, MapImageLayer, FeatureLayer, Sketch,
            Draw,Polygon,
            IdentifyTask, IdentifyParameters,
            FindTask, FindParameters,QueryTask,Query
        ]) => {
            this.Map = Map;
            this.Grahic = Graphic;
            this.MapView = MapView;
            this.GraphicsLayer = GraphicsLayer;
            this.Sketch = Sketch;
            this.IdentifyTask = IdentifyTask;
            this.IdentifyParameters = IdentifyParameters;
            this.initMap();
            // this.addDrawSketch();
            this.addFindTask(FindTask, FindParameters);
            this.addDraw(Draw,Polygon);
            this.addQueryTask(QueryTask,Query);
            // this.addMapImageLayer(MapImageLayer);
            this.addFeatureLayer(FeatureLayer);
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
