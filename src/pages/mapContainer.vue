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
      MapView: null,
      GraphicsLayer: null,
      Sketch: null,
      IdentifyTask:null,
      IdentifyParameters:null,

      currentView: null,
      currentMap: null,
      graphicLayer:null
    }
  },
  computed:{
    mapService(){
      return {
        imageryLayer:'http://43.254.226.73:6080/arcgis/rest/services/WATER/JDSJ1/MapServer',
        featureLayer: 'http://43.254.226.73:6080/arcgis/rest/services/WATER/JDSJ1/MapServer'
      }
    }
  },
  methods:{
    /**
     * 地图初始化
     */
    initMap: function(){
      this.graphicLayer = new this.GraphicsLayer();
      // 初始化地图
      this.currentMap = new this.Map({
        basemap: 'satellite',
        layers: [this.graphicLayer]
      });
      this.currentView = new this.MapView({
        map: this.currentMap,
        container: "map",
        center: [121.25603683642646,31.328719717068733],
        zoom: 18
      });
      this.currentView.ui.remove("attribution");
    },
    /**
     * 添加sketch绘制工具
     */
    addDrawSketch:function(){
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
    addFindTaskWidget:function(FindTask,FindParameters){
      let element = document.createElement("input");
      element.className = "inputFindTask";
      let findTask = new FindTask({
        url:'http://43.254.226.73:6080/arcgis/rest/services/WATER/JDSJ1/MapServer/4'
      });
      let findParameters = new FindParameters({
        searchText: element.value,
        layerIds: [0],
        searchFields: ["NAME"],
        returnGeometry: true
      });
      element.onkeyup = function(e){
        if(e.keyCode == 13){
          findTask.execute(findParameters)
          .then(result => console.log(result))
          .catch(error => console.log(error.message))
        }
      }
      this.currentView.ui.add(element, "top-right");
    },
    /**
     * 添加栅格图层
     */
    addMapImageLayer:function(MapImageLayer){
      let layer = new MapImageLayer({
        url: this.mapService.imageryLayer
      });
      this.currentMap.add(layer);  // adds the layer to the map
    },
    /**
     * 添加矢量图层
     */
    addFeatureLayer:function(FeatureLayer){
      const layer = FeatureLayer({
        url: this.mapService.featureLayer
      })
      this.currentMap.add(layer);
    },
    /**
     * 视图添加监视
     */
    addViewListener:function(){
      this.currentView.on('click',function(data){
        console.log(data)
      })
    },
    /***
     * IdentifyTask
     */
    identifyQuery:function(){
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
      identifyTask.execute(params,showQueryResult);
    }
  },
  mounted () {
      const options = { 
        url: 'http://localhost:8080/arcgis_js_api/library/4.10/dojo/dojo.js'
      }
      esriLoader.loadModules([
          'esri/Map',
          'esri/views/MapView',
          "esri/layers/GraphicsLayer",
          "esri/layers/MapImageLayer",
          "esri/layers/FeatureLayer",
          "esri/widgets/Sketch",
          "esri/tasks/IdentifyTask",
          "esri/tasks/support/IdentifyParameters",
          "esri/tasks/FindTask",
          "esri/tasks/support/FindParameters"
      ],options).then(([Map,MapView,GraphicsLayer,MapImageLayer,FeatureLayer,Sketch,
      IdentifyTask,IdentifyParameters,
      FindTask,FindParameters])=>{
          this.Map=Map;
          this.MapView=MapView;
          this.GraphicsLayer=GraphicsLayer;
          this.Sketch=Sketch;
          this.IdentifyTask = IdentifyTask;
          this.IdentifyParameters = IdentifyParameters;
          this.initMap();
          // this.addDrawSketch();
          this.addFindTaskWidget(FindTask,FindParameters);
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


